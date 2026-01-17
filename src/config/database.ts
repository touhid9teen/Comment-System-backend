import mongoose from "mongoose";
import { createClient } from "redis";

export const connectMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
};

// Redis Connection
export const redisClient = createClient({
  username: process.env.REDIS_USERNAME!,
  password: process.env.REDIS_PASSWORD!,
  socket: {
    host: process.env.REDIS_HOST!,
    port: parseInt(process.env.REDIS_PORT!),
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
