// useCommentSocket.ts - Custom React Hook for WebSocket Integration
import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

interface Comment {
  id: string;
  content: string;
  parentId: string | null;
  likes: string[];
  dislikes: string[];
  isDeleted: boolean;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  replyCount: number;
}

interface UseCommentSocketOptions {
  serverUrl?: string;
  token?: string;
  autoConnect?: boolean;
}

export const useCommentSocket = (options: UseCommentSocketOptions = {}) => {
  const {
    serverUrl = "http://localhost:5000",
    token,
    autoConnect = true,
  } = options;

  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);

  useEffect(() => {
    if (!autoConnect) return;

    // Initialize socket connection
    const socketOptions: any = {
      transports: ["websocket", "polling"],
    };

    if (token) {
      socketOptions.auth = { token };
    }

    const socket = io(serverUrl, socketOptions);
    socketRef.current = socket;

    // Connection events
    socket.on("connect", () => {
      console.log("✅ Connected to WebSocket server");
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("❌ Disconnected from WebSocket server");
      setIsConnected(false);
    });

    socket.on("connect_error", (error) => {
      console.error("Connection error:", error);
    });

    // Comment events
    socket.on("comment:created", (comment: Comment) => {
      console.log("New comment received:", comment);
      setComments((prev) => [comment, ...prev]);
    });

    socket.on("comment:updated", (updatedComment: Comment) => {
      console.log("Comment updated:", updatedComment);
      setComments((prev) =>
        prev.map((c) => (c.id === updatedComment.id ? updatedComment : c)),
      );
    });

    socket.on("comment:deleted", ({ id }: { id: string }) => {
      console.log("Comment deleted:", id);
      setComments((prev) => prev.filter((c) => c.id !== id));
    });

    socket.on("comment:reacted", (reactedComment: Comment) => {
      console.log("Comment reacted:", reactedComment);
      setComments((prev) =>
        prev.map((c) => (c.id === reactedComment.id ? reactedComment : c)),
      );
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [serverUrl, token, autoConnect]);

  const joinThread = (threadId: string) => {
    if (socketRef.current) {
      socketRef.current.emit("join:thread", threadId);
      console.log(`Joined thread: ${threadId}`);
    }
  };

  const leaveThread = (threadId: string) => {
    if (socketRef.current) {
      socketRef.current.emit("leave:thread", threadId);
      console.log(`Left thread: ${threadId}`);
    }
  };

  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  };

  return {
    socket: socketRef.current,
    isConnected,
    comments,
    setComments,
    joinThread,
    leaveThread,
    disconnect,
  };
};

// Example usage in a component:
/*
function CommentSection() {
  const token = localStorage.getItem('authToken');
  const { 
    isConnected, 
    comments, 
    setComments,
    joinThread,
    leaveThread 
  } = useCommentSocket({ 
    token,
    serverUrl: 'http://localhost:5000'
  });

  // Fetch initial comments
  useEffect(() => {
    fetch('/api/comments')
      .then(res => res.json())
      .then(data => setComments(data.data.comments));
  }, []);

  return (
    <div>
      <div>Status: {isConnected ? '🟢 Connected' : '⚫ Disconnected'}</div>
      {comments.map(comment => (
        <Comment 
          key={comment.id} 
          comment={comment}
          onViewReplies={(id) => joinThread(id)}
          onHideReplies={(id) => leaveThread(id)}
        />
      ))}
    </div>
  );
}
*/
