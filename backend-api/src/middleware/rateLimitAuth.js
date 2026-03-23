/**
 * Simple in-memory rate limiter per IP (5 requests per minute by default).
 * Suitable for login/register anti brute-force; reset on process restart.
 */
const buckets = new Map();

export function createAuthRateLimiter({ windowMs = 60_000, max = 5, keyPrefix = "" } = {}) {
  return function authRateLimit(req, res, next) {
    const ip =
      (req.headers["x-forwarded-for"] || "").toString().split(",")[0].trim() ||
      req.socket?.remoteAddress ||
      "unknown";
    const key = `${keyPrefix}:${ip}`;
    const now = Date.now();
    let entry = buckets.get(key);
    if (!entry || now - entry.start >= windowMs) {
      entry = { start: now, count: 0 };
      buckets.set(key, entry);
    }
    entry.count += 1;
    if (entry.count > max) {
      const retryAfter = Math.ceil((windowMs - (now - entry.start)) / 1000);
      return res.status(429).json({
        error: "Too many attempts. Please wait a minute and try again.",
        retryAfter,
      });
    }
    next();
  };
}
