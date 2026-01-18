import mongoose from "mongoose";
import { createClient } from "redis";
import { config } from "./env.js";

export const connectMongoDB = async () => {
  try {
    if (config.NODE_ENV === "development") {
      mongoose.set("debug", true);
    }
    await mongoose.connect(config.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
};

// Redis Connection
export const redisClient = createClient({
  username: config.REDIS_USERNAME,
  password: config.REDIS_PASSWORD,
  socket: {
    host: config.REDIS_HOST,
    port: config.REDIS_PORT,
  },
});

export const connectRedis = async (): Promise<void> => {
  try {
    await redisClient.connect();
    redisClient.on("error", (err) => {
      console.error("Redis connection error:", err);
    });

    redisClient.on("reconnecting", () => {
      console.log("Redis reconnecting...");
    });
  } catch (error) {
    console.error("Redis connection error:", error);
  }
};

export const closeConnections = async () => {
  try {
    await mongoose.connection.close();
    await redisClient.quit();
    console.log("MongoDB connection closed");
  } catch (error) {
    console.error("MongoDB connection close error:", error);
  }
};
