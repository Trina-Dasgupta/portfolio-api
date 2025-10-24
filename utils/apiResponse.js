import { StatusCodes } from "http-status-codes";

export class ApiResponse {
  static success(
    res,
    { message = "Success", data = null, status = StatusCodes.OK } = {}
  ) {
    return res.status(status).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  static error(
    res,
    error = null,
    {
      message = "Internal server error",
      status = StatusCodes.INTERNAL_SERVER_ERROR,
      log = true,
      data = null,
    } = {}
  ) {
    if (log && process.env.NODE_ENV !== "production") {
      if (error instanceof Error) {
        console.error(message, error.stack);
      } else {
        console.error(message, error);
      }
    }

    return res.status(status).json({
      success: false,
      message,
      ...(data && { data }),
      timestamp: new Date().toISOString(),
    });
  }
}
