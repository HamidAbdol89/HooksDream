"""
HooksDream Python Backend
FastAPI server for social media automation and AI features
"""

import os
import asyncio
from datetime import datetime
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from services.unsplash_service import UnsplashService
from services.bot_service import BotService
from routers import bot_router
from config import settings, get_host, get_port

# Load environment variables
load_dotenv()

async def keep_alive_task():
    """Keep the service alive by making periodic requests to prevent Railway sleep"""
    import httpx
    
    while True:
        try:
            # Wait 8 minutes between keep-alive pings (Railway sleeps after 10 min)
            await asyncio.sleep(480)  # 8 minutes
            
            # Ping self to prevent sleep
            port = get_port()
            async with httpx.AsyncClient(timeout=5.0) as client:
                try:
                    response = await client.get(f"http://localhost:{port}/health")
                    if response.status_code == 200:
                        print("💓 Keep-alive ping successful")
                    else:
                        print(f"⚠️ Keep-alive ping returned {response.status_code}")
                except Exception as ping_error:
                    print(f"⚠️ Keep-alive ping failed: {ping_error}")
                    
        except Exception as e:
            print(f"❌ Keep-alive task error: {e}")
            await asyncio.sleep(60)  # Wait 1 minute on error

# Global services
unsplash_service = None
bot_service = None

@asynccontextmanager
async def Lifecycle(app: FastAPI):
    """Application Lifecycle management"""
    global unsplash_service, bot_service
    
    # Startup
    print("🚀 Starting HooksDream Python Backend...")
    print(f"📊 Environment: {settings.ENVIRONMENT}")
    print(f"🔗 Backend URL: {settings.NODE_BACKEND_URL}")
    
    # Initialize services
    print("🔧 Initializing services...")
    unsplash_service = UnsplashService()
    print("✅ Unsplash service initialized")
    
    # Initialize bot service for Marcin
    bot_service = BotService()
    print("🤖 Marcin bot service initialized")
    
    # Set global variables for routers
    import routers.bot_router as bot_router_module
    bot_router_module.bot_service = bot_service
    
    # Start bot services if enabled
    if settings.BOT_ENABLED:
        print("🚀 Starting Marcin bot scheduler...")
        asyncio.create_task(bot_service.start_scheduler())
        print("📝 Marcin bot scheduler started")
        
        # Start keep-alive task to prevent Railway sleep
        asyncio.create_task(keep_alive_task())
        print("💓 Keep-alive service started")
    
    print("Python Backend ready!")
    
    yield
    
    # Shutdown
    print("🛑 Shutting down Python Backend...")
    if bot_service:
        await bot_service.stop_scheduler()
    # Note: bot_interaction_service doesn't have stop_scheduler method

# Create FastAPI app
app = FastAPI(
    title="HooksDream Python Backend",
    description="AI-powered social media automation and tools",
    version="1.0.0",
    lifespan=Lifecycle
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(bot_router.router, prefix="/api/bot", tags=["Marcin Bot"])

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "HooksDream Python Backend is running!", "status": "healthy"}

@app.get("/health")
async def health_check():
    """Health check endpoint to prevent Railway sleep"""
    global bot_service, unsplash_service
    
    bot_status = "running" if bot_service and bot_service.is_running else "stopped"
    
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "marcin_bot": bot_status,
        "services": {
            "unsplash": "available" if unsplash_service else "unavailable",
            "bot_scheduler": bot_status,
            "schedule_tracker": "active",
            "photo_tracker": "active"
        }
    }

# For Vercel deployment
app.mount_path = ""

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=get_host(),
        port=get_port(),
        reload=settings.ENVIRONMENT == "development"
    )
