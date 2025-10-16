const axios = require("axios");

class ZoraService {
  constructor() {
    this.baseURL =
      process.env.ZORA_API_BASE_URL || "https://api-sdk.zora.engineering";
    this.timeout = parseInt(process.env.ZORA_API_TIMEOUT) || 10000;

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        Accept: "application/json",
        "User-Agent": "Base-Swiper-API/1.0.0",
      },
    });
  }

  /**
   * Fetch tokens from Zora explore API
   * @param {string} listType - Type of list to fetch (NEW, MOST_VALUABLE, TOP_GAINERS, FEATURED)
   * @param {number} count - Number of tokens to fetch (max 100)
   * @param {string} cursor - Pagination cursor
   * @returns {Promise<Object>} API response
   */
  async fetchExploreTokens(listType = "FEATURED", count = 100, cursor = null) {
    try {
      const params = {
        listType,
        count: Math.min(count, 100), // Cap at 100
      };

      if (cursor) {
        params.cursor = cursor;
      }

      console.log(`Fetching ${listType} tokens from Zora API...`);
      const response = await this.client.get("/explore", { params });

      console.log(`Successfully fetched ${listType} tokens:`, {
        count: response.data?.exploreList?.edges?.length || 0,
        hasNextPage: response.data?.exploreList?.pageInfo?.hasNextPage || false,
      });

      return response.data;
    } catch (error) {
      console.error(`Error fetching ${listType} tokens:`, error.message);
      throw new Error(`Failed to fetch ${listType} tokens: ${error.message}`);
    }
  }

  /**
   * Fetch detailed information about a specific token
   * @param {string} address - Token contract address
   * @param {number} chain - Chain ID (default: 8453 for Base)
   * @returns {Promise<Object>} Token details
   */
  async fetchTokenDetails(address, chain = 8453) {
    try {
      console.log(`Fetching token details for ${address} on chain ${chain}...`);
      const response = await this.client.get("/coin", {
        params: { address, chain },
      });

      console.log(`Successfully fetched token details for ${address}`);
      return response.data;
    } catch (error) {
      console.error(
        `Error fetching token details for ${address}:`,
        error.message
      );
      throw new Error(`Failed to fetch token details: ${error.message}`);
    }
  }

  /**
   * Transform Zora API response to our token format
   * @param {Object} zoraResponse - Response from Zora API
   * @param {string} listType - Type of list
   * @returns {Array} Array of transformed token objects
   */
  transformTokens(zoraResponse, listType) {
    if (!zoraResponse?.exploreList?.edges) {
      return [];
    }

    return zoraResponse.exploreList.edges.map((edge) => {
      const node = edge.node;

      return {
        zoraId: node.id,
        name: node.name,
        description: node.description,
        address: node.address?.toLowerCase(),
        symbol: node.symbol,
        totalSupply: node.totalSupply,
        totalVolume: node.totalVolume,
        volume24h: node.volume24h,
        createdAt: node.createdAt ? new Date(node.createdAt) : null,
        creatorAddress: node.creatorAddress,
        poolCurrencyToken: node.poolCurrencyToken,
        tokenPrice: node.tokenPrice,
        marketCap: node.marketCap,
        marketCapDelta24h: node.marketCapDelta24h,
        chainId: node.chainId || 8453,
        tokenUri: node.tokenUri,
        platformReferrerAddress: node.platformReferrerAddress,
        payoutRecipientAddress: node.payoutRecipientAddress,
        creatorProfile: node.creatorProfile,
        mediaContent: node.mediaContent,
        uniqueHolders: node.uniqueHolders,
        uniswapV4PoolKey: node.uniswapV4PoolKey,
        listType,
        lastUpdated: new Date(),
        isActive: true,
      };
    });
  }

  /**
   * Fetch all list types in parallel
   * @param {number} count - Number of tokens per list
   * @returns {Promise<Object>} Object with all list types
   */
  async fetchAllListTypes(count = 100) {
    const listTypes = ["NEW", "MOST_VALUABLE", "TOP_GAINERS", "FEATURED"];

    console.log("Fetching all list types from Zora API...");

    try {
      const promises = listTypes.map((listType) =>
        this.fetchExploreTokens(listType, count)
      );

      const results = await Promise.all(promises);

      const data = {};
      listTypes.forEach((listType, index) => {
        data[listType] = results[index];
      });

      console.log("Successfully fetched all list types");
      return data;
    } catch (error) {
      console.error("Error fetching all list types:", error.message);
      throw new Error(`Failed to fetch all list types: ${error.message}`);
    }
  }

  /**
   * Get pagination info from Zora response
   * @param {Object} zoraResponse - Response from Zora API
   * @returns {Object} Pagination info
   */
  getPaginationInfo(zoraResponse) {
    const pageInfo = zoraResponse?.exploreList?.pageInfo;
    return {
      hasNextPage: pageInfo?.hasNextPage || false,
      endCursor: pageInfo?.endCursor || null,
      totalCount: zoraResponse?.exploreList?.edges?.length || 0,
    };
  }
}

module.exports = ZoraService;
