import express from "express";
import authController from "../controllers/authController.js";
import { verifyOAuthToken } from "../middleware/authMiddleware.js";
import {
  validateGoogleAuth,
  handleValidationErrors,
} from "../validation/authValidation.js";

const router = express.Router();

// Public routes
router.post(
  "/google",
  validateGoogleAuth,
  handleValidationErrors,
  authController.googleAuth,
);

router.post("/refresh-token", authController.refreshToken);

// Protected routes
router.post("/logout", verifyOAuthToken, authController.logout);
router.get("/me", verifyOAuthToken, authController.getCurrentUser);

export default router;
