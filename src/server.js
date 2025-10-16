require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");

// Import our modules
const database = require("./config/database");
const tokenRoutes = require("./routes/tokenRoutes");
const errorHandler = require("./middleware/errorHandler");
const {
  apiLimiter,
  refreshLimiter,
  searchLimiter,
} = require("./middleware/rateLimiter");
const dataRefreshJob = require("./jobs/dataRefresh");

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: false, // Disable CSP for API
    crossOriginEmbedderPolicy: false,
  })
);

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Rate limiting
app.use(apiLimiter);

// Health check endpoint (before rate limiting)
app.get("/health", async (req, res) => {
  try {
    const dbHealth = await database.healthCheck();
    const jobStatus = dataRefreshJob.getStatus();

    res.json({
      success: true,
      message: "Base Swiper API is healthy",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      database: dbHealth,
      dataRefresh: jobStatus,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Health check failed",
      error: error.message,
    });
  }
});

// API routes
app.use("/api/tokens", tokenRoutes);

// Apply specific rate limiting to search endpoints
app.use("/api/tokens/search", searchLimiter);
app.use("/api/tokens/refresh", refreshLimiter);

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Base Swiper API",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      tokens: "/api/tokens",
      documentation: "https://github.com/your-repo/base-swiper-api",
    },
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint not found",
    path: req.originalUrl,
  });
});

// Global error handler
app.use(errorHandler);

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully...");
  dataRefreshJob.stop();
  await database.disconnect();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, shutting down gracefully...");
  dataRefreshJob.stop();
  await database.disconnect();
  process.exit(0);
});

// Start server
async function startServer() {
  try {
    // Connect to database
    await database.connect();

    // Start data refresh job (5 minutes for FEATURED tokens only)
    const refreshInterval = 5; // 5 minutes
    dataRefreshJob.start(refreshInterval);

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Base Swiper API server running on port ${PORT}`);
      console.log(`📊 Data refresh interval: ${refreshInterval} minutes`);
      console.log(
        `🌐 CORS origin: ${process.env.CORS_ORIGIN || "http://localhost:3000"}`
      );
      console.log(`📝 Environment: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Start the server
startServer();

module.exports = app;
