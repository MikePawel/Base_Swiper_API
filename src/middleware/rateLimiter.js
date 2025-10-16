const rateLimit = require("express-rate-limit");

/**
 * Rate limiting middleware
 */
const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message: message || "Too many requests, please try again later",
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        message: "Too many requests, please try again later",
        retryAfter: Math.ceil(windowMs / 1000),
      });
    },
  });
};

// General API rate limiter
const apiLimiter = createRateLimiter(
  parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 100 requests per window
  "Too many API requests, please try again later"
);

// Strict rate limiter for refresh endpoints
const refreshLimiter = createRateLimiter(
  5 * 60 * 1000, // 5 minutes
  5, // 5 requests per 5 minutes
  "Too many refresh requests, please wait before trying again"
);

// Search rate limiter
const searchLimiter = createRateLimiter(
  60 * 1000, // 1 minute
  30, // 30 requests per minute
  "Too many search requests, please try again later"
);

module.exports = {
  apiLimiter,
  refreshLimiter,
  searchLimiter,
};
