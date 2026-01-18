import mongoose, { Schema, Document, Types } from "mongoose";

export interface IComment extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  content: string;
  parentId: Types.ObjectId | null;
  likes: Types.ObjectId[];
  dislikes: Types.ObjectId[];
  isDeleted: boolean;
  isEdited: boolean;
  editedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    content: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 2000,
    },

    parentId: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },

    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    dislikes: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    isDeleted: {
      type: Boolean,
      default: false,
    },

    isEdited: {
      type: Boolean,
      default: false,
    },

    editedAt: Date,
  },
  {
    timestamps: true,

    toJSON: {
      virtuals: true,
      transform: (_doc, ret: any) => {
        ret.id = ret._id.toString();

        ret.userId = ret.userId ? ret.userId.toString() : null;
        ret.parentId = ret.parentId ? ret.parentId.toString() : null;

        ret.likes = ret.likes?.map((id: Types.ObjectId) => id.toString()) || [];
        ret.dislikes =
          ret.dislikes?.map((id: Types.ObjectId) => id.toString()) || [];

        delete ret._id;
        delete ret.__v;

        return ret;
      },
    },
  },
);

// Compound indexes for efficient queries
commentSchema.index({ createdAt: -1 });
commentSchema.index({ parentId: 1, createdAt: -1 });
commentSchema.index({ userId: 1 });
commentSchema.index({ isDeleted: 1, parentId: 1 });

export const Comment = mongoose.model<IComment>("Comment", commentSchema);
