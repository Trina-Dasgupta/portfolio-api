import jwt from "jsonwebtoken";
import { ApiResponse } from "../utils/apiResponse.js";
import { StatusCodes } from "http-status-codes";

export function verifyAdmin(req, res, next) {
  const token = req.signedCookies?.admin_token;

  if (!token) {
    return ApiResponse.error(res, null, {
      message: "Authentication token missing",
      status: StatusCodes.UNAUTHORIZED,
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded?.role || decoded.role !== "admin") {
      return ApiResponse.error(res, null, {
        message: "Forbidden - Admin access required",
        status: StatusCodes.FORBIDDEN,
      });
    }
    
    next();

  } catch (error) {
    return ApiResponse.error(res, error, {
      message: "Invalid or expired authentication token",
      status: StatusCodes.UNAUTHORIZED,
    });
  }
}
