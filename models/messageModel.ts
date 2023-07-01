import mongoose from "mongoose";
import { IMessage } from "utils/interfaces";

const messageSchema: mongoose.Schema<IMessage> = new mongoose.Schema(
  {
    message: {
      type: String,
      trim: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
    },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

messageSchema.pre(/^find/, function (next) {
  this.populate("sender", "name email photo")
    .populate("readBy")
    .populate("chat");
  next();
});

const Message = mongoose.model("Message", messageSchema);
module.exports = Message;