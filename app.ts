import express, { NextFunction } from "express";
import { Request, Response } from "express";
import morgan from "morgan";

interface customRequest extends Request {
  requestTime: string;
}

const app = express();

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

export default app;
