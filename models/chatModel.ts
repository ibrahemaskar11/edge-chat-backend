import mongoose from "mongoose";
import { IChat } from "utils/interfaces";
import User from "./userModel";
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
    groupCreator:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    }
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

///////////////////////////////////////////
// implement virtual for latestMessage
///////////////////////////////////////////

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
  // });
  // this.select("-__v");

  next();
});

const Chat = mongoose.model("Chat", chatSchema);

export default Chat;
