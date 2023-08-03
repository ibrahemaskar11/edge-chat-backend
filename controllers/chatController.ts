import { Request, Response, NextFunction } from "express";
import Chat from "../models/chatModel";
import { IChat, IMessage } from "../utils/interfaces";
import AppError from "../utils/AppError";
import Message from "../models/messageModel";
import User from "../models/userModel";

export const fetchChats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { requestingUser } = req.body;
    const { searchTerm } = req.query;
    const chats = !searchTerm
      ? await Chat.find({ users: { $in: requestingUser.id } }).populate(
          "latestMessage"
        )
      : await Chat.find({
          users: { $in: requestingUser.id },
          chatName: { $regex: searchTerm, $options: "i" },
        }).populate("latestMessage");

    for (const chat of chats) {
      if (chat.isGroupChat) continue;
      const otherUserId = chat.users.find(
        (user) => user.toString() !== requestingUser.id.toString()
      );
      const chatsDisplay = await User.findById(otherUserId).select(
        "name photo"
      );
      if (!chatsDisplay) {
        throw new AppError("Something went wrong", 500);
      }
      chat.chatName = chatsDisplay.name;
      chat.groupImg = chatsDisplay.photo;
      console.log(chat);
    }
    // chats.forEach((chat) => {
    //   if (chat.latestMessage) {
    //     const currentDate = new Date();
    //     const targetDate = chat.latestMessage.createdAt;
    //     const timeDiff = Math.abs(currentDate.getTime() - targetDate.getTime());
    //     const seconds = Math.floor(timeDiff / 1000);

    //     if (seconds < 60) {
    //       chat.latestMessage.timeSinceCreation = "now";
    //     } else if (seconds < 3600) {
    //       const minutes = Math.floor(seconds / 60);
    //       chat.latestMessage.timeSinceCreation = minutes + "m";
    //     } else if (seconds < 86400) {
    //       const hours = Math.floor(seconds / 3600);
    //       chat.latestMessage.timeSinceCreation = hours + "h";
    //     } else {
    //       const days = Math.floor(seconds / 86400);
    //       chat.latestMessage.timeSinceCreation = days + "d";
    //     }
    //     console.log(chat.latestMessage.timeSinceCreation)
    //   }
    // });
    res.status(200).json({
      status: "success",
      results: chats.length,
      data: { chats },
    });
  } catch (err: AppError | Error | any) {
    next(err);
  }
};

export const accessChat = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { chatId } = req.params;
  const { requestingUser } = req.body;
  try {
    const chat: IChat | null = await Chat.findById(chatId).populate(
      "latestMessage"
    );
    if (!chat) {
      throw new AppError("Chat doesn't exist", 404);
    }
    if (!chat.isGroupChat) {
      const otherUserId = chat.users.find(
        (user) => user.toString() !== requestingUser.id.toString()
      );
      const chatsDisplay = await User.findById(otherUserId).select(
        "name photo"
      );
      if (!chatsDisplay) {
        throw new AppError("Something went wrong", 500);
      }
      chat.chatName = chatsDisplay.name;
      chat.groupImg = chatsDisplay.photo;
    }
    const messages: IMessage[] = await Message.find({
      chat: chatId,
    }).sort({ createdAt: -1 }).populate("sender", "name email photo");

    interface IMessageGroup {
      isMe: boolean;
      messages: IMessage[];
    }

    const messageGroups: IMessageGroup[] = [{ isMe: false, messages: [] }];
    let currentMessageGroup = 0;

    for (let i = 0; i < messages.length; i++) {
      const previousMessage = messages[i - 1];
      const nextMessage = messages[i + 1];
      const currentMessage = messages[i];

      if (!previousMessage || !nextMessage) {
        // If previousMessage or nextMessage is missing, it means it's the first or last message in the group
        messageGroups[currentMessageGroup].messages.push(currentMessage);
        messageGroups[currentMessageGroup].isMe =
          currentMessage.sender._id.toString() === requestingUser.id.toString();
      } else if (
        currentMessage.sender._id.toString() === nextMessage.sender._id.toString()
      ) {
        // If the current message sender matches the next message sender, they belong to the same group
        messageGroups[currentMessageGroup].messages.push(currentMessage);
        messageGroups[currentMessageGroup].isMe =
          currentMessage.sender._id.toString() === requestingUser.id.toString();
      } else {
        // If the current message sender doesn't match the next message sender, it's a new group
        messageGroups[currentMessageGroup].messages.push(currentMessage);
        // Reverse the messages within the group after pushing them
        messageGroups[currentMessageGroup].messages.reverse();
        // Set the isMe flag for the current group based on the first message in the group
        messageGroups[currentMessageGroup].isMe =
          messageGroups[currentMessageGroup].messages[0].sender._id.toString() ===
          requestingUser.id.toString();
        // Move to the next message group
        currentMessageGroup++;
        // Create a new empty message group
        messageGroups[currentMessageGroup] = {
          isMe: false,
          messages: [],
        };
      }
    }

    // Reverse the last message group if it has multiple messages
    if (messageGroups[currentMessageGroup].messages.length > 1) {
      messageGroups[currentMessageGroup].messages.reverse();
    }

    // const latestMessage = messages[messages.length - 1];
    res.status(200).json({
      status: "success",
      data: {
        chat,
        messageGroups,
      },
    });
  } catch (err: AppError | Error | any) {
    next(err);
  }
};

