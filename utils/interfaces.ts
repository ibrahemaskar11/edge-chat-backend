import mongoose from "mongoose";

export interface IChat extends mongoose.Document {
  users: mongoose.Schema.Types.ObjectId[];
  isGroupChat: boolean;
  admins: mongoose.Schema.Types.ObjectId[] | null;
  chatName: string;
  groupImg: string | null;
  groupCreator: mongoose.Schema.Types.ObjectId | null;
}

export interface IMessage extends mongoose.Document {
  message: string;
  sender: mongoose.Schema.Types.ObjectId;
  chat: mongoose.Schema.Types.ObjectId;
  readBy: mongoose.Schema.Types.ObjectId[];
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
