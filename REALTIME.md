# Real-time Comment System with WebSocket

This backend now supports real-time commenting using **Socket.IO**! Any changes to comments (create, update, delete, reactions) are instantly broadcast to all connected clients.

## 🚀 Features

- ✅ Real-time comment creation
- ✅ Real-time comment updates
- ✅ Real-time comment deletions
- ✅ Real-time like/dislike reactions
- ✅ Thread-specific subscriptions (only get updates for comments you're viewing)
- ✅ JWT authentication support for WebSocket connections
- ✅ Anonymous connections allowed (read-only)

## 📡 WebSocket Events

### Events emitted by the server:

| Event             | Description                                       | Payload                                 |
| ----------------- | ------------------------------------------------- | --------------------------------------- |
| `comment:created` | New comment was created                           | Full comment object with user data      |
| `comment:updated` | Comment was edited                                | Updated comment object                  |
| `comment:deleted` | Comment was deleted                               | `{ id: string }`                        |
| `comment:reacted` | Comment was liked/disliked                        | Full comment object with updated counts |
| `comment:reply`   | New reply to a specific comment (thread-specific) | Full reply object                       |

### Events you can emit to the server:

| Event          | Description                                           | Payload             |
| -------------- | ----------------------------------------------------- | ------------------- |
| `join:thread`  | Subscribe to updates for a specific comment's replies | `commentId: string` |
| `leave:thread` | Unsubscribe from a comment thread                     | `commentId: string` |

## 🔧 Quick Start

### 1. Test with HTML Client

Open `websocket-test.html` in your browser to see real-time events:

```bash
# Just open the file in your browser
open websocket-test.html
```

### 2. Test with React Hook

Copy `examples/useCommentSocket.ts` to your React/Next.js project:

```typescript
import { useCommentSocket } from './hooks/useCommentSocket';

function CommentSection() {
  const { isConnected, comments, joinThread, leaveThread } = useCommentSocket({
    token: localStorage.getItem('authToken'),
    serverUrl: 'http://localhost:5000'
  });

  return (
    <div>
      <div>Status: {isConnected ? '🟢 Live' : '⚫ Offline'}</div>
      {/* Your comment UI */}
    </div>
  );
}
```

### 3. Manual Connection (Vanilla JS)

```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:5000", {
  auth: {
    token: "YOUR_JWT_TOKEN", // Optional
  },
});

socket.on("comment:created", (comment) => {
  console.log("New comment:", comment);
});
```

## 🔐 Authentication

WebSocket connections support JWT authentication:

```javascript
const socket = io("http://localhost:5000", {
  auth: {
    token: localStorage.getItem("authToken"),
  },
});
```

- **With token**: User context is attached to the socket (for future features)
- **Without token**: Anonymous connection (can still receive updates)

## 💡 Best Practices

### 1. Join threads only when needed

```javascript
// When user clicks "Show Replies"
function showReplies(commentId) {
  socket.emit("join:thread", commentId);
  setShowingReplies(true);
}

// When user hides replies or navigates away
function hideReplies(commentId) {
  socket.emit("leave:thread", commentId);
  setShowingReplies(false);
}
```

### 2. Optimistic UI updates

Update your UI immediately, then sync with WebSocket events:

```javascript
async function createComment(content) {
  // 1. Optimistically add to UI
  const tempComment = { id: "temp", content, user: currentUser };
  setComments([tempComment, ...comments]);

  // 2. Send to server
  const response = await fetch("/api/comments", {
    method: "POST",
    body: JSON.stringify({ content }),
  });

  // 3. WebSocket will broadcast the real comment to all clients
  // (including you), which will replace the temp one
}
```

### 3. Handle reconnections

```javascript
socket.on("connect", () => {
  console.log("Reconnected! Refreshing data...");
  // Optionally refetch data to ensure sync
  fetchComments();
});
```

## 📚 Documentation

- **[WEBSOCKET.md](./WEBSOCKET.md)** - Complete WebSocket API documentation
- **[examples/useCommentSocket.ts](./examples/useCommentSocket.ts)** - React Hook example
- **[websocket-test.html](./websocket-test.html)** - Interactive test client

## 🐛 Debugging

Check logs in the terminal:

```bash
npm run dev
```

You'll see:

```
Server running in development mode on port 5000
WebSocket server initialized
Client connected: abc123 (User: 507f1f77bcf86cd799439011)
Socket abc123 joined thread:507f191e810c19729de860ea
```

## 🔄 How It Works

1. **Client connects** to `ws://localhost:5000`
2. **Server authenticates** (optional) using JWT from `auth.token`
3. **Client subscribes** to events (`comment:created`, `comment:updated`, etc.)
4. **When a comment changes**:
   - CommentService calls the socket emitter (`emitCommentCreated`, etc.)
   - Server broadcasts to all connected clients
   - Clients update their UI in real-time

## 🎯 Next Steps

- [ ] Add typing indicators ("User is typing...")
- [ ] Add online user count
- [ ] Add user presence (who's viewing which comments)
- [ ] Add private messages between users
- [ ] Add moderation events (admin actions broadcast to moderators)

## 📦 Dependencies

- `socket.io` - WebSocket server
- `socket.io-client` - Client library (for frontend)

Already installed! No additional setup required.
