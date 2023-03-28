import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/userModel";
import { IUser } from "../models/userModel";
import crypto from "crypto";

const createSendToken = (
  user: IUser,
  statusCode: number,
  req: Request,
  res: Response
) => {
  const token: string = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() +
        Number(process.env.JWT_COOKIE_EXPIRES_IN) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: req.secure || req.headers["x-forwarded-proto"] === "https",
  };
  res.cookie("jwt", token, cookieOptions);
  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

const signToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw new Error("Please provide email and password");
    }
    const user: IUser | null = await User.findOne({ email }).select(
      "+password"
    );
    console.log(user);
    if (!user || !(await user.correctPassword(password, user.password))) {
      console.log("Incorrect email or password");
      throw new Error("Incorrect email or password");
    }
    const token: string = signToken(user._id);
    createSendToken(user, 200, req, res);
  } catch (err: Error | any) {
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};
export const signup = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const existingUser: IUser | null = await User.findOne({
      email: req.body.email,
    });
    if (existingUser) {
      throw new Error("User already exists");
    }
    const newUser: IUser = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
    });
    const token: string = signToken(newUser._id);
    createSendToken(newUser, 200, req, res);
  } catch (err: Error | any) {
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};

export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;
    console.log(email);
    const user: IUser | null = await User.findOne({ email });
    if (!user) {
      throw new Error("No user found with this email");
    }
    const resetToken: string = user.createResetToken();
    await user.save({ validateBeforeSave: false });
    console.log(resetToken);
    const resetURL: string = `${req.protocol}://${req.get(
      "host"
    )}/api/v1/users/reset-password/${resetToken}`;
    res.status(200).json({
      status: "success",
      resetToken,
    });
  } catch (err: Error | any) {
    console.log(err);
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token } = req.params;
    const { password, passwordConfirm } = req.body;
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });
    if (!user) {
      throw new Error("Token is invalid or has expired");
    }
    user.password = password;
    user.passwordConfirm = passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    createSendToken(user, 200, req, res);
  } catch (err: Error | any) {
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};
