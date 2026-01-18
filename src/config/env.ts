import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// ESM __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../../.env") });

interface EnvConfig {
  NODE_ENV: string;
  PORT: number;
  CLIENT_URL: string;

  MONGODB_URI: string;

  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;

  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_PASSWORD: string;
  REDIS_USERNAME: string;

  JWT_SECRET: string;
  JWT_EXPIRE: string;
  JWT_REFRESH_SECRET: string;
  JWT_REFRESH_EXPIRE: string;

  BCRYPT_ROUNDS: number;
  WS_PORT: number;
  SESSION_SECRET: string;
  ALLOWED_ORIGINS: string[];
}

export const config: EnvConfig = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "4000", 10),
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:3000",

  MONGODB_URI: process.env.MONGODB_URI || "",

  REDIS_HOST: process.env.REDIS_HOST || "localhost",
  REDIS_PORT: parseInt(process.env.REDIS_PORT || "6379", 10),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || "",
  REDIS_USERNAME: process.env.REDIS_USERNAME || "",

  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "",

  JWT_SECRET: process.env.JWT_SECRET || "",
  JWT_EXPIRE: process.env.JWT_EXPIRE || "1d",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "",
  JWT_REFRESH_EXPIRE: process.env.JWT_REFRESH_EXPIRE || "7d",

  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS || "10", 10),
  WS_PORT: parseInt(process.env.WS_PORT || "5000", 10),
  SESSION_SECRET: process.env.SESSION_SECRET || "",
  ALLOWED_ORIGINS: (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .filter(Boolean),
};

// Validate critical environment variables
const validateEnv = (): void => {
  const requiredVars = ["JWT_SECRET", "JWT_REFRESH_SECRET", "MONGODB_URI"];

  const missing = requiredVars.filter((varName) => !process.env[varName]);

  if (missing.length > 0 && config.NODE_ENV === "production") {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
  }
};

validateEnv();
