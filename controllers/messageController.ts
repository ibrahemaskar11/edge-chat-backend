import { Request, Response, NextFunction } from "express";
import AppError from "../utils/AppError";
import mongoose from "mongoose";
import { IMessage, IChat } from "../utils/interfaces";
import Message from "../models/messageModel";
import Chat from "../models/chatModel";
export const sendMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { message, chat, requestingUser } = req.body;
    if (!message || !chat) {
      throw new AppError("missing information", 400);
    }

    const sentMessage: IMessage = await Message.create({
      message,
      chat,
      sender: requestingUser.id,
    });
    res.status(200).json({
      status: "Success",
      sentMessage,
    });
  } catch (err: AppError | Error | any) {
    next(err);
  }
};

export const deleteMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { messageId } = req.params;
    const { requestingUser } = req.body;
    if (!messageId) {
      throw new AppError("missing information", 400);
    }
    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      throw new AppError("invalid id", 400);
    }
    const message: IMessage | null = await Message.findById(messageId);
    if (!message) {
      throw new AppError("message not found", 404);
    }
    const existingChat: IChat | null = await Chat.findById(message.chat);
    if (!existingChat) {
      throw new AppError("chat not found", 404);
    }

    if (existingChat.isGroupChat) {
      if (!existingChat.admins?.includes(requestingUser.id)) {
        throw new AppError(
          "you are not authorized to delete this message",
          403
        );
      }
    } else {
      if (message.sender.toString() !== requestingUser.id.toString()) {
        throw new AppError(
          "you are not authorized to delete this message",
          403
        );
      }
    }
    message.deleted = true;
    message.message = "This message has been deleted";
    await message.save();
    res.status(200).json({
      status: "Success",
      message: "message deleted successfully",
    });
  } catch (err: AppError | Error | any) {
    next(err);
  }
};

export const searchMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // search for messages using params
    const { searchTerm } = req.query;
    if (!searchTerm) {
      throw new AppError("missing information", 400);
    }
    // search for messages using regex
    const messages: IMessage[] = await Message.find({
      message: { $regex: searchTerm, $options: "i" },
      
    });
    res.status(200).json({
      status: "Success",
      messages,
    });
  } catch (err: AppError | Error | any) {
    next(err);
  }
};
