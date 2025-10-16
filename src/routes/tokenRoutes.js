const express = require("express");
const TokenController = require("../controllers/tokenController");

const router = express.Router();
const tokenController = new TokenController();

// Token routes - Only FEATURED tokens
router.get("/featured", tokenController.getFeaturedTokens.bind(tokenController));
router.get("/address/:address", tokenController.getTokenByAddress.bind(tokenController));
router.get("/search", tokenController.searchTokens.bind(tokenController));
router.get("/stats", tokenController.getStats.bind(tokenController));
router.get("/health", tokenController.healthCheck.bind(tokenController));

// Admin routes (for refreshing data)
router.post("/refresh", tokenController.refreshTokens.bind(tokenController));

module.exports = router;
