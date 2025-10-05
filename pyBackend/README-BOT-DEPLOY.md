# 🤖 Python AI Bot Deployment Guide

Deploy only the Python AI bot to work with your existing frontend and backend.

## 🎯 What This Does

Your Python bot will:
- ✅ Connect to your existing Node.js backend
- ✅ Create AI-powered bot users automatically
- ✅ Generate 1-4 image posts every 15-45 minutes
- ✅ Run 24/7 in the cloud
- ✅ Use smart timing based on global timezones
- ✅ Create unique avatars (no duplicates)

## 🚀 Quick Deploy (5 minutes)

### 1. Setup Environment
```bash
cd pyBackend
cp .env.example .env
```

Edit `.env` file:
```env
# Your existing backend URL
NODE_BACKEND_URL=https://your-existing-backend.com

# Get from unsplash.com/developers
UNSPLASH_ACCESS_KEY=your-unsplash-key

# Bot settings
BOT_ENABLED=true
BOT_INTERVAL_MINUTES=30
BOT_POSTS_PER_RUN=3
```

### 2. Deploy to Railway (Recommended)
```bash
chmod +x deploy-bot.sh
./deploy-bot.sh
# Choose option 3: Deploy to Railway
```

### 3. Done! 🎉
Your bot is now running 24/7 and will automatically:
- Create new bot users with unique personalities
- Post 1-4 images every 30 minutes (with smart timing)
- Connect to your existing backend API

## ☁️ Deployment Options

### 🚂 Railway (Best for Bots)
- ✅ **Always running**: Perfect for bots
- ✅ **Free tier**: Generous limits
- ✅ **Auto HTTPS**: Built-in SSL
- ✅ **Easy setup**: One command deploy
- 💰 **Cost**: Free → $5/month

**Deploy:**
```bash
./deploy-bot.sh
# Choose option 3
```

### 🎨 Render
- ✅ **Free tier**: Good for testing
- ✅ **Auto deploy**: Git integration
- 💰 **Cost**: Free → $7/month

**Deploy:**
```bash
./deploy-bot.sh
# Choose option 4
```

### 🟣 Heroku
- ✅ **Reliable**: Proven platform
- 💰 **Cost**: $7/month

**Deploy:**
```bash
./deploy-bot.sh
# Choose option 5
```

## 🔧 Local Testing

Test before deploying:
```bash
./deploy-bot.sh
# Choose option 1: Test connection
# Choose option 2: Run locally
```

Access:
- Bot API: http://localhost:8001
- Bot Status: http://localhost:8001/api/bot/status
- Create Post: http://localhost:8001/api/bot/create-post

## 📊 Monitor Your Bot

### Check Bot Status
```bash
curl https://your-bot.railway.app/api/bot/status
```

### View Bot Statistics
```bash
curl https://your-bot.railway.app/api/bot/stats
```

Response:
```json
{
  "total_bots": 15,
  "active_bots": 12,
  "total_posts": 347,
  "avg_engagement": 0.73,
  "personality_distribution": {
    "photographer": 3,
    "traveler": 4,
    "artist": 2,
    "lifestyle": 2,
    "tech": 1
  }
}
```

### Manual Post Creation
```bash
curl -X POST https://your-bot.railway.app/api/bot/create-post \
  -H "Content-Type: application/json" \
  -d '{"topic": "nature", "count": 1}'
```

## 🤖 Bot Features

### Smart Bot Creation
- Creates new bots automatically when needed
- 6 personality types: photographer, traveler, artist, lifestyle, tech, foodie
- Unique names, usernames, bios, and avatars
- Tracks activity and engagement

### Intelligent Content
- 1-4 images per post (smart selection)
- AI-powered captions based on image analysis
- Personality-driven content style
- Context-aware hashtags

### Global Timing
- Posts during peak hours across timezones
- Avoids low-activity periods (2-6 AM UTC)
- Smart intervals: 15-45 minutes based on activity
- Weekend vs weekday content strategies

## 🔐 Required API Keys

### Unsplash API (Free)
1. Go to [unsplash.com/developers](https://unsplash.com/developers)
2. Create new application
3. Copy Access Key to `.env`

### Your Backend URL
Make sure your existing backend has these endpoints:
- `POST /api/bot/create-post` - For bot posts
- `GET /api/health` - For health checks

## 🛠️ Troubleshooting

### Bot Not Posting
```bash
# Check bot status
curl https://your-bot.railway.app/api/bot/status

# Check logs (Railway)
railway logs

# Check environment variables
railway variables
```

### Connection Issues
```bash
# Test connection to your backend
./deploy-bot.sh
# Choose option 1: Test connection
```

### Common Issues

1. **"Cannot connect to backend"**
   - Check `NODE_BACKEND_URL` in `.env`
   - Ensure your backend is running
   - Verify CORS settings allow bot requests

2. **"No photos found"**
   - Check `UNSPLASH_ACCESS_KEY`
   - Verify Unsplash API limits

3. **"Bot not creating posts"**
   - Check `BOT_ENABLED=true`
   - Verify bot timing (may wait for optimal hours)

## 💰 Cost Breakdown

| Platform | Free Tier | Paid |
|----------|-----------|------|
| Railway | 500 hours/month | $5/month unlimited |
| Render | 750 hours/month | $7/month |
| Heroku | 550 hours/month | $7/month |

**Recommendation**: Railway for 24/7 bot operation

## 🎯 Expected Results

After deployment, your social platform will have:
- ✅ **Continuous content**: New posts every 15-45 minutes
- ✅ **Diverse creators**: Multiple bot personalities
- ✅ **High-quality images**: Curated from Unsplash
- ✅ **Smart timing**: Posts during peak engagement hours
- ✅ **Scalable growth**: Unlimited bot creation
- ✅ **Zero maintenance**: Fully automated

Your existing users will see a vibrant, active platform with fresh content 24/7! 🚀
