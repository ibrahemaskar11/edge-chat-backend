import { Request, Response, NextFunction } from "express";
import Chat from "../models/chatModel";
import { IChat } from "../utils/interfaces";
import AppError from "../utils/AppError";

export const fetchChats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { requestingUser } = req.body;
    const chats: IChat[] = await Chat.find({
      users: { $in: requestingUser.id },
    }).populate("users", "name email photo");
    res.status(200).json({
      status: "success",
      results: chats.length,
      data: {
        chats,
      },
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
  try {
    const chat: IChat | null = await Chat.findById(chatId).populate(
      "users",
      "name email photo"
    );
    if (!chat) {
      throw new AppError("Chat doesn't exist", 404);
    }

    res.status(200).json({
      status: "success",
      data: {
        chat,
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
    await existingChat.populate('users', 'name email photo');

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
    await updatedChat.populate('users', 'name email photo')
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
    await existingChat.populate('users', 'name email photo')
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
