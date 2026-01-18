import mongoose, { Schema, Document, Types } from "mongoose";

export interface IUser extends Document {
  _id: Types.ObjectId;
  id: string; // Add this for convenience
  name: string;
  email: string;
  password?: string | null;
  avatar?: string | null;
  oauthProvider: "google" | "local";
  oauthId?: string | null;
  isEmailVerified: boolean;
  isActive: boolean;
  role: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    avatar: {
      type: String,
      default: null,
    },
    oauthProvider: {
      type: String,
      enum: ["google", "local"],
      default: "local",
    },
    oauthId: {
      type: String,
      unique: true,
      sparse: true,
      default: null,
    },
    password: {
      type: String,
      default: null,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

userSchema.index({ oauthId: 1, oauthProvider: 1 });

const User = mongoose.model<IUser>("User", userSchema);

export default User;
