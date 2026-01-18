import { Server as HTTPServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { config } from "./env.js";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";

export interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

let io: SocketIOServer;

export const initializeSocket = (httpServer: HTTPServer): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: [config.CLIENT_URL, ...config.ALLOWED_ORIGINS],
      credentials: true,
      methods: ["GET", "POST"],
    },
  });

  // Authentication middleware for Socket.IO
  io.use((socket: any, next) => {
    try {
      const token =
        socket.handshake.auth.token ||
        socket.handshake.headers.authorization?.split(" ")[1];

      if (!token) {
        // Allow anonymous connections (they just can't perform authenticated actions)
        return next();
      }

      const decoded = jwt.verify(token, config.JWT_SECRET) as JwtPayload;

      if (decoded && typeof decoded === "object" && decoded.id) {
        socket.userId = decoded.id;
        socket.user = {
          id: decoded.id,
          email: decoded.email,
          name: decoded.name,
        };
      }

      next();
    } catch (error) {
      console.error("Socket authentication error:", error);
      next(); // Allow connection even if token is invalid
    }
  });

  io.on("connection", (socket: any) => {
    console.log(
      `Client connected: ${socket.id}${socket.userId ? ` (User: ${socket.userId})` : " (Anonymous)"}`,
    );

    // Join a room for a specific comment thread
    socket.on("join:thread", (threadId: string) => {
      socket.join(`thread:${threadId}`);
      console.log(`Socket ${socket.id} joined thread:${threadId}`);
    });

    // Leave a thread room
    socket.on("leave:thread", (threadId: string) => {
      socket.leave(`thread:${threadId}`);
      console.log(`Socket ${socket.id} left thread:${threadId}`);
    });

    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error("Socket.IO not initialized. Call initializeSocket first.");
  }
  return io;
};

// Event emitter helpers
export const emitCommentCreated = (comment: any) => {
  const io = getIO();

  // Emit to general comments room
  io.emit("comment:created", comment);

  // If it's a reply, also emit to the parent thread
  if (comment.parentId) {
    io.to(`thread:${comment.parentId}`).emit("comment:reply", comment);
  }
};

export const emitCommentUpdated = (comment: any) => {
  const io = getIO();
  io.emit("comment:updated", comment);

  if (comment.parentId) {
    io.to(`thread:${comment.parentId}`).emit("comment:updated", comment);
  }
};

export const emitCommentDeleted = (commentId: string, parentId?: string) => {
  const io = getIO();
  io.emit("comment:deleted", { id: commentId });

  if (parentId) {
    io.to(`thread:${parentId}`).emit("comment:deleted", { id: commentId });
  }
};

export const emitCommentReacted = (comment: any) => {
  const io = getIO();
  io.emit("comment:reacted", comment);

  if (comment.parentId) {
    io.to(`thread:${comment.parentId}`).emit("comment:reacted", comment);
  }
};
