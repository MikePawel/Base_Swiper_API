const ZoraService = require("../services/zoraService");
const TokenService = require("../services/tokenService");

/**
 * Data refresh job for keeping token data up to date
 */
class DataRefreshJob {
  constructor() {
    this.zoraService = new ZoraService();
    this.tokenService = new TokenService();
    this.isRunning = false;
    this.lastRun = null;
    this.nextRun = null;
    this.interval = null;
  }

  /**
   * Start the data refresh job
   * @param {number} intervalMinutes - Refresh interval in minutes
   */
  start(intervalMinutes = 30) {
    if (this.isRunning) {
      console.log("Data refresh job is already running");
      return;
    }

    console.log(
      `Starting data refresh job with ${intervalMinutes} minute interval`
    );

    this.isRunning = true;
    this.interval = setInterval(() => {
      this.runRefresh();
    }, intervalMinutes * 60 * 1000);

    // Run immediately on start
    this.runRefresh();
  }

  /**
   * Stop the data refresh job
   */
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
    console.log("Data refresh job stopped");
  }

  /**
   * Run the refresh process - Only FEATURED tokens, overwrite existing data
   */
  async runRefresh() {
    if (
      this.isRunning &&
      this.lastRun &&
      Date.now() - this.lastRun < 2 * 60 * 1000 // 2 minutes cooldown
    ) {
      console.log("Refresh already running, skipping...");
      return;
    }

    this.lastRun = Date.now();
    console.log("Starting FEATURED tokens refresh...");

    try {
      // Only fetch FEATURED tokens
      console.log("Fetching FEATURED tokens from Zora API...");
      const zoraData = await this.zoraService.fetchExploreTokens("FEATURED", 100);
      const transformedTokens = this.zoraService.transformTokens(zoraData, "FEATURED");

      // Overwrite all existing FEATURED tokens
      const result = await this.tokenService.replaceFeaturedTokens(transformedTokens);

      console.log(`✅ FEATURED tokens refreshed: ${result.deleted} deleted, ${result.inserted} inserted`);
      return result;
    } catch (error) {
      console.error("❌ Data refresh failed:", error.message);
      throw error;
    }
  }

  /**
   * Get job status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastRun: this.lastRun,
      nextRun: this.nextRun,
      interval: this.interval ? "active" : "inactive",
    };
  }

  /**
   * Force refresh all data
   */
  async forceRefresh() {
    console.log("Force refreshing all data...");
    return await this.runRefresh();
  }

  /**
   * Force refresh FEATURED tokens only
   */
  async refreshFeaturedTokens() {
    try {
      console.log("Force refreshing FEATURED tokens...");

      const zoraData = await this.zoraService.fetchExploreTokens("FEATURED", 100);
      const transformedTokens = this.zoraService.transformTokens(zoraData, "FEATURED");
      const result = await this.tokenService.replaceFeaturedTokens(transformedTokens);

      console.log(`✅ FEATURED tokens refresh completed:`, result);
      return result;
    } catch (error) {
      console.error(`❌ Error force refreshing FEATURED tokens:`, error.message);
      throw error;
    }
  }
}

// Create singleton instance
const dataRefreshJob = new DataRefreshJob();

module.exports = dataRefreshJob;