//////////////////////////
// Indvidual Chat
//////////////////////////

export const createChat = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { users } = req.body;
    if (!users) {
      throw new AppError("Please provide users", 400);
    }
    if (users.length < 2) {
      throw new AppError("Please provide at least 2 users", 400);
    }
    const newChat: IChat = await Chat.create({
      users,
    });
    await newChat.populate("users", "name email photo");
    res.status(201).json({
      status: "success",
      data: {
        chat: newChat,
      },
    });
  } catch (err: AppError | Error | any) {
    next(err);
  }
};
export const createGroupChat = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { users, admins, chatName, requestingUser } = req.body;
    if (!users || !admins || !chatName) {
      throw new AppError("Please provide users, admins and chatName", 400);
    }
    if (users.length < 2) {
      throw new AppError("Please provide at least 2 users", 400);
    }
    const newChat: IChat = await Chat.create({
      users,
      admins,
      chatName,
      isGroupChat: true,
      groupCreator: requestingUser.id,
    });
    if (!newChat) {
      throw new AppError("Something went wrong!", 500);
    }
    await newChat.populate("users", "name email photo");
    res.status(201).json({
      status: "success",
      data: {
        chat: newChat,
      },
    });
  } catch (err: AppError | Error | any) {
    next(err);
  }
};
export const updateGroupChatUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { chatId } = req.params;
    const { users, requestingUser } = req.body;
    if (!users) {
      throw new AppError("Please provide users", 400);
    }
    const existingChat: IChat | null = await Chat.findOne({
      _id: chatId,
      isGroupChat: true,
    });

    if (!existingChat) {
      throw new AppError("Chat doesn't exist", 404);
    }
    if (!existingChat.admins?.includes(requestingUser.id)) {
      throw new AppError(
        "You have no permission to update the group chat",
        403
      );
    }
    ////////////////////////////////////////////
    // make crud apis for managing group users
    ////////////////////////////////////////////

    existingChat.users = users;
    await existingChat.save();
    await existingChat.populate("users", "name email photo");
    res.status(200).json({
      status: "success",
      data: {
        chat: existingChat,
      },
    });
  } catch (err: AppError | Error | any) {
    next(err);
  }
};
export const updateGroupChatAdmins = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { chatId } = req.params;
    const { admins, requestingUser } = req.body;
    if (!admins) {
      throw new AppError("Please provide admins", 400);
    }
    const existingChat: IChat | null = await Chat.findOne({
      _id: chatId,
      users: {
        $all: admins,
      },
      isGroupChat: true,
    });
    if (!existingChat) {
      throw new AppError("Chat doesn't exist", 404);
    }
    if (!existingChat.admins?.includes(requestingUser.id)) {
      throw new AppError(
        "You have no permission to update the group chat",
        403
      );
    }
    existingChat.admins = admins;
    await existingChat.save();
    await existingChat.populate("users", "name email photo");

    res.status(200).json({
      status: "success",
      data: {
        chat: existingChat,
      },
    });
  } catch (err: AppError | Error | any) {
    next(err);
  }
};

export const addGroupChatUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { chatId } = req.params;
    const { userID, requestingUser } = req.body;
    if (!userID) {
      throw new AppError("Please provide a user to add", 400);
    }
    const existingChat: IChat | null = await Chat.findOne({
      _id: chatId,
      isGroupChat: true,
    });

    if (!existingChat) {
      throw new AppError("Chat doesn't exist", 404);
    }
    if (!existingChat.admins?.includes(requestingUser.id)) {
      throw new AppError(
        "You have no permission to update the group chat",
        403
      );
    }
    ////////////////////////////////////////////
    // make crud apis for managing group users
    ////////////////////////////////////////////

    existingChat.users.push(userID);
    await existingChat.save();
    await existingChat.populate("users", "name email photo");
    res.status(200).json({
      status: "success",
      data: {
        chat: existingChat,
      },
    });
  } catch (err: AppError | Error | any) {
    next(err);
  }
};

