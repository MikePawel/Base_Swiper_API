const TokenService = require("../services/tokenService");
const ZoraService = require("../services/zoraService");

class TokenController {
  constructor() {
    this.tokenService = new TokenService();
    this.zoraService = new ZoraService();
  }

  /**
   * Get FEATURED tokens only
   * GET /api/tokens/featured
   */
  async getFeaturedTokens(req, res) {
    try {
      const { page = 1, limit = 20 } = req.query;

      const result = await this.tokenService.getTokensByListType(
        "FEATURED",
        parseInt(page),
        parseInt(limit)
      );

      res.json({
        success: true,
        data: result.tokens,
        pagination: result.pagination,
        listType: "FEATURED",
      });
    } catch (error) {
      console.error("Error in getFeaturedTokens:", error.message);
      res.status(500).json({
        success: false,
        message: "Failed to fetch FEATURED tokens",
        error: error.message,
      });
    }
  }

  /**
   * Get token by address
   * GET /api/tokens/address/:address
   */
  async getTokenByAddress(req, res) {
    try {
      const { address } = req.params;

      if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
        return res.status(400).json({
          success: false,
          message: "Invalid address format",
        });
      }

      const token = await this.tokenService.getTokenByAddress(address);

      if (!token) {
        return res.status(404).json({
          success: false,
          message: "Token not found",
        });
      }

      res.json({
        success: true,
        data: token,
      });
    } catch (error) {
      console.error("Error in getTokenByAddress:", error.message);
      res.status(500).json({
        success: false,
        message: "Failed to fetch token",
        error: error.message,
      });
    }
  }

  /**
   * Search tokens
   * GET /api/tokens/search?q=query&listType=FEATURED&limit=20
   */
  async searchTokens(req, res) {
    try {
      const { q: query, listType, limit = 20 } = req.query;

      if (!query || query.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: "Search query must be at least 2 characters long",
        });
      }

      const tokens = await this.tokenService.searchTokens(
        query.trim(),
        listType,
        parseInt(limit)
      );

      res.json({
        success: true,
        data: tokens,
        query: query.trim(),
        listType: listType || "all",
        count: tokens.length,
      });
    } catch (error) {
      console.error("Error in searchTokens:", error.message);
      res.status(500).json({
        success: false,
        message: "Failed to search tokens",
        error: error.message,
      });
    }
  }

  /**
   * Get top tokens by market cap
   * GET /api/tokens/top/:listType?limit=10
   */
  async getTopTokens(req, res) {
    try {
      const { listType } = req.params;
      const { limit = 10 } = req.query;

      const validListTypes = [
        "NEW",
        "MOST_VALUABLE",
        "TOP_GAINERS",
        "FEATURED",
      ];
      if (!validListTypes.includes(listType)) {
        return res.status(400).json({
          success: false,
          message: "Invalid list type",
        });
      }

      const tokens = await this.tokenService.getTopTokensByMarketCap(
        listType,
        parseInt(limit)
      );

      res.json({
        success: true,
        data: tokens,
        listType,
        count: tokens.length,
      });
    } catch (error) {
      console.error("Error in getTopTokens:", error.message);
      res.status(500).json({
        success: false,
        message: "Failed to fetch top tokens",
        error: error.message,
      });
    }
  }

  /**
   * Get trending tokens
   * GET /api/tokens/trending/:listType?limit=10
   */
  async getTrendingTokens(req, res) {
    try {
      const { listType } = req.params;
      const { limit = 10 } = req.query;

      const validListTypes = [
        "NEW",
        "MOST_VALUABLE",
        "TOP_GAINERS",
        "FEATURED",
      ];
      if (!validListTypes.includes(listType)) {
        return res.status(400).json({
          success: false,
          message: "Invalid list type",
        });
      }

      const tokens = await this.tokenService.getTrendingTokens(
        listType,
        parseInt(limit)
      );

      res.json({
        success: true,
        data: tokens,
        listType,
        count: tokens.length,
      });
    } catch (error) {
      console.error("Error in getTrendingTokens:", error.message);
      res.status(500).json({
        success: false,
        message: "Failed to fetch trending tokens",
        error: error.message,
      });
    }
  }

  /**
   * Refresh FEATURED tokens from Zora API
   * POST /api/tokens/refresh
   */
  async refreshTokens(req, res) {
    try {
      console.log("Manually refreshing FEATURED tokens...");
      
      // Fetch FEATURED tokens from Zora API
      const zoraData = await this.zoraService.fetchExploreTokens("FEATURED", 100);
      const transformedTokens = this.zoraService.transformTokens(zoraData, "FEATURED");
      
      // Replace all existing FEATURED tokens
      const result = await this.tokenService.replaceFeaturedTokens(transformedTokens);

      res.json({
        success: true,
        message: "Successfully refreshed FEATURED tokens",
        data: result,
      });
    } catch (error) {
      console.error("Error in refreshTokens:", error.message);
      res.status(500).json({
        success: false,
        message: "Failed to refresh FEATURED tokens",
        error: error.message,
      });
    }
  }

  /**
   * Get database statistics
   * GET /api/tokens/stats
   */
  async getStats(req, res) {
    try {
      const stats = await this.tokenService.getStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("Error in getStats:", error.message);
      res.status(500).json({
        success: false,
        message: "Failed to fetch statistics",
        error: error.message,
      });
    }
  }

  /**
   * Health check endpoint
   * GET /api/tokens/health
   */
  async healthCheck(req, res) {
    try {
      const stats = await this.tokenService.getStats();

      res.json({
        success: true,
        message: "API is healthy",
        timestamp: new Date().toISOString(),
        stats: {
          totalTokens: stats.totalTokens,
          lastUpdated: stats.lastUpdated,
        },
      });
    } catch (error) {
      console.error("Error in healthCheck:", error.message);
      res.status(500).json({
        success: false,
        message: "API health check failed",
        error: error.message,
      });
    }
  }
}

module.exports = TokenController;
