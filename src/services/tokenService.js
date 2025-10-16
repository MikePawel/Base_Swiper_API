const Token = require("../models/Token");

class TokenService {
  /**
   * Store tokens in database
   * @param {Array} tokens - Array of token objects
   * @returns {Promise<Object>} Result of bulk operation
   */
  async storeTokens(tokens) {
    if (!tokens || tokens.length === 0) {
      return { success: false, message: "No tokens to store" };
    }

    try {
      console.log(`Storing ${tokens.length} tokens in database...`);

      const operations = tokens.map((token) => ({
        updateOne: {
          filter: { zoraId: token.zoraId },
          update: { $set: token },
          upsert: true,
        },
      }));

      const result = await Token.bulkWrite(operations);

      console.log(`Successfully stored tokens:`, {
        matched: result.matchedCount,
        modified: result.modifiedCount,
        upserted: result.upsertedCount,
      });

      return {
        success: true,
        matched: result.matchedCount,
        modified: result.modifiedCount,
        upserted: result.upsertedCount,
        total: tokens.length,
      };
    } catch (error) {
      console.error("Error storing tokens:", error.message);
      throw new Error(`Failed to store tokens: ${error.message}`);
    }
  }

  /**
   * Replace all FEATURED tokens with new data (overwrite existing)
   * @param {Array} tokens - Array of FEATURED token objects
   * @returns {Promise<Object>} Result of replacement operation
   */
  async replaceFeaturedTokens(tokens) {
    if (!tokens || tokens.length === 0) {
      return { success: false, message: "No tokens to store" };
    }

    try {
      console.log(`Replacing FEATURED tokens with ${tokens.length} new tokens...`);

      // Delete all existing FEATURED tokens
      const deleteResult = await Token.deleteMany({ listType: "FEATURED" });
      
      // Insert new FEATURED tokens
      const insertResult = await Token.insertMany(tokens);
      
      console.log(`Successfully replaced FEATURED tokens:`, {
        deleted: deleteResult.deletedCount,
        inserted: insertResult.length,
      });

      return {
        success: true,
        deleted: deleteResult.deletedCount,
        inserted: insertResult.length,
        total: tokens.length,
      };
    } catch (error) {
      console.error("Error replacing FEATURED tokens:", error.message);
      throw new Error(`Failed to replace FEATURED tokens: ${error.message}`);
    }
  }

