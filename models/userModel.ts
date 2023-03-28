import mongoose from "mongoose";
import { Document } from "mongoose";
import validator from "validator";
import bcrypt from "bcrypt";
import crypto from "crypto";

export interface IUser extends Document {
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
}

const userSchema = new mongoose.Schema<IUser>({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    // validate: [validator.isEmail, "Please provide a valid email"],
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [8, "Password must be at least 8 characters"],
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, "Please confirm your password"],
    validate: {
      validator: function (this: IUser, el: string): boolean {
        return el === this.password;
      },
      message: "Passwords must match",
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
  role: {
    type: String,
    default: "user",
    enum: ["user", "admin"],
  },
  createdAt: {
    type: Date,
    default: Date.now(),
    select: false,
  },
  photo: {
    type: String,
    default: "default.jpg",
  },
});

userSchema.pre<IUser>("save", function (next): void {
  if (!this.isNew) return next();
  if (this.password !== this.passwordConfirm) {
    throw new Error("Password and password confirm do not match");
  }
  next();
});

userSchema.pre<IUser>("save", async function (next): Promise<void> {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre<IUser>("save", function (next): void {
  if (!this.isModified("password") || this.isNew) return next();
  this.passwordChangedAt = new Date(Date.now() - 1000);
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword: string,
  userPassword: string
): Promise<boolean> {
  console.log("match");
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.createResetToken = function (): string {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);
  return resetToken;
};

const model: mongoose.Model<IUser> = mongoose.model("User", userSchema);
export default model;
