import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/userModel";
import { IUser } from "../utils/interfaces";
import crypto from "crypto";
import { promisify } from "util";
import Email from "../utils/email";
import AppError from "../utils/AppError";

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
    secure: false,
  };
  res.cookie("jwt", token, cookieOptions);
  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        photo: user.photo,
      },
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
    if (
      !req.body.name ||
      !req.body.email ||
      !req.body.password ||
      !req.body.passwordConfirm
    ) {
      throw new Error("Please provide all required information");
    }
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
    const email: string = req.body.email;
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
    new Email(user, resetToken).sendResetToken();
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
    console.log(token);
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user: IUser | null = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });
    console.log(user);
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
    console.log(err);
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }
    console.log(token);
    if (!token) {
      throw new AppError(
        "You are not logged in! please log in to get access",
        401
      );
    }
    const jwtVerifyPromisified = (token: string, secret: string) => {
      return new Promise((resolve, reject) => {
        jwt.verify(token, secret, {}, (err, payload) => {
          if (err) {
            reject(err);
          } else {
            resolve(payload);
          }
        });
      });
    };
    const decoded: any = await jwtVerifyPromisified(
      token,
      process.env.JWT_SECRET
    );

    const freshUser = await User.findById(decoded.id);
    if (!freshUser)
      throw new Error("The User belonging to the token no longer exists!");
    if (freshUser.changedPasswordAfter(decoded.iat)) {
      throw new AppError(
        "User recently changed password! Please log in again",
        401
      );
    }
    req.body.requestingUser = freshUser;
    next();
  } catch (err: AppError | any) {
    res.status(err.statusCode || 500).json({
      status: err.status,
      message: err.message,
    });
  }
};

export const validate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }
    console.log(token);
    if (!token) {
      throw new AppError(
        "You are not logged in! please log in to get access",
        401
      );
    }
    const jwtVerifyPromisified = (token: string, secret: string) => {
      return new Promise((resolve, reject) => {
        jwt.verify(token, secret, {}, (err, payload) => {
          if (err) {
            reject(err);
          } else {
            resolve(payload);
          }
        });
      });
    };
    const decoded: any = await jwtVerifyPromisified(
      token,
      process.env.JWT_SECRET
    );
    const user = await User.findById(decoded.id);

    if (!user)
      throw new Error("The User belonging to the token no longer exists!");
    if (user.changedPasswordAfter(decoded.iat)) {
      throw new AppError(
        "User recently changed password! Please log in again",
        401
      );
    }
    res.json({
      status: "success",
      data: {
        user,
      },
    });
  } catch (err: AppError | any) {
    res.status(err.statusCode || 500).json({
      status: err.status,
      message: err.message,
    });
  }
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.cookie("jwt", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({
    status: "success",
  });
};
