"""
HooksDream Python Backend
FastAPI server for social media automation and AI features
"""

import os
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from services.unsplash_service import UnsplashService
from services.bot_service import BotService
from routers import bot_router, unsplash_router
from config import settings

# Load environment variables
load_dotenv()

# Global services
unsplash_service = None
bot_service = None

@asynccontextmanager
async def Lifecycle(app: FastAPI):
    """Application Lifecycle management"""
    global unsplash_service, bot_service
    
    # Startup
    print("Starting HooksDream Python Backend...")
    print(f"Environment: {settings.ENVIRONMENT}")
    print(f"Server will run on {get_host()}:{get_port()}")
    print(f"Backend URL: {settings.NODE_BACKEND_URL}")
    print(f"Bot enabled: {settings.BOT_ENABLED}")
    
    # Initialize services
    unsplash_service = UnsplashService()
    bot_service = BotService(unsplash_service)
    
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
    lifespan=lifespan
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
    return {
        "message": "HooksDream Python Backend",
        "status": "running",
        "version": "1.0.0",
        "bot_enabled": settings.BOT_ENABLED
    }

@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "services": {
            "unsplash": unsplash_service is not None,
            "bot": bot_service is not None and settings.BOT_ENABLED
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
