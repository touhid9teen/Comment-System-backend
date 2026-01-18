import { body, param, query, validationResult } from "express-validator";
import type { Request, Response, NextFunction } from "express";

/* ---------------- Common Error Handler ---------------- */

export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array(),
    });
  }

  next();
};

/* ---------------- POST /api/comments ---------------- */

export const validateCreateComment = [
  body("content")
    .trim()
    .notEmpty()
    .withMessage("Comment content is required")
    .isLength({ min: 1, max: 2000 })
    .withMessage("Comment must be between 1 and 2000 characters"),

  body("parentId")
    .optional()
    .isMongoId()
    .withMessage("Invalid parent comment ID"),
];

/* ---------------- GET /api/comments ---------------- */

export const validateGetComments = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer")
    .toInt(),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100")
    .toInt(),

  query("sortBy")
    .optional()
    .isIn(["newest", "most-liked", "most-disliked"])
    .withMessage("Invalid sort option"),

  query("parentId")
    .optional()
    .isMongoId()
    .withMessage("Invalid parent comment ID"),
];

/* ---------------- GET /api/comments/:id ---------------- */

export const validateGetCommentById = [
  param("id").isMongoId().withMessage("Invalid comment ID"),
];

/* ---------------- PATCH /api/comments/:id ---------------- */

export const validateUpdateComment = [
  param("id").isMongoId().withMessage("Invalid comment ID"),

  body("content")
    .trim()
    .notEmpty()
    .withMessage("Comment content is required")
    .isLength({ min: 1, max: 2000 })
    .withMessage("Comment must be between 1 and 2000 characters"),
];

/* ---------------- DELETE /api/comments/:id ---------------- */

export const validateDeleteComment = [
  param("id").isMongoId().withMessage("Invalid comment ID"),
];

/* ---------------- POST /api/comments/:id/react ---------------- */

export const validateReactComment = [
  param("id").isMongoId().withMessage("Invalid comment ID"),

  body("type")
    .isIn(["like", "dislike"])
    .withMessage('Reaction type must be either "like" or "dislike"'),
];

/* ---------------- GET /api/comments/:id/replies ---------------- */

export const validateGetReplies = [
  param("id").isMongoId().withMessage("Invalid comment ID"),

  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer")
    .toInt(),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100")
    .toInt(),

  query("sortBy")
    .optional()
    .isIn(["newest", "most-liked", "most-disliked"])
    .withMessage("Invalid sort option"),
];
