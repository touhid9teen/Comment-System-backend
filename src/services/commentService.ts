import { Comment } from "../models/Comment.js";
import type { IComment } from "../models/Comment.js";
import User from "../models/User.js";
import { AppError } from "../middleware/errorHandler.js";
import { Types } from "mongoose";
import { redisClient } from "../config/database.js";
import {
  emitCommentCreated,
  emitCommentUpdated,
  emitCommentDeleted,
  emitCommentReacted,
} from "../config/socket.js";

interface CreateCommentData {
  userId: string;
  content: string;
  parentId?: string | null | undefined;
}

interface UpdateCommentData {
  content: string;
}

interface ReactCommentData {
  userId: string;
  type: "like" | "dislike";
}

interface GetCommentsOptions {
  page?: number | undefined;
  limit?: number | undefined;
  sortBy?: "newest" | "most-liked" | "most-disliked" | undefined;
  parentId?: string | null | undefined;
}

interface CommentWithUser extends Omit<IComment, "userId"> {
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  replyCount: number;
}

export class CommentService {
  private readonly CACHE_TTL = 300; // 5 minutes

  // Create new comment
  async createComment(data: CreateCommentData): Promise<IComment> {
    const { userId, content, parentId } = data;

    // Validate user exists
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    // If reply, validate parent comment exists
    if (parentId) {
      const parentComment = await Comment.findById(parentId);
      if (!parentComment || parentComment.isDeleted) {
        throw new AppError("Parent comment not found", 404);
      }
    }

    const comment = await Comment.create({
      userId: new Types.ObjectId(userId),
      content,
      parentId: parentId ? new Types.ObjectId(parentId) : null,
    });

    // Populate user data for socket emission
    await comment.populate("userId", "name email avatar");

    // Invalidate cache
    await this.invalidateCommentsCache();

    // Emit socket event for real-time update
    emitCommentCreated(comment.toJSON());

    return comment;
  }

  // Get comments with pagination and sorting
  async getComments(options: GetCommentsOptions = {}): Promise<{
    comments: CommentWithUser[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      limit = 10,
      sortBy = "newest",
      parentId = null,
    } = options;

    const skip = (page - 1) * limit;

    // Build query
    const query: any = {
      isDeleted: false,
      parentId: parentId ? new Types.ObjectId(parentId) : null,
    };

    // Build sort
    let sort: any = {};
    switch (sortBy) {
      case "most-liked":
        sort = { likes: -1, createdAt: -1 };
        break;
      case "most-disliked":
        sort = { dislikes: -1, createdAt: -1 };
        break;
      case "newest":
      default:
        sort = { createdAt: -1 };
    }

    // Try to get from cache
    const cacheKey = `comments:${parentId || "root"}:${sortBy}:${page}:${limit}`;
    const cached = await this.getFromCache(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    // Fetch from database with aggregation for replyCount
    const pipeline: any[] = [
      { $match: query },
      { $sort: sort },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: "comments",
          localField: "_id",
          foreignField: "parentId",
          pipeline: [{ $match: { isDeleted: false } }], // Only count non-deleted
          as: "replies",
        },
      },
      {
        $addFields: {
          replyCount: { $size: "$replies" },
        },
      },
      {
        $project: {
          replies: 0,
        },
      },
    ];

    const [commentsRaw, total] = await Promise.all([
      Comment.aggregate(pipeline),
      Comment.countDocuments(query),
    ]);

    await Comment.populate(commentsRaw, {
      path: "userId",
      select: "name email avatar",
    });

    // Transform comments to include user data
    const commentsWithUser: CommentWithUser[] = commentsRaw.map(
      (comment: any) => ({
        ...comment,
        id: comment._id.toString(),
        userId: comment.userId?._id?.toString() || "", // Handle potential pop failure
        user: {
          id: comment.userId?._id?.toString() || "",
          name: comment.userId?.name || "Unknown",
          email: comment.userId?.email || "",
          avatar: comment.userId?.avatar,
        },
        replyCount: comment.replyCount || 0,
      }),
    );

    const result = {
      comments: commentsWithUser,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };

    // Cache result
    await this.setCache(cacheKey, JSON.stringify(result));

