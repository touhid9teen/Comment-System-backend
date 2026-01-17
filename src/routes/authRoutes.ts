import express from "express";
import authController from "../controllers/authController.js";
import { verifyOAuthToken } from "../middleware/authMiddleware.js";
import {
  validateGoogleAuth,
  handleValidationErrors,
} from "../validation/authValidation.js";

const router = express.Router();

// Public routes

import passport from "passport";

// Google OAuth Routes
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/login",
  }),
  authController.googleCallback,
);

// Manual Google Token Verification (Keep if needed for mobile/other clients)
router.post(
  "/google/token",
  validateGoogleAuth,
  handleValidationErrors,
  authController.googleAuth,
);

router.post("/refresh-token", authController.refreshToken);

// Protected routes
router.post("/logout", verifyOAuthToken, authController.logout);
router.get("/me", verifyOAuthToken, authController.getCurrentUser);

export default router;
