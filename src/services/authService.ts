import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import User from "../models/User.js";
import type { IUser } from "../models/User.js";
import { config } from "../config/env.js";

interface OAuthProfile {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
}

class AuthService {
  // Generate JWT tokens
  generateTokens(user: IUser) {
    const accessToken = jwt.sign(
      {
        id: user._id?.toString(),
        email: user.email,
        role: user.role,
      },
      config.JWT_SECRET,
      {
        expiresIn: config.JWT_EXPIRE as any,
      },
    );

    const refreshToken = jwt.sign(
      {
        id: user._id?.toString(),
      },
      config.JWT_REFRESH_SECRET,
      {
        expiresIn: config.JWT_REFRESH_EXPIRE as any,
      },
    );

    return { accessToken, refreshToken };
  }

  // Find or create OAuth user
  async findOrCreateOAuthUser(
    profile: OAuthProfile,
    provider: "google",
  ): Promise<IUser> {
    try {
      let user = await User.findOne({
        oauthId: profile.id,
        oauthProvider: provider,
      });

      if (user) {
        return user;
      }

      // Check if user exists with same email
      user = await User.findOne({ email: profile.email });

      if (user) {
        user.oauthId = profile.id;
        user.oauthProvider = provider;
        if (profile.avatar) {
          user.avatar = profile.avatar;
        }
        await user.save();
        return user;
      }

      // Create new user
      user = new User({
        email: profile.email,
        name: profile.name,
        avatar: profile.avatar ?? null,
        oauthProvider: provider,
        oauthId: profile.id,
        isEmailVerified: true,
      });

      await user.save();
      return user;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`OAuth user creation failed: ${error.message}`);
      }
      throw new Error("OAuth user creation failed");
    }
  }

  // Verify access token
  verifyAccessToken(token: string): JwtPayload | null {
    try {
      return jwt.verify(token, config.JWT_SECRET) as JwtPayload;
    } catch {
      return null;
    }
  }

  // Verify refresh token
  verifyRefreshToken(token: string): JwtPayload | null {
    try {
      return jwt.verify(token, config.JWT_REFRESH_SECRET) as JwtPayload;
    } catch {
      return null;
    }
  }

  // Get user by ID
  async getUserById(userId: string): Promise<IUser | null> {
    try {
      return await User.findById(userId).select("-password");
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to fetch user: ${error.message}`);
      }
      throw new Error("Failed to fetch user");
    }
  }
}

const authService = new AuthService();
export default authService;
