import { Response } from "express";
import type { Request as AuthRequest } from "express"; // Using express Request as it is augmented in your types
import { CommentService } from "../services/commentService.js";
import { asyncHandler, AppError } from "../middleware/errorHandler.js";

const commentService = new CommentService();

/* ---------------- Create Comment ---------------- */
/* POST /api/comments */

export const createComment = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AppError("User not authenticated", 401);
    }

    const { content, parentId } = req.body as {
      content: string;
      parentId?: string;
    };

    const comment = await commentService.createComment({
      userId: req.user.id,
      content,
      parentId,
    });

    res.status(201).json({
      success: true,
      message: "Comment created successfully",
      data: { comment },
    });
  },
);

/* ---------------- Get All Comments ---------------- */
/* GET /api/comments */

export const getComments = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const page = req.query.page ? Number(req.query.page) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const sortBy = req.query.sortBy as
      | "newest"
      | "most-liked"
      | "most-disliked"
      | undefined;
    const parentId = req.query.parentId as string | undefined;

    const result = await commentService.getComments({
      page,
      limit,
      sortBy,
      parentId,
    });

    res.json({
      success: true,
      data: result,
    });
  },
);

/* ---------------- Get Comment By ID ---------------- */
/* GET /api/comments/:id */

export const getCommentById = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const comment = await commentService.getCommentById(id);

    if (!comment) {
      throw new AppError("Comment not found", 404);
    }

    res.json({
      success: true,
      data: { comment },
    });
  },
);

/* ---------------- Update Comment ---------------- */
/* PATCH /api/comments/:id */

export const updateComment = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AppError("User not authenticated", 401);
    }

    const { id } = req.params;
    const { content } = req.body as { content: string };

    const comment = await commentService.updateComment(id, req.user.id, {
      content,
    });

    res.json({
      success: true,
      message: "Comment updated successfully",
      data: { comment },
    });
  },
);

/* ---------------- Delete Comment ---------------- */
/* DELETE /api/comments/:id */

export const deleteComment = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AppError("User not authenticated", 401);
    }

    const { id } = req.params;

    await commentService.deleteComment(id, req.user.id);

    res.json({
      success: true,
      message: "Comment deleted successfully",
    });
  },
);

/* ---------------- React to Comment ---------------- */
/* POST /api/comments/:id/react */

export const reactToComment = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AppError("User not authenticated", 401);
    }

    const { id } = req.params;
    const { type } = req.body as { type: "like" | "dislike" };

    const comment = await commentService.reactToComment(id, {
      userId: req.user.id,
      type,
    });

    res.json({
      success: true,
      message: "Reaction updated successfully",
      data: { comment },
    });
  },
);

/* ---------------- Get Replies ---------------- */
/* GET /api/comments/:id/replies */

export const getReplies = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const page = req.query.page ? Number(req.query.page) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const sortBy = req.query.sortBy as
      | "newest"
      | "most-liked"
      | "most-disliked"
      | undefined;

    const result = await commentService.getReplies(id, {
      page,
      limit,
      sortBy,
    });

    res.json({
      success: true,
      data: result,
    });
  },
);
