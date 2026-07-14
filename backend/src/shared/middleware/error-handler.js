const { AppError } = require("../errors/app-error");

function notFoundHandler(req, _res, next) {
  next(new AppError(404, `Route not found: ${req.method} ${req.originalUrl}`, { errorCode: "ROUTE_NOT_FOUND" }));
}

function globalErrorHandler(error, _req, res, next) {
  if (res.headersSent) return next(error);

  const isAppError = error instanceof AppError;
  const statusCode = isAppError ? error.statusCode : 500;
  const payload = {
    status: "error",
    message: isAppError ? error.message : "Internal server error",
  };

  if (isAppError) {
    payload.errorCode = error.errorCode;
    if (error.details) payload.details = error.details;
  }

  if (process.env.NODE_ENV !== "production" && !isAppError) {
    payload.debug = { message: error.message };
  }

  return res.status(statusCode).json(payload);
}

module.exports = { notFoundHandler, globalErrorHandler };
