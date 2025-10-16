# Base Swiper API

Backend API for Base Swiper that fetches and stores Zora token data in MongoDB.

## Features

- 🔄 **Automatic Data Refresh**: Fetches token data from Zora API every 30 minutes
- 📊 **Multiple List Types**: Supports NEW, MOST_VALUABLE, TOP_GAINERS, FEATURED
- 🔍 **Search & Filter**: Search tokens by name, symbol, or description
- 📈 **Analytics**: Get top tokens by market cap and trending tokens
- 🚀 **High Performance**: Optimized MongoDB queries with proper indexing
- 🛡️ **Rate Limiting**: Built-in rate limiting and security features

## API Endpoints

### Token Endpoints

- `GET /api/tokens/:listType` - Get tokens by list type (NEW, MOST_VALUABLE, TOP_GAINERS, FEATURED)
- `GET /api/tokens/address/:address` - Get specific token by contract address
- `GET /api/tokens/search?q=query` - Search tokens by name/symbol/description
- `GET /api/tokens/top/:listType` - Get top tokens by market cap
- `GET /api/tokens/trending/:listType` - Get trending tokens by 24h volume
- `GET /api/tokens/stats` - Get database statistics
- `GET /api/tokens/health` - Health check endpoint

### Admin Endpoints

- `POST /api/tokens/refresh` - Manually refresh token data
- `GET /health` - Overall API health check

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Copy the example environment file:

```bash
cp env.example .env
```

Update the `.env` file with your MongoDB connection string:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/base_swiper?retryWrites=true&w=majority
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://your-frontend-domain.com
```

### 3. Run the Server

```bash
# Development
npm run dev

# Production
npm start
```

## MongoDB Setup

### 1. Create MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a new cluster (M0 Sandbox is free)
4. Create a database user
5. Get your connection string

### 2. Database Configuration

The API will automatically create the following collections:

- `tokens` - Main token data with proper indexing

### 3. Indexes

The following indexes are automatically created for optimal performance:

- `{ address: 1, listType: 1 }`
- `{ listType: 1, marketCapNumeric: -1 }`
- `{ listType: 1, volume24hNumeric: -1 }`
- `{ listType: 1, createdAt: -1 }`
- `{ lastUpdated: -1 }`

## Coolify Deployment

### 1. Prepare Your Repository

1. Push your code to GitHub/GitLab
2. Make sure all files are committed

### 2. Coolify Setup

1. **Create New Project**:

   - Go to your Coolify dashboard
   - Click "New Project"
   - Choose "Git Repository"
   - Connect your repository

2. **Configure Build Settings**:

   - **Build Pack**: Node.js
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Node Version**: 18.x or higher

3. **Environment Variables**:
   Add these environment variables in Coolify:

   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/base_swiper?retryWrites=true&w=majority
   NODE_ENV=production
   PORT=3001
   CORS_ORIGIN=https://your-frontend-domain.com
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   REFRESH_INTERVAL_MINUTES=30
   ```

4. **Deploy**:
   - Click "Deploy"
   - Wait for the build to complete
   - Your API will be available at the provided URL

### 3. Domain Configuration (Optional)

1. **Custom Domain**:

   - In Coolify, go to your project settings
   - Add a custom domain (e.g., `api.yourdomain.com`)
   - Configure DNS records as instructed

2. **SSL Certificate**:
   - Coolify automatically handles SSL certificates
   - Your API will be available over HTTPS

## Frontend Integration

Update your frontend to use the new API endpoints:

```javascript
// Replace your current Zora API calls with:
const response = await fetch(
  "https://your-api-domain.com/api/tokens/FEATURED?page=1&limit=20"
);
const data = await response.json();

// Search tokens
const searchResponse = await fetch(
  "https://your-api-domain.com/api/tokens/search?q=base&listType=FEATURED"
);
const searchData = await searchResponse.json();

// Get specific token
const tokenResponse = await fetch(
  "https://your-api-domain.com/api/tokens/address/0x..."
);
const tokenData = await tokenResponse.json();
```

## Monitoring & Maintenance

### 1. Health Monitoring

Check API health:

```bash
curl https://your-api-domain.com/health
```

### 2. Manual Data Refresh

Force refresh all data:

```bash
curl -X POST https://your-api-domain.com/api/tokens/refresh
```

Refresh specific list type:

```bash
curl -X POST https://your-api-domain.com/api/tokens/refresh \
  -H "Content-Type: application/json" \
  -d '{"listType": "FEATURED", "count": 100}'
```

### 3. Database Statistics

Get database stats:

```bash
curl https://your-api-domain.com/api/tokens/stats
```

## Performance Optimization

### 1. MongoDB Atlas Optimization

- Use MongoDB Atlas M10+ for production
- Enable connection pooling
- Monitor query performance in Atlas dashboard

### 2. API Optimization

- The API includes automatic data refresh every 30 minutes
- Old tokens are automatically cleaned up after 7 days
- Rate limiting prevents abuse
- Compression reduces response sizes

### 3. Caching Strategy

Consider adding Redis for caching if you need faster response times:

```javascript
// Example Redis integration
const redis = require("redis");
const client = redis.createClient();

// Cache frequently accessed data
const cacheKey = `tokens:${listType}:${page}`;
const cached = await client.get(cacheKey);
if (cached) return JSON.parse(cached);
```

## Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**:

   - Check your MONGODB_URI
   - Ensure your IP is whitelisted in Atlas
   - Verify database user permissions

2. **Rate Limiting**:

   - Adjust RATE_LIMIT_MAX_REQUESTS if needed
   - Implement client-side caching

3. **Data Not Updating**:
   - Check the refresh job status
   - Manually trigger refresh
   - Check Zora API availability

### Logs

Check Coolify logs for debugging:

- Build logs: Check for dependency issues
- Runtime logs: Check for runtime errors
- Database logs: Check MongoDB Atlas logs

## Security Considerations

1. **Environment Variables**: Never commit `.env` files
2. **CORS**: Configure CORS_ORIGIN properly
3. **Rate Limiting**: Adjust limits based on your needs
4. **MongoDB Security**: Use strong passwords and IP whitelisting

## Support

For issues and questions:

1. Check the logs in Coolify
2. Verify MongoDB Atlas connection
3. Test API endpoints manually
4. Check environment variables

## License

MIT License - see LICENSE file for details.
