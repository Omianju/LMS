import { NextFunction, Request, Response } from "express";
import { catchAsyncErrors } from "./catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import jwt, { JwtPayload } from "jsonwebtoken";
import { redis } from "../utils/redis";

export const isAuthenticated = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    const access_token = req.cookies.access_token;
    
    if (!access_token) {
      return next(new ErrorHandler("Please login first!", 400));
    }

    const decoded = jwt.verify(
      access_token,
      process.env.ACCESS_TOKEN as string
    ) as JwtPayload;

    if (!decoded) {
      return next(new ErrorHandler("Token is invalid!", 400));
    }

    const user = await redis.get(decoded._id);

    if (!user) {
      return next(new ErrorHandler("Please login to access this resource!", 400)); 
    }

    req.user = JSON.parse(user);
    next();
  }
);

// Validate user Roles
export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user?.role as string)) {
      return next(
        new ErrorHandler(
          `Role: ${req.user?.role} is not allowed to access this resource!`,
          403
        )
      );
    }
    next();
  };
};
