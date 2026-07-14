const { AppError } = require("../shared/errors/app-error");

function notFound(_req, _res, next) {
  next(new AppError(404, "Route not found"));
}

function errorHandler(error, _req, res, _next) {
  const status = error.statusCode || error.status || 500;
  const message = error.message || "Internal server error";

  if (status >= 500) {
    console.error(error);
  }

  res.status(status).json({ status: "error", message });
}

module.exports = { notFound, errorHandler, AppError };
