import dotenv from "dotenv";
import app from "./app";

dotenv.config({
  path: "./config.env",
});


const PORT = process.env.PORT || 5000;

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
