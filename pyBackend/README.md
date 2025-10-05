# HooksDream Python Backend

Python backend service cho HooksDream social media platform, tập trung vào AI automation và content generation.

## 🚀 Features

- **Automated Content Bot**: Tự động tạo posts với ảnh từ Unsplash
- **Unsplash Integration**: Fetch ảnh chất lượng cao từ Unsplash API
- **FastAPI Framework**: Modern, fast web framework
- **Hybrid Architecture**: Làm việc cùng Node.js backend
- **Scheduled Tasks**: Tự động tạo content theo lịch trình

## 📁 Project Structure

```
pyBackend/
├── main.py                 # FastAPI application entry point
├── config.py              # Configuration settings
├── requirements.txt       # Python dependencies
├── .env                   # Environment variables
├── services/
│   ├── __init__.py
│   ├── unsplash_service.py # Unsplash API integration
│   └── bot_service.py     # Automated content generation
└── routers/
    ├── __init__.py
    ├── bot_router.py      # Bot management endpoints
    └── unsplash_router.py # Unsplash API endpoints
```

## 🛠️ Installation & Setup

### 1. Install Dependencies

```bash
cd pyBackend
pip install -r requirements.txt
```

### 2. Environment Configuration

Copy `.env.example` to `.env` và cập nhật các values:

```env
# Unsplash API (đã có sẵn)
UNSPLASH_ACCESS_KEY=9pb00duV4Gy78-dE_I14JeWKKhb14tlZcskUkYwKq00
UNSPLASH_SECRET_KEY=s_cmxYnWu-HsIaTajgklSo2icPbMHjFj06ta7z92nac
UNSPLASH_APPLICATION_ID=812491

# Node.js Backend URL
NODE_BACKEND_URL=http://localhost:5000

# Bot Configuration
BOT_ENABLED=True
BOT_INTERVAL_MINUTES=30
BOT_POSTS_PER_RUN=3
```

### 3. Run Development Server

```bash
python main.py
```

Server sẽ chạy tại: `http://localhost:8001`

## 📚 API Endpoints

### Health Check
- `GET /` - Basic health check
- `GET /health` - Detailed health status

### Bot Management
- `GET /api/bot/status` - Get bot status
- `POST /api/bot/start` - Start automated bot
- `POST /api/bot/stop` - Stop automated bot
- `POST /api/bot/create-post` - Create single post manually
- `POST /api/bot/run-now` - Trigger immediate bot run
- `GET /api/bot/users` - Get bot user profiles

### Unsplash Integration
- `GET /api/unsplash/random` - Get random photos
- `GET /api/unsplash/search` - Search photos
- `GET /api/unsplash/topics` - Get trending topics
- `POST /api/unsplash/download/{photo_id}` - Track photo download
- `GET /api/unsplash/stats` - Service statistics

## 🤖 Bot Service

### Automated Content Generation

Bot service tự động:
1. **Fetch trending topics** từ predefined list
2. **Get random photos** từ Unsplash theo topic
3. **Generate captions** với hashtags phù hợp
4. **Send posts** tới Node.js backend để lưu vào database

### Bot Users

3 bot users với personalities khác nhau:
- **AI Creator**: Curating beautiful content
- **Visual Explorer**: Discovering photography and art  
- **Inspiration Hub**: Daily creativity and inspiration

### Configuration

```python
BOT_ENABLED=True           # Enable/disable bot
BOT_INTERVAL_MINUTES=30    # Posting interval
BOT_POSTS_PER_RUN=3       # Posts per execution
```

## 🔧 Integration với Node.js Backend

Python backend gửi posts tới Node.js qua API endpoint:

```
POST /api/bot/create-post
{
  "content": "Generated caption with hashtags",
  "images": ["https://images.unsplash.com/..."],
  "bot_metadata": {
    "bot_user": {...},
    "photo_data": {...},
    "topic": "nature",
    "created_by": "python_bot"
  }
}
```

## 🌟 Usage Examples

### Manual Post Creation

```bash
# Create single post
curl -X POST "http://localhost:8001/api/bot/create-post" \
  -H "Content-Type: application/json" \
  -d '{"topic": "nature", "count": 1}'

# Get random photos
curl "http://localhost:8001/api/unsplash/random?count=5&query=technology"

# Search photos
curl "http://localhost:8001/api/unsplash/search?query=sunset&per_page=10"
```

### Bot Management

```bash
# Start bot
curl -X POST "http://localhost:8001/api/bot/start"

# Check status
curl "http://localhost:8001/api/bot/status"

# Trigger immediate run
curl -X POST "http://localhost:8001/api/bot/run-now"
```

## 🚀 Production Deployment

### Docker Support (Coming Soon)

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["python", "main.py"]
```

### Environment Variables

Production environment cần:
- `DEBUG=False`
- `NODE_BACKEND_URL` pointing to production Node.js
- Proper CORS configuration
- Rate limiting configuration

## 🔮 Future Enhancements

- **AI Content Generation**: GPT integration cho captions
- **Image Processing**: Resize, filters, watermarks
- **Analytics**: Bot performance tracking
- **User Preferences**: Personalized content generation
- **Multi-platform**: Instagram, Twitter integration
- **Content Moderation**: AI-powered content filtering

## 📝 Development Notes

### Adding New Bot Features

1. Extend `BotService` class trong `services/bot_service.py`
2. Add new endpoints trong `routers/bot_router.py`
3. Update configuration trong `config.py`
4. Test với manual API calls

### Unsplash API Guidelines

- Always credit photographers
- Track downloads với `/download` endpoint
- Respect rate limits
- Use appropriate image sizes

## 🤝 Contributing

1. Follow Python PEP 8 style guide
2. Add type hints cho all functions
3. Include docstrings cho public methods
4. Test endpoints với FastAPI docs (`/docs`)

## 📄 License

Part of HooksDream social media platform.
