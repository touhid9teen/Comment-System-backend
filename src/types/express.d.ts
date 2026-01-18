import { IUser } from "../models/User.js";

declare global {
  namespace Express {
    // Augment the User interface which is used by req.user
    interface User extends IUser {}

    interface Request {
      // req.user is automatically inferred as User (which now extends IUser)
      token?: string;
    }
  }
}
