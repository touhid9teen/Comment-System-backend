import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { config } from "./config/env.js";
import { connectMongoDB, connectRedis } from "./config/database.js";
import authRoutes from "./routes/authRoutes.js";

const app = express();

// Middleware
app.use(cors({ origin: config.CLIENT_URL, credentials: true }));
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Custom sanitization middleware (replaces express-mongo-sanitize)
app.use((req, res, next) => {
  const sanitizeObject = (obj: any): any => {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj !== "object") return obj;

    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }

    const sanitized: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        // Remove $ and . from keys to prevent MongoDB injection
        const sanitizedKey = key.replace(/^\$|^\./g, "");
        sanitized[sanitizedKey] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  };

  req.body = sanitizeObject(req.body);
  req.params = sanitizeObject(req.params);

  next();
});

// Database Connections
import passport from "passport";
import { configurePassport } from "./config/passport.js";

const initializeServices = async () => {
  await connectMongoDB();
  await connectRedis();
  configurePassport();
};

await initializeServices();

// Initialize Passport BEFORE routes
app.use(passport.initialize());

// Routes
app.use("/api/auth", authRoutes);

// Health check
app.get("/health", (_req, res) => {
  res.status(200).json({ success: true, message: "Server is running" });
});

// 404 Handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Global Error Handling Middleware
app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("Unhandled Error:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: config.NODE_ENV === "development" ? err.message : undefined,
    });
  }
);

const PORT = config.PORT;

app.listen(PORT, () => {
  console.log(`Server running in ${config.NODE_ENV} mode on port ${PORT}`);
});
