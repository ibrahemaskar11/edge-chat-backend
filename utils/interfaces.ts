import mongoose from "mongoose";

export interface IChat extends mongoose.Document {
  users: mongoose.Schema.Types.ObjectId[];
  isGroupChat: boolean;
  admins: mongoose.Schema.Types.ObjectId[] | null;
  chatName: string;
  groupImg: string | null;
  groupCreator: mongoose.Schema.Types.ObjectId | null;
  latestMessage: IMessage | null;
  
}

export interface IMessage extends mongoose.Document {
  message: string;
  sender: IUser;
  chat: mongoose.Schema.Types.ObjectId;
  readBy: mongoose.Schema.Types.ObjectId[];
  deleted: boolean;
  createdAt: Date;
  timeSinceCreation: string;
  isMe: boolean;
}



export interface IUser extends mongoose.Document {
  name: string;
  email: string;
  password: string;
  passwordConfirm: string | undefined;
  passwordChangedAt: Date;
  passwordResetToken: string | undefined;
  passwordResetExpires: Date | undefined;
  active: Boolean;
  role: string;
  createdAt: Date;
  photo: string;
  correctPassword(
    candidatePassword: string,
    userPassword: string
  ): Promise<boolean>;
  createResetToken(): string;
  changedPasswordAfter(JWTTimestamp: number): boolean;
}

  export interface IMessageGroup {
    isMe: boolean;
    messages: IMessage[];
  }
