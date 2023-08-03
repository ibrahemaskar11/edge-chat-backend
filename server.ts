import dotenv from "dotenv";
import app from "./app";
import mongoose, { ConnectOptions } from "mongoose";
import colors from "colors";
dotenv.config({
  path: "./config.env",
});
const db: string = process.env.MONGO_URI;
const PORT: string | number = process.env.PORT || 5000;
console.log(process.env.EMAIL_DUMMY_HOST);

mongoose
  .connect(db, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  } as ConnectOptions)
  .then(() => {
    console.log("DB connection successful!".underline);
  })
  .catch((err) => {
    console.log("failed to connect to db");
    process.exit(1);
  });
colors.enable();
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`.underline);
});

// process.on("unhandledRejection", (err) => {
//   console.log("UNHANDLED REJECTION! 💥 Shutting down...");
//   console.log(err.name, err.message);
//   server.close(() => {
//     process.exit(1);
//   });
// });
