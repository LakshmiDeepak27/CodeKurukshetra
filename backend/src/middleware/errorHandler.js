function notFound(_req, res) {
  res.status(404).json({ status: "error", message: "Route not found" });
}

function errorHandler(error, _req, res, _next) {
  const status = error.status || 500;
  const message = error.message || "Internal server error";
  if (status >= 500) {
    console.error(error);
  }
  res.status(status).json({ status: "error", message });
}

module.exports = { notFound, errorHandler };
