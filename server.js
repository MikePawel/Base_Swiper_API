require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fs = require("fs").promises;
const axios = require("axios");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const app = express();
const PORT = process.env.PORT || 3001;

// CORS
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Base Swiper API",
      version: "1.0.0",
      description: "Simple API for fetching FEATURED tokens from Zora API",
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: "Development server",
      },
    ],
  },
  apis: ["./server.js"], // Path to the API files
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// File to store tokens
const TOKENS_FILE = "tokens.json";

// Fetch tokens from Zora API
async function fetchTokens() {
  try {
    console.log("🔄 Fetching FEATURED tokens from Zora API...");
    const response = await axios.get(
      "https://api-sdk.zora.engineering/explore",
      {
        params: { listType: "FEATURED", count: 100 },
        headers: { Accept: "application/json" },
        timeout: 10000,
      }
    );

    const tokens =
      response.data?.exploreList?.edges?.map((edge, index) => {
        const node = edge.node;
        return {
          id: index + 1,
          name: node.name || "Unnamed Token",
          description: node.description || "",
          address: node.address?.toLowerCase(),
          symbol: node.symbol,
          marketCap: node.marketCap,
          volume24h: node.volume24h,
          uniqueHolders: node.uniqueHolders,
          creatorProfile: node.creatorProfile,
          mediaContent: node.mediaContent,
          createdAt: node.createdAt,
          lastUpdated: new Date().toISOString(),
        };
      }) || [];

    // Save to JSON file
    await fs.writeFile(
      TOKENS_FILE,
      JSON.stringify(
        {
          tokens,
          lastUpdated: new Date().toISOString(),
          count: tokens.length,
        },
        null,
        2
      )
    );

    console.log(`✅ Saved ${tokens.length} tokens to file`);
    return tokens;
  } catch (error) {
    console.error("❌ Error fetching tokens:", error.message);
    return null;
  }
}

// Load tokens from file
async function loadTokens() {
  try {
    const data = await fs.readFile(TOKENS_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.log("No tokens file found");
    return { tokens: [], lastUpdated: null };
  }
}

// API Routes

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Check if the API is running and healthy
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Base Swiper API is healthy"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Base Swiper API is healthy",
    timestamp: new Date().toISOString(),
  });
});

/**
 * @swagger
 * /api/tokens/featured:
 *   get:
 *     summary: Get FEATURED tokens with pagination
 *     description: Retrieve FEATURED tokens from Zora API with pagination support
 *     tags: [Tokens]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of tokens per page
 *     responses:
 *       200:
 *         description: Successfully retrieved tokens
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       address:
 *                         type: string
 *                       symbol:
 *                         type: string
 *                       marketCap:
 *                         type: string
 *                       volume24h:
 *                         type: string
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *                     hasNext:
 *                       type: boolean
 *                     hasPrev:
 *                       type: boolean
 *                 lastUpdated:
 *                   type: string
 *                   format: date-time
 *       500:
 *         description: Internal server error
 */
// Get FEATURED tokens with pagination
app.get("/api/tokens/featured", async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const data = await loadTokens();

    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedTokens = data.tokens.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedTokens,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: data.tokens.length,
        pages: Math.ceil(data.tokens.length / parseInt(limit)),
        hasNext: endIndex < data.tokens.length,
        hasPrev: parseInt(page) > 1,
      },
      lastUpdated: data.lastUpdated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch tokens",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/tokens/address/{address}:
 *   get:
 *     summary: Get specific token by address
 *     description: Retrieve a specific token by its contract address
 *     tags: [Tokens]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Token contract address
 *     responses:
 *       200:
 *         description: Successfully retrieved token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     address:
 *                       type: string
 *                     symbol:
 *                       type: string
 *                     marketCap:
 *                       type: string
 *                     volume24h:
 *                       type: string
 *       404:
 *         description: Token not found
 *       500:
 *         description: Internal server error
 */
// Get specific token by address
app.get("/api/tokens/address/:address", async (req, res) => {
  try {
    const { address } = req.params;
    const data = await loadTokens();

    const token = data.tokens.find(
      (t) => t.address && t.address.toLowerCase() === address.toLowerCase()
    );

    if (!token) {
      return res.status(404).json({
        success: false,
        message: "Token not found",
      });
    }

    res.json({ success: true, data: token });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch token",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/tokens/search:
 *   get:
 *     summary: Search tokens
 *     description: Search tokens by name, symbol, or description
 *     tags: [Tokens]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query (minimum 2 characters)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Maximum number of results
 *     responses:
 *       200:
 *         description: Successfully searched tokens
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 query:
 *                   type: string
 *                 count:
 *                   type: integer
 *       400:
 *         description: Invalid search query
 *       500:
 *         description: Internal server error
 */
// Search tokens
app.get("/api/tokens/search", async (req, res) => {
  try {
    const { q: query, limit = 20 } = req.query;
    const data = await loadTokens();

    if (!query || query.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Search query must be at least 2 characters long",
      });
    }

    const searchRegex = new RegExp(query, "i");
    const results = data.tokens
      .filter(
        (token) =>
          token.name?.match(searchRegex) ||
          token.symbol?.match(searchRegex) ||
          token.description?.match(searchRegex)
      )
      .slice(0, parseInt(limit));

    res.json({
      success: true,
      data: results,
      query,
      count: results.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to search tokens",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/tokens/refresh:
 *   post:
 *     summary: Manual refresh tokens
 *     description: Manually trigger a refresh of FEATURED tokens from Zora API
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Tokens refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Tokens refreshed successfully"
 *       500:
 *         description: Failed to refresh tokens
 */
// Manual refresh
app.post("/api/tokens/refresh", async (req, res) => {
  try {
    console.log("🔄 Manual refresh triggered");
    await fetchTokens();
    res.json({
      success: true,
      message: "Tokens refreshed successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to refresh tokens",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /:
 *   get:
 *     summary: API information
 *     description: Get basic information about the API and available endpoints
 *     tags: [Info]
 *     responses:
 *       200:
 *         description: API information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Base Swiper API - Simple Version"
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 *                 endpoints:
 *                   type: object
 *                   properties:
 *                     health:
 *                       type: string
 *                       example: "/health"
 *                     featured:
 *                       type: string
 *                       example: "/api/tokens/featured"
 *                     search:
 *                       type: string
 *                       example: "/api/tokens/search"
 *                     refresh:
 *                       type: string
 *                       example: "POST /api/tokens/refresh"
 */
// Root endpoint
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Base Swiper API - Simple Version",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      featured: "/api/tokens/featured",
      search: "/api/tokens/search",
      refresh: "POST /api/tokens/refresh",
      docs: "/api-docs",
    },
  });
});

// Start server
async function startServer() {
  try {
    console.log("🚀 Starting Base Swiper API...");

    // Initial fetch
    await fetchTokens();

    // Fetch every 1 minute
    setInterval(async () => {
      console.log("⏰ 1-minute interval: Fetching tokens...");
      await fetchTokens();
    }, 60 * 1000);

    // Log every 10 seconds
    setInterval(() => {
      console.log("📊 Status check: API running, next fetch in progress...");
    }, 10 * 1000);

    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(
        `🌐 CORS origin: ${process.env.CORS_ORIGIN || "http://localhost:3000"}`
      );
      console.log("⏰ Auto-fetch every 1 minute");
      console.log("📊 Status logs every 10 seconds");
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();
