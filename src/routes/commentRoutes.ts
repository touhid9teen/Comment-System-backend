import { Router } from "express";
import {
  validateCreateComment,
  validateGetComments,
  validateGetCommentById,
  validateUpdateComment,
  validateDeleteComment,
  validateReactComment,
  validateGetReplies,
  handleValidationErrors,
} from "../validation/commentValidation.js";

import {
  createComment,
  getComments,
  getCommentById,
  updateComment,
  deleteComment,
  reactToComment,
  getReplies,
} from "../controllers/commentController.js";
import {
  verifyOAuthToken,
  optionalAuth,
} from "../middleware/authMiddleware.js";

const router = Router();

/* Create comment */
router.post(
  "/",
  verifyOAuthToken,
  validateCreateComment,
  handleValidationErrors,
  createComment,
);

/* Get all comments */
router.get(
  "/",
  optionalAuth,
  validateGetComments,
  handleValidationErrors,
  getComments,
);

/* Get comment by ID */
router.get(
  "/:id",
  optionalAuth,
  validateGetCommentById,
  handleValidationErrors,
  getCommentById,
);

/* Update comment */
router.patch(
  "/:id",
  verifyOAuthToken,
  validateUpdateComment,
  handleValidationErrors,
  updateComment,
);

/* Delete comment */
router.delete(
  "/:id",
  verifyOAuthToken,
  validateDeleteComment,
  handleValidationErrors,
  deleteComment,
);

/* Like / Dislike */
router.post(
  "/:id/react",
  verifyOAuthToken,
  validateReactComment,
  handleValidationErrors,
  reactToComment,
);

/* Get replies */
router.get(
  "/:id/replies",
  optionalAuth,
  validateGetReplies,
  handleValidationErrors,
  getReplies,
);

export default router;
