const mongoose = require("mongoose");

const creatorProfileSchema = new mongoose.Schema({
  id: String,
  handle: String,
  avatar: {
    previewImage: {
      blurhash: String,
      medium: String,
      small: String,
    },
  },
  socialAccounts: {
    instagram: {
      username: String,
      displayName: String,
      id: String,
    },
    tiktok: {
      username: String,
      displayName: String,
      id: String,
    },
    twitter: {
      username: String,
      displayName: String,
      id: String,
    },
    farcaster: {
      username: String,
      displayName: String,
      id: String,
    },
  },
  creatorCoin: {
    address: String,
  },
});

const poolCurrencyTokenSchema = new mongoose.Schema({
  address: String,
  name: String,
  decimals: Number,
});

const tokenPriceSchema = new mongoose.Schema({
  priceInUsdc: String,
  currencyAddress: String,
  priceInPoolToken: String,
});

const mediaContentSchema = new mongoose.Schema({
  mimeType: String,
  originalUri: String,
  previewImage: {
    small: String,
    medium: String,
    blurhash: String,
  },
});

const uniswapV4PoolKeySchema = new mongoose.Schema({
  token0Address: String,
  token1Address: String,
  fee: Number,
  tickSpacing: Number,
  hookAddress: String,
});

const tokenSchema = new mongoose.Schema(
  {
    // Zora API fields
    zoraId: { type: String, required: true, unique: true },
    name: String,
    description: String,
    address: { type: String, required: true, index: true },
    symbol: String,
    totalSupply: String,
    totalVolume: String,
    volume24h: String,
    createdAt: Date,
    creatorAddress: String,
    poolCurrencyToken: poolCurrencyTokenSchema,
    tokenPrice: tokenPriceSchema,
    marketCap: String,
    marketCapDelta24h: String,
    chainId: { type: Number, default: 8453, index: true },
    tokenUri: String,
    platformReferrerAddress: String,
    payoutRecipientAddress: String,
    creatorProfile: creatorProfileSchema,
    mediaContent: mediaContentSchema,
    uniqueHolders: Number,
    uniswapV4PoolKey: uniswapV4PoolKeySchema,

    // Our metadata
    listType: {
      type: String,
      enum: ["NEW", "MOST_VALUABLE", "TOP_GAINERS", "FEATURED"],
      required: true,
      index: true,
    },
    lastUpdated: { type: Date, default: Date.now, index: true },
    isActive: { type: Boolean, default: true, index: true },

    // Computed fields for easier querying
    marketCapNumeric: { type: Number, index: true },
    volume24hNumeric: { type: Number, index: true },
    uniqueHoldersNumeric: { type: Number, index: true },
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
tokenSchema.index({ address: 1, listType: 1 });
tokenSchema.index({ listType: 1, marketCapNumeric: -1 });
tokenSchema.index({ listType: 1, volume24hNumeric: -1 });
tokenSchema.index({ listType: 1, createdAt: -1 });
tokenSchema.index({ lastUpdated: -1 });

// Pre-save middleware to compute numeric fields
tokenSchema.pre("save", function (next) {
  if (this.marketCap) {
    this.marketCapNumeric = parseFloat(this.marketCap) || 0;
  }
  if (this.volume24h) {
    this.volume24hNumeric = parseFloat(this.volume24h) || 0;
  }
  if (this.uniqueHolders) {
    this.uniqueHoldersNumeric = this.uniqueHolders;
  }
  next();
});

// Static method to get tokens by list type with pagination
tokenSchema.statics.getTokensByListType = function (
  listType,
  page = 1,
  limit = 20
) {
  const skip = (page - 1) * limit;
  return this.find({
    listType,
    isActive: true,
  })
    .sort({ lastUpdated: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
};

// Static method to get token by address
tokenSchema.statics.getTokenByAddress = function (address) {
  return this.findOne({
    address: address.toLowerCase(),
    isActive: true,
  }).lean();
};

// Static method to update or create token
tokenSchema.statics.upsertToken = function (tokenData) {
  return this.findOneAndUpdate({ zoraId: tokenData.zoraId }, tokenData, {
    upsert: true,
    new: true,
    setDefaultsOnInsert: true,
  });
};

module.exports = mongoose.model("Token", tokenSchema);
