import dotenv from "dotenv";
import app from "./app";
import mongoose from "mongoose";

dotenv.config({
  path: "./config.env",
});
const db: string | undefined = process.env.MONGO_URI;
const PORT: string | number = process.env.PORT || 5000;
mongoose
  .connect(db as string)
  .then(() => {
    console.log("DB connection successful!");
  })
  .catch((err) => {
    console.log("failed to connect to db");
    process.exit(1);
  });

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// process.on("unhandledRejection", (err) => {
//   console.log("UNHANDLED REJECTION! 💥 Shutting down...");
//   console.log(err.name, err.message);
//   server.close(() => {
//     process.exit(1);
//   });
// });
