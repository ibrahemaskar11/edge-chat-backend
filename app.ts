import express, { NextFunction } from "express";
import { Request, Response } from "express";
import userRouter from "./routes/userRoutes";
import chatRouter from "./routes/chatRoutes";
import messageRouter from "./routes/messageRoutes";
import cors from "cors";
import AppError from "./utils/AppError";
import cookieParser from "cookie-parser";
import errorHandler from "./middleware/errorHandler";
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PORT: string;
      NODE_ENV: "development" | "production" | "test";
      MONGO_URI: string;
      MONGO_PASSWORD: string;
      JWT_SECRET: string;
      JWT_EXPIRES_IN: string;
      JWT_COOKIE_EXPIRES_IN: string;
      EMAIL_FROM: string;
      EMAIL_DUMMY_HOST: string;
      EMAIL_DUMMY_PORT: number;
      EMAIL_DUMMY_USER: string;
      EMAIL_DUMMY_PASS: string;
      CLIENT_URL: string;
    }
  }
}

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());
app.use(cookieParser());

// app.get("/", (req: Request, res: Response) => {
//   res.send("Hello World");
// });

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    status: "success",
    message: "Hello World",
  });
});

app.use((req: Request, res: Response, next: NextFunction) => {
  req.body.requestTime = new Date().toISOString();
  next();
});

app.use("/api/users", userRouter);
app.use("/api/chat", chatRouter);
app.use("/api/message", messageRouter);
app.all("*", (req, res, next) => {
  next(new AppError(`cant find ${req.originalUrl} on the server`, 404));
});
app.use(errorHandler);
export default app;
