import { body, validationResult } from "express-validator";
import type { Request, Response, NextFunction } from "express";

const validateGoogleAuth = [
  body("token").notEmpty().withMessage("Google token is required"),
];

const handleValidationErrors = (
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

export { validateGoogleAuth, handleValidationErrors };
