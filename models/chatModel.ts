import mongoose from "mongoose";
import { IChat, IMessage } from "../utils/interfaces";
import User from "./userModel";
import Message from "./messageModel";
const chatSchema: mongoose.Schema<IChat> = new mongoose.Schema(
  {
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    isGroupChat: {
      type: Boolean,
      default: false,
    },
    admins: [
      {
        required: false,
        default: null,
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    chatName: {
      type: String,
      required: false,
      trim: true,
    },
    groupImg: {
      type: String,
      required: false,
      default: null,
    },
    groupCreator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

chatSchema.virtual("latestMessage", {
  ref: "Message", // Reference the Message model
  localField: "_id", // Local field to match with foreign field in Message model
  foreignField: "chat", // Foreign field to match with local field in Chat model
  justOne: true, // Retrieve only one message
  options: { sort: { createdAt: -1 } }, // Sort by createdAt in descending order
});

chatSchema.virtual("latestMessage.timeSinceCreation").get(function () {
  const currentDate = new Date();
  const targetDate = this.latestMessage?.createdAt;
  if (targetDate) {
    const timeDiff = Math.abs(currentDate.getTime() - targetDate.getTime());
    const seconds = Math.floor(timeDiff / 1000);

    if (seconds < 60) {
      return "now";
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      return `${minutes}m`;
    } else if (seconds < 86400) {
      const hours = Math.floor(seconds / 3600);
      return `${hours}h`;
    } else {
      const days = Math.floor(seconds / 86400);
      return `${days}d`;
    }
  }
  return undefined;
});
chatSchema.pre("save", async function (next) {
  //check if the users ids are in an indvidual chat already
  //check if the users actually exist
  const existingUsers = await User.find({ _id: { $in: this.users } });
  console.log(existingUsers);
  if (existingUsers.length !== this.users.length) {
    throw new Error("One or more users don't exist");
  }
  const existingChat = await Chat.findOne({
    users: { $all: this.users, $size: this.users.length },
    isGroupChat: false,
  });
  if (existingChat && this.isGroupChat === false) {
    throw new Error("Chat already exists");
  }
  if (this.isGroupChat === true && !this.chatName) {
    throw new Error("Please provide a chat name");
  }
  next();
});

chatSchema.pre(/^find/, function (next) {
  // this.populate({
  //   path: "users",
  //   select: "name email photo",
  // }).populate({
  //   path: "admins",
  //   select: "name email photo",
  // });

  this.select("-__v");
  next();
});

const Chat = mongoose.model("Chat", chatSchema);

export default Chat;
