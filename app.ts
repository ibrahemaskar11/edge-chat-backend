import express, { NextFunction } from "express";
import { Request, Response } from "express";
import userRouter from "./routes/userRoutes";
import cors from 'cors'
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
    }
  }
}

interface customRequest extends Request {
  requestTime: string;
}

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

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
  next();
});

app.use("/api/users", userRouter);

export default app;
