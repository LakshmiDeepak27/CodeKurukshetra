const authService = require("../services/auth.service");
const { verifyToken } = require("../utils/crypto");

async function authenticate(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const userId = verifyToken(token);
    const user = await authService.findUserById(userId);
    if (!user) {
      return res.status(401).json({ message: "Invalid session" });
    }
    req.user = user;
    authService.updateUserLastSeen(user.id);
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid session" });
  }
}

async function optionalAuthenticate(req, _res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) return next();

  try {
    const userId = verifyToken(token);
    const user = await authService.findUserById(userId);
    if (user) {
      req.user = user;
      authService.updateUserLastSeen(user.id);
    }
  } catch {
    // Ignore invalid tokens for optional auth
  }
  return next();
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin privileges required" });
  }
  return next();
}

module.exports = { authenticate, optionalAuthenticate, requireAdmin };
