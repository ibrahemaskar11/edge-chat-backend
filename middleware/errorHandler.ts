import { Request, Response, NextFunction } from "express";
import AppError from "../utils/AppError";
const errorHandler = (
  err: AppError | Error | any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log('reached error handler');
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });
};

export default errorHandler;
