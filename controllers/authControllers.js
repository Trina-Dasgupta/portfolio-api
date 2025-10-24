import jwt from "jsonwebtoken";
import { ApiResponse } from "../utils/apiResponse.js";
import { StatusCodes } from "http-status-codes";

export const loginController = async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return ApiResponse.error(res, null, {
      message: "Email and password both fields are required",
      status: StatusCodes.BAD_REQUEST,
    });
  }

  if (
    email === process.env.ADMIN_EMAIL &&
    password === process.env.ADMIN_PASSWORD
  ) {
    const sessionID = jwt.sign({ role: "admin" }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("admin_token", sessionID, {
      httpOnly: true,
      signed: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: "lax",
    });

    return ApiResponse.success(res, {
      message: "Logged in successfully",
      status: StatusCodes.OK,
    });
  }

  return ApiResponse.error(res, null, {
    message: "Invalid credentials!",
    status: StatusCodes.UNAUTHORIZED,
  });
};

export const logoutController = (req, res) => {
  const token = req.signedCookies?.admin_token;

  if (!token) {
    return ApiResponse.error(res, null, {
      message: "Not logged in",
      status: StatusCodes.UNAUTHORIZED,
    });
  }

  res.clearCookie("admin_token");

  return ApiResponse.success(res, {
    message: "Logged out",
    status: StatusCodes.OK,
  });
};