  /**
   * Get tokens by list type with pagination
   * @param {string} listType - Type of list
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @returns {Promise<Object>} Paginated tokens
   */
  async getTokensByListType(listType, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;

      const [tokens, total] = await Promise.all([
        Token.find({
          listType,
          isActive: true,
        })
          .sort({ lastUpdated: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Token.countDocuments({ listType, isActive: true }),
      ]);

      return {
        tokens,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNext: skip + limit < total,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      console.error(`Error fetching ${listType} tokens:`, error.message);
      throw new Error(`Failed to fetch ${listType} tokens: ${error.message}`);
    }
  }

  /**
   * Get token by address
   * @param {string} address - Token contract address
   * @returns {Promise<Object|null>} Token object or null
   */
  async getTokenByAddress(address) {
    try {
      const token = await Token.findOne({
        address: address.toLowerCase(),
        isActive: true,
      }).lean();

      return token;
    } catch (error) {
      console.error(
        `Error fetching token by address ${address}:`,
        error.message
      );
      throw new Error(`Failed to fetch token: ${error.message}`);
    }
  }

  /**
   * Get tokens by multiple addresses
   * @param {Array} addresses - Array of token addresses
   * @returns {Promise<Array>} Array of token objects
   */
  async getTokensByAddresses(addresses) {
    try {
      const normalizedAddresses = addresses.map((addr) => addr.toLowerCase());

      const tokens = await Token.find({
        address: { $in: normalizedAddresses },
        isActive: true,
      }).lean();

      return tokens;
    } catch (error) {
      console.error("Error fetching tokens by addresses:", error.message);
      throw new Error(`Failed to fetch tokens: ${error.message}`);
    }
  }

  /**
   * Search tokens by name or symbol
   * @param {string} query - Search query
   * @param {string} listType - Optional list type filter
   * @param {number} limit - Maximum results
   * @returns {Promise<Array>} Array of matching tokens
   */
  async searchTokens(query, listType = null, limit = 20) {
    try {
      const searchRegex = new RegExp(query, "i");
      const filter = {
        isActive: true,
        $or: [
          { name: searchRegex },
          { symbol: searchRegex },
          { description: searchRegex },
        ],
      };

      if (listType) {
        filter.listType = listType;
      }

      const tokens = await Token.find(filter)
        .sort({ marketCapNumeric: -1 })
        .limit(limit)
        .lean();

      return tokens;
    } catch (error) {
      console.error(
        `Error searching tokens with query "${query}":`,
        error.message
      );
      throw new Error(`Failed to search tokens: ${error.message}`);
    }
  }

  /**
   * Get top tokens by market cap
   * @param {string} listType - Type of list
   * @param {number} limit - Number of tokens
   * @returns {Promise<Array>} Array of top tokens
   */
  async getTopTokensByMarketCap(listType, limit = 10) {
    try {
      const tokens = await Token.find({
        listType,
        isActive: true,
        marketCapNumeric: { $gt: 0 },
      })
        .sort({ marketCapNumeric: -1 })
        .limit(limit)
        .lean();

      return tokens;
    } catch (error) {
      console.error(
        `Error fetching top tokens for ${listType}:`,
        error.message
      );
      throw new Error(`Failed to fetch top tokens: ${error.message}`);
    }
  }

  /**
   * Get trending tokens (highest 24h volume)
   * @param {string} listType - Type of list
   * @param {number} limit - Number of tokens
   * @returns {Promise<Array>} Array of trending tokens
   */
  async getTrendingTokens(listType, limit = 10) {
    try {
      const tokens = await Token.find({
        listType,
        isActive: true,
        volume24hNumeric: { $gt: 0 },
      })
        .sort({ volume24hNumeric: -1 })
        .limit(limit)
        .lean();

      return tokens;
    } catch (error) {
      console.error(
        `Error fetching trending tokens for ${listType}:`,
        error.message
      );
      throw new Error(`Failed to fetch trending tokens: ${error.message}`);
    }
  }

  /**
   * Get database statistics
   * @returns {Promise<Object>} Database statistics
   */
  async getStats() {
    try {
      const [totalTokens, byListType, recentTokens] = await Promise.all([
        Token.countDocuments({ isActive: true }),
        Token.aggregate([
          { $match: { isActive: true } },
          { $group: { _id: "$listType", count: { $sum: 1 } } },
        ]),
        Token.countDocuments({
          isActive: true,
          lastUpdated: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        }),
      ]);

      return {
        totalTokens,
        byListType: byListType.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        recentTokens,
        lastUpdated: new Date(),
      };
    } catch (error) {
      console.error("Error fetching database stats:", error.message);
      throw new Error(`Failed to fetch stats: ${error.message}`);
    }
  }

  /**
   * Clean up old or inactive tokens
   * @param {number} daysOld - Number of days old to consider for cleanup
   * @returns {Promise<Object>} Cleanup result
   */
  async cleanupOldTokens(daysOld = 7) {
    try {
      const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);

      const result = await Token.updateMany(
        {
          isActive: true,
          lastUpdated: { $lt: cutoffDate },
        },
        { $set: { isActive: false } }
      );

      console.log(`Cleaned up ${result.modifiedCount} old tokens`);
      return {
        success: true,
        cleaned: result.modifiedCount,
      };
    } catch (error) {
      console.error("Error cleaning up old tokens:", error.message);
      throw new Error(`Failed to cleanup tokens: ${error.message}`);
    }
  }
}

module.exports = TokenService;
