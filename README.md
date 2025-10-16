# Base Swiper API - Simple Version

Super simple backend that fetches FEATURED tokens from Zora API every 1 minute and stores them in a JSON file.

## Features

- 🔄 **Auto-fetch**: Fetches FEATURED tokens every 1 minute
- 📊 **Status logs**: Logs every 10 seconds
- 💾 **JSON storage**: No database needed, just a JSON file
- 🚀 **Pagination**: Get first 10, next 10, etc.
- 🔍 **Search**: Search tokens by name/symbol/description

## API Endpoints

- `GET /health` - Health check
- `GET /api/tokens/featured?page=1&limit=20` - Get FEATURED tokens with pagination
- `GET /api/tokens/address/:address` - Get specific token
- `GET /api/tokens/search?q=query` - Search tokens
- `POST /api/tokens/refresh` - Manual refresh
- `GET /api-docs` - **Swagger UI Documentation** 🎯

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Copy `env.example` to `.env` and update:

```env
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://your-frontend-domain.com
```

### 3. Run Server

```bash
# Development
npm run dev

# Production
npm start
```

## Coolify Deployment

### 1. Push to GitHub

Commit all files to your repository.

### 2. Coolify Setup

1. **Create New Project** in Coolify
2. **Connect Repository**
3. **Build Settings**:
   - **Root Directory**: `Base_Swiper_API`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Build Type**: Nixpacks (no Docker)

### 3. Environment Variables

Set in Coolify:

```
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://your-frontend-domain.com
```

### 4. Deploy

Click deploy and wait for completion.

## Frontend Integration

Replace your Zora API calls with:

```javascript
// Get FEATURED tokens (first 20)
const response = await fetch(
  "https://your-api-domain.com/api/tokens/featured?page=1&limit=20"
);
const data = await response.json();

// Get next 20 tokens
const nextPage = await fetch(
  "https://your-api-domain.com/api/tokens/featured?page=2&limit=20"
);

// Search tokens
const search = await fetch(
  "https://your-api-domain.com/api/tokens/search?q=base"
);
```

## How It Works

1. **Fetches every 1 minute**: Automatically gets 100 FEATURED tokens from Zora API
2. **Saves to JSON**: Stores in `tokens.json` file
3. **Serves with pagination**: Frontend can request first 10, next 10, etc.
4. **Logs every 10 seconds**: Shows status in console
5. **No database needed**: Just a simple JSON file
6. **Swagger UI**: Interactive API documentation at `/api-docs` 🎯

## File Structure

```
Base_Swiper_API/
├── server.js          # Main server file
├── package.json       # Dependencies
├── env.example        # Environment template
├── tokens.json        # Generated token data (auto-created)
└── README.md          # This file
```

## Monitoring

Check logs in Coolify to see:

- ✅ Token fetch success
- 📊 Status updates every 10 seconds
- ⏰ 1-minute fetch intervals
- ❌ Any errors

## License

MIT License
