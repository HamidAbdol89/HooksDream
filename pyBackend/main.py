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
from services.pexels_service import pexels_service
from services.hybrid_image_service import HybridImageService
from services.bot_service import BotService
from services.smart_avatar_service import smart_avatar_service
from routers import bot_router, unsplash_router
from config import settings, get_host, get_port

# Load environment variables
load_dotenv()

# Global services
unsplash_service = None
hybrid_image_service = None
bot_service = None

@asynccontextmanager
async def Lifecycle(app: FastAPI):
    """Application Lifecycle management"""
    global unsplash_service, hybrid_image_service, bot_service
    
    # Startup
    print("🚀 Starting HooksDream Python Backend...")
    print(f"📊 Environment: {settings.ENVIRONMENT}")
    print(f"🌐 Server will run on {get_host()}:{get_port()}")
    print(f"🔗 Backend URL: {settings.NODE_BACKEND_URL}")
    
    # Initialize services
    print("🔧 Initializing image services...")
    unsplash_service = UnsplashService()
    print("✅ Unsplash service initialized")
    print("✅ Pexels service initialized")
    
    # Initialize hybrid image service
    hybrid_image_service = HybridImageService(unsplash_service)
    print("🎯 Hybrid image service initialized (Unsplash + Pexels)")
    
    # Initialize bot service with hybrid images
    bot_service = BotService(hybrid_image_service)
    print("🤖 Bot service initialized")
    
    # Initialize smart avatar service with hybrid images
    smart_avatar_service.image_service = hybrid_image_service
    print("👤 Smart avatar service initialized")
    
    # Start bot if enabled
    if settings.BOT_ENABLED:
        print("Starting automated bot service...")
        asyncio.create_task(bot_service.start_scheduler())
    
    print("Python Backend ready!")
    
    yield
    
    # Shutdown
    print("🛑 Shutting down Python Backend...")
    if bot_service:
        await bot_service.stop_scheduler()

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
app.include_router(bot_router.router, prefix="/api/bot", tags=["Bot"])
app.include_router(unsplash_router.router, prefix="/api/unsplash", tags=["Unsplash"])

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "HooksDream Python Backend is running!", "status": "healthy"}

@app.get("/health")
async def health_check():
    """Health check endpoint to prevent Fly.io autostop"""
    global bot_service, hybrid_image_service
    
    bot_status = "running" if bot_service and bot_service.is_running else "stopped"
    
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "bot_service": bot_status,
        "hybrid_images": "available" if hybrid_image_service else "unavailable",
        "services": {
            "unsplash": "available" if unsplash_service else "unavailable",
            "pexels": "available",
            "bot_scheduler": bot_status
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=get_host(),
        port=get_port(),
        reload=settings.ENVIRONMENT == "development"
    )
