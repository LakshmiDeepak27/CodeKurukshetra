function securityHeaders(_req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Cross-Origin-Resource-Policy", "same-site");
  next();
}

function createRateLimiter({ windowMs, max, message }) {
  const hits = new Map();

  // Periodic memory cleanup timer to evict expired IP entries (PDF Item 3.2)
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits.entries()) {
      if (now - entry.startedAt >= windowMs) {
        hits.delete(key);
      }
    }
  }, Math.max(windowMs, 60000));

  if (typeof cleanupInterval.unref === "function") {
    cleanupInterval.unref();
  }

  return (req, res, next) => {
    const key = req.ip || req.socket?.remoteAddress || "unknown";
    const now = Date.now();
    const current = hits.get(key);
    const active = current && now - current.startedAt < windowMs
      ? current
      : { startedAt: now, count: 0 };

    active.count += 1;
    hits.set(key, active);

    if (active.count > max) {
      const retryAfter = Math.ceil((active.startedAt + windowMs - now) / 1000);
      res.setHeader("Retry-After", String(Math.max(retryAfter, 1)));
      return res.status(429).json({ status: "error", message });
    }
    return next();
  };
}

module.exports = { securityHeaders, createRateLimiter };