    return result;
  }

  // Get comment by ID with nested replies
  async getCommentById(commentId: string): Promise<CommentWithUser | null> {
    const comment = await Comment.findOne({
      _id: new Types.ObjectId(commentId),
      isDeleted: false,
    })
      .populate("userId", "name email avatar")
      .lean();

    if (!comment) {
      return null;
    }

    const replyCount = await Comment.countDocuments({
      parentId: comment._id,
      isDeleted: false,
    });

    return {
      ...comment,
      id: (comment as any)._id.toString(),
      userId: (comment as any).userId._id.toString(),
      user: {
        id: (comment as any).userId._id.toString(),
        name: (comment as any).userId.name,
        email: (comment as any).userId.email,
        avatar: (comment as any).userId.avatar,
      },
      replyCount,
    } as unknown as CommentWithUser;
  }

  // Update comment
  async updateComment(
    commentId: string,
    userId: string,
    data: UpdateCommentData,
  ): Promise<IComment> {
    const comment = await Comment.findOne({
      _id: new Types.ObjectId(commentId),
      isDeleted: false,
    });

    if (!comment) {
      throw new AppError("Comment not found", 404);
    }

    // Check ownership
    if (comment.userId.toString() !== userId) {
      throw new AppError("Not authorized to update this comment", 403);
    }

    comment.content = data.content;
    comment.isEdited = true;
    comment.editedAt = new Date();

    await comment.save();
    await comment.populate("userId", "name email avatar");

    // Invalidate cache
    await this.invalidateCommentsCache();

    // Emit socket event for real-time update
    emitCommentUpdated(comment.toJSON());

    return comment;
  }

  // Delete comment (soft delete)
  async deleteComment(commentId: string, userId: string): Promise<void> {
    const comment = await Comment.findOne({
      _id: new Types.ObjectId(commentId),
      isDeleted: false,
    });

    if (!comment) {
      throw new AppError("Comment not found", 404);
    }

    // Check ownership
    if (comment.userId.toString() !== userId) {
      throw new AppError("Not authorized to delete this comment", 403);
    }

    comment.isDeleted = true;
    await comment.save();

    // Invalidate cache
    await this.invalidateCommentsCache();

    // Emit socket event for real-time update
    emitCommentDeleted(
      commentId,
      comment.parentId ? comment.parentId.toString() : undefined,
    );
  }

  // React to comment (like/dislike)
  async reactToComment(
    commentId: string,
    data: ReactCommentData,
  ): Promise<IComment> {
    const { userId, type } = data;
    const userObjectId = new Types.ObjectId(userId);

    const comment = await Comment.findOne({
      _id: new Types.ObjectId(commentId),
      isDeleted: false,
    });

    if (!comment) {
      throw new AppError("Comment not found", 404);
    }

    // Remove from opposite array if exists
    if (type === "like") {
      comment.dislikes = comment.dislikes.filter(
        (id) => id.toString() !== userId,
      );

      // Toggle like
      const likeIndex = comment.likes.findIndex(
        (id) => id.toString() === userId,
      );

      if (likeIndex > -1) {
        comment.likes.splice(likeIndex, 1);
      } else {
        comment.likes.push(userObjectId);
      }
    } else {
      comment.likes = comment.likes.filter((id) => id.toString() !== userId);

      // Toggle dislike
      const dislikeIndex = comment.dislikes.findIndex(
        (id) => id.toString() === userId,
      );

      if (dislikeIndex > -1) {
        comment.dislikes.splice(dislikeIndex, 1);
      } else {
        comment.dislikes.push(userObjectId);
      }
    }

    await comment.save();
    await comment.populate("userId", "name email avatar");

    // Invalidate cache
    await this.invalidateCommentsCache();

    // Emit socket event for real-time update
    emitCommentReacted(comment.toJSON());

    return comment;
  }

  // Get nested replies for a comment
  async getReplies(
    parentId: string,
    options: GetCommentsOptions = {},
  ): Promise<{
    comments: CommentWithUser[];
    total: number;
  }> {
    const result = await this.getComments({
      ...options,
      parentId,
    });

    return {
      comments: result.comments,
      total: result.total,
    };
  }

  // Cache helpers
  private async getFromCache(key: string): Promise<string | null> {
    try {
      return await redisClient.get(key);
    } catch (error) {
      console.error("Redis get error:", error);
      return null;
    }
  }

  private async setCache(key: string, value: string): Promise<void> {
    try {
      await redisClient.setEx(key, this.CACHE_TTL, value);
    } catch (error) {
      console.error("Redis set error:", error);
    }
  }

  private async invalidateCommentsCache(): Promise<void> {
    try {
      const keys = await redisClient.keys("comments:*");
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    } catch (error) {
      console.error("Redis invalidate error:", error);
    }
  }
}
