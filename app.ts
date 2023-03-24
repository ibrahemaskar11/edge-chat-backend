import express, { NextFunction } from "express";
import { Request, Response } from "express";
import morgan from "morgan";
import userRouter from "./routes/userRoutes";
import cors from 'cors'
interface customRequest extends Request {
  requestTime: string;
}

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors())

// app.get("/", (req: Request, res: Response) => {
//   res.send("Hello World");
// });

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    status: "success",
    message: "Hello World",
  });
});

app.use(morgan("dev"));

app.use((req: customRequest, res: Response, next: NextFunction) => {
  req.requestTime = new Date().toISOString();
  next();
});

app.use("/api/users", userRouter);

export default app;
