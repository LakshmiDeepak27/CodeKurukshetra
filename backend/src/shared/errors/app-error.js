class AppError extends Error {
  constructor(statusCode, message, options = {}) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.errorCode = options.errorCode || "APP_ERROR";
    this.details = options.details;
    this.isOperational = true;
  }
}

module.exports = { AppError };