export const updateGroupChat = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { chatId } = req.params;
    const { requestingUser } = req.body;
    const filter = ["chatName", "groupImg"];
    let filteredBody: any = {};
    Object.keys(req.body).forEach((el) => {
      if (filter.includes(el)) filteredBody[el] = req.body[el];
    });

    const existingChat: IChat | null = await Chat.findOne({
      _id: chatId,
    });

    if (!existingChat) {
      throw new AppError("Chat doesn't exist", 404);
    }
    if (!existingChat.admins?.includes(requestingUser.id)) {
      throw new AppError(
        "You have no permission to update the group chat",
        403
      );
    }

    const updatedChat: IChat | null = await Chat.findByIdAndUpdate(
      {
        _id: chatId,
        admins: { $in: requestingUser.id },
      },
      filteredBody,
      { new: true, runValidators: true }
    );
    if (!updatedChat) {
      throw new AppError("Something went wrong", 500);
    }
    await updatedChat.populate("users", "name email photo");
    res.status(200).json({
      status: "success",
      data: {
        chat: updatedChat,
      },
    });
  } catch (err: AppError | Error | any) {
    next(err);
  }
};

export const deleteChat = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { chatId } = req.params;

    const existingChat: IChat | null = await Chat.findOne({
      _id: chatId,
    });
    if (!existingChat) {
      throw new AppError("Chat doesn't exist", 404);
    }
    // if (!existingChat) {
    //   throw new AppError("You have no permission to delete this chat", 403);
    // }
    // existingChat?.users = existingChat?.users.filter((user) =>
    //   user.id.equals(req.body.requestingUser.id)
    // );

    if (existingChat.users.length === 1) {
      await Chat.deleteOne({ _id: chatId });
    } else {
      const filteredUsers = existingChat.users?.filter((user) => {
        return user.toString() !== req.body.requestingUser.id.toString();
      });

      if (existingChat?.admins?.length) {
        const filteredAdmins = existingChat.admins.filter((admin) => {
          return admin.toString() !== req.body.requestingUser.id.toString();
        });

        existingChat.admins = filteredAdmins;
      }
      if (filteredUsers.length === 1 && existingChat.admins?.length === 0) {
        existingChat.admins.push(filteredUsers[0]);
      }
      existingChat.users = filteredUsers;
      await existingChat.save();
    }

    res.status(204).json({
      status: "success",
      message: "Chat deleted from user chats",
    });
  } catch (err: Error | any) {
    next(err);
  }
};

export const removeGroupChatUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userID, requestingUser } = req.body;
    const { chatId } = req.params;
    if (!userID) {
      next(new AppError("please provide a user to remove", 400));
    }
    if (!chatId) {
      next(new AppError("please provide a chat id", 400));
    }

    const existingChat = await Chat.findById(chatId);
    if (!existingChat) {
      throw new AppError("chat doesn't exist", 404);
    }
    if (!existingChat.admins?.includes(requestingUser.id)) {
      throw new AppError(
        "You have no permission to update the group chat",
        403
      );
    }
    const filteredUsers = existingChat.users.filter(
      (user) => user.toString() !== userID
    );
    const filteredAdmins = existingChat.admins?.filter(
      (admin) => admin.toString() !== userID
    );
    existingChat.users = filteredUsers;
    existingChat.admins = filteredAdmins;
    await existingChat.save();
    await existingChat.populate("users", "name email photo");
    res.status(204).json({
      status: "success",
      message: "Chat deleted from user chats",
    });
  } catch (err: AppError | Error | any) {
    next(err);
  }
};

// export const leaveGroupChat = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const { chatId } = req.params;
//     const { requestingUser } = req.body;
//     const existingChat: IChat | null = await Chat.findOne({
//       _id: chatId,
//       users: { $in: requestingUser.id },
//     });
//     if (!existingChat) {
//       throw new AppError("Chat doesn't exist", 404);
//     }
//     existingChat.users = existingChat.users.filter((user) => {
//       return !user.toString() === requestingUser.id.toString();
//     });
//     await existingChat.save();
//     await existingChat.populate("users", "name email photo");
//     res.status(200).json({
//       status: "success",
//       data: {
//         chat: existingChat,
//       },
//     });
//   } catch (err: AppError | Error | any) {
//     next(err);
//   }
// };
