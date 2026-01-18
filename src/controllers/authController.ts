import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import type { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import authService from "../services/authService.js";
import { config } from "../config/env.js";
import { redisClient } from "../config/database.js";

const googleClient = new OAuth2Client(config.GOOGLE_CLIENT_ID);

class AuthController {
  async googleCallback(req: Request, res: Response) {
    try {
      const user = req.user as any;
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Authentication failed",
        });
      }

      const { accessToken, refreshToken } = authService.generateTokens(user);
      await redisClient.setEx(
        `refresh:${user._id}`,
        7 * 24 * 60 * 60,
        refreshToken,
      );

      // Use secure cookies instead of query params
      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 15 * 60 * 1000, // 15 minutes
      });

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.redirect(`${config.CLIENT_URL}`);
    } catch (error) {
      console.error("Google callback error:", error);
      res.redirect(`${config.CLIENT_URL}/login?error=auth_failed`);
    }
  }

  // Google OAuth callback (manual token verification - kept for reference or mobile/frontend-only flows)
  async googleAuth(req: Request, res: Response) {
    try {
      const { token } = req.body;

      // Verify token with Google
      const ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: config.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        return res.status(401).json({
          success: false,
          message: "Invalid Google token payload",
        });
      }

      const profile = {
        id: payload.sub,
        email: payload.email!,
        name: payload.name!,
        avatar: payload.picture ?? null,
      };

      // Find or create user
      const user = await authService.findOrCreateOAuthUser(profile, "google");

      // Generate tokens
      const { accessToken, refreshToken } = authService.generateTokens(user);

      // Store refresh token in Redis
      await redisClient.setEx(
        `refresh:${user._id}`,
        7 * 24 * 60 * 60,
        refreshToken,
      );

      res.status(200).json({
        success: true,
        message: "Google authentication successful",
        data: {
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
            avatar: user.avatar,
            role: user.role,
          },
          accessToken,
          refreshToken,
        },
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      res.status(401).json({
        success: false,
        message: "Google authentication failed",
        error: errorMessage,
      });
    }
  }

  // Refresh access token
  async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: "Refresh token is required",
        });
      }

      const decoded = authService.verifyRefreshToken(refreshToken);
      if (!decoded || typeof decoded === "string" || !decoded.id) {
        return res.status(401).json({
          success: false,
          message: "Invalid refresh token",
        });
      }

      // Verify token in Redis
      const storedToken = await redisClient.get(`refresh:${decoded.id}`);
      if (storedToken !== refreshToken) {
        return res.status(401).json({
          success: false,
          message: "Refresh token mismatch",
        });
      }

      const user = await authService.getUserById(decoded.id);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not found",
        });
      }

      const tokens = authService.generateTokens(user);

      res.status(200).json({
        success: true,
        message: "Token refreshed successfully",
        data: tokens,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({
        success: false,
        message: "Token refresh failed",
        error: errorMessage,
      });
    }
  }

  // Logout
  async logout(req: Request, res: Response) {
    try {
      const token = req.token;
      const user = req.user;

      if (!token || !user) {
        return res.status(400).json({
          success: false,
          message: "User not authenticated",
        });
      }

      // Blacklist access token
      const decoded = jwt.decode(token) as JwtPayload | null;
      if (decoded && decoded.exp) {
        const ttl = decoded.exp - Math.floor(Date.now() / 1000);

        if (ttl > 0) {
          await redisClient.setEx(`blacklist:${token}`, ttl, "1");
        }
      }

      // Remove refresh token
      await redisClient.del(`refresh:${(user as any)._id}`);

      res.status(200).json({
        success: true,
        message: "Logged out successfully",
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({
        success: false,
        message: "Logout failed",
        error: errorMessage,
      });
    }
  }

  // Get current user
  async getCurrentUser(req: Request, res: Response) {
    try {
      res.status(200).json({
        success: true,
        data: req.user,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({
        success: false,
        message: "Failed to fetch user",
        error: errorMessage,
      });
    }
  }
}

const authController = new AuthController();
export default authController;
