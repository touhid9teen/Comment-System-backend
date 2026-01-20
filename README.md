# 💬 Ultimate Comment System Backend

> A high-performance, real-time, and secure backend for a modern comment system. Built with Node.js, Express, TypeScript, and MongoDB.

![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white)
![Redis](https://img.shields.io/badge/redis-%23DD0031.svg?style=for-the-badge&logo=redis&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-black?style=for-the-badge&logo=socket.io&badgeColor=010101)
![JWT](https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=JSON%20web%20tokens)

## 🚀 Features

- **🔐 Robust Authentication**
  - **Google OAuth 2.0**: Secure login via Passport.js strategy.
  - **JWT Authentication**: Access and Refresh token rotation for secure, persistent sessions.
  - **Security**: HttpOnly cookies and XSS protection.

- **⚡ Real-time Interactivity (Socket.IO)**
  - **Instant Updates**: Comments appear instantly for all connected users.
  - **Live Reactions**: Upvotes/downvotes update in real-time.
  - **Typing & Status**: (Ready for expansion)
  - _See [REALTIME.md](./REALTIME.md) for full WebSocket API details._

- **📝 Advanced Comment Management**
  - **CRUD Operations**: Create, Read, Update, Delete comments.
  - **Nested Replies**: Support for threaded conversations (flattened UI optimization supported).
  - **Pagination**: Efficient loading of comments using cursor or offset-based pagination.
  - **Rich Text Support**: (Backend ready for sanitized HTML/Markdown).

- **🛡️ Enterprise-Grade Security**
  - **Helmet**: Secures HTTP headers.
  - **CORS**: Configurable Cross-Origin Resource Sharing.
  - **Rate Limiting**: Protects against brute-force and DDoS attacks.
  - **Data Sanitization**: Prevents MongoDB injection and XSS attacks.

- **🏗️ Architectural Excellence**
  - **TypeScript**: Fully typed codebase for reliability and maintainability.
  - **Modular Structure**: Separation of concerns (Controllers, Services, Routes, Models).
  - **Redis Caching**: High-performance session storage and potential query caching.
  - **Environment Validation**: Strict type-checking of environment variables on startup.

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Caching**: Redis
- **Real-time**: Socket.IO
- **Auth**: Passport.js, Google OAuth, JWT
- **Validation**: Express-validator, Zod (internal)

## 📦 Installation

### Prerequisites

- Node.js (v18+)
- MongoDB (Local or Atlas)
- Redis server

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/comment-system-backend.git
cd comment-system-backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory. Copy the structure below:

```env
# Application
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://example.com

# Database
MONGODB_URI=mongodb://localhost:27017/comment-system

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_USERNAME=

# Authentication (Google OAuth)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# JWT Security
JWT_SECRET=your_super_secret_key
JWT_EXPIRE=15m
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRE=7d

# WebSocket
WS_PORT=5001 # Optional, defaults to sharing HTTP port if not split
SESSION_SECRET=your_session_secret
SERVER_URL=SERVER_URL
```

### 4. Build and Run

**Development Mode (with Hot Reload):**

```bash
npm run dev
```

**Production Build:**

```bash
npm run build
npm start
```

## 🔌 API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint           | Description                            |
| ------ | ------------------ | -------------------------------------- |
| GET    | `/google`          | Initiate Google OAuth flow             |
| GET    | `/google/callback` | Handle OAuth callback                  |
| POST   | `/refresh-token`   | Refresh access token using cookie      |
| POST   | `/logout`          | Logout user and clear cookies          |
| GET    | `/me`              | Get current authenticated user details |

### Comments (`/api/comments`)

| Method | Endpoint       | Description                        |
| ------ | -------------- | ---------------------------------- |
| GET    | `/`            | Get top-level comments (Paginated) |
| POST   | `/`            | Create a new comment               |
| GET    | `/:id`         | Get a specific comment             |
| PATCH  | `/:id`         | Update a comment                   |
| DELETE | `/:id`         | Delete a comment                   |
| POST   | `/:id/react`   | Upvote/Downvote a comment          |
| GET    | `/:id/replies` | Get replies for a specific comment |

## 📁 Project Structure

```
src/
├── config/         # App configuration (Env, DB, Passport, Socket)
├── controllers/    # Request handlers
├── middleware/     # Auth, Error handling, Sanitization
├── models/         # Mongoose schemas (User, Comment)
├── routes/         # API route definitions
├── services/       # Business logic layer
├── validation/     # Request validation schemas
├── types/          # TypeScript type definitions
└── index.ts        # App entry point
```

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
