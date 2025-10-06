"""
Configuration settings for HooksDream Python Backend
"""

import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Environment
    ENVIRONMENT: str = "production"
    
    # Node.js backend URL
    NODE_BACKEND_URL: str = "https://just-solace-production.up.railway.app"
    
    # Unsplash API
    UNSPLASH_ACCESS_KEY: str = ""
    
    # Pexels API
    PEXELS_API_KEY: str = ""
    
    # Groq AI API (fast inference)
    GROQ_API_KEY: str = ""  # Get free API key from https://console.groq.com (100 req/day)
    AI_ENABLED: bool = True  # Always enabled with Groq + templatesives
    
    # Bot configuration
    BOT_ENABLED: bool = True
    BOT_INTERVAL_MINUTES: int = 60  # Reduced to every 1 hour (save Cloudinary)
    BOT_POSTS_PER_RUN: int = 5      # Moderate posting (5 bots per hour)
    
    # Cloudinary limits (Free tier protection)
    MAX_IMAGES_PER_DAY: int = 100   # Max 100 images per day (free tier = 25GB/month)
    MAX_IMAGES_PER_HOUR: int = 10   # Max 10 images per hour
    
    # Server configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8000  # Changed to match Fly.io expectation
    LOCAL_HOST: str = "0.0.0.0"
    LOCAL_PORT: int = 8001
    
    class Config:
        # Load different env files based on environment
        env_file = ".env"
        
    def __init__(self, **kwargs):
        # Check if we're in production and load appropriate env file
        env = os.getenv("ENVIRONMENT", "development")
        if env == "production" and os.path.exists(".env.production"):
            self.Config.env_file = ".env.production"
        super().__init__(**kwargs)

settings = Settings()

# Helper function to get the correct port
def get_port():
    """Get port based on environment"""
    if settings.ENVIRONMENT == "production":
        return int(os.getenv("PORT", settings.PORT))
    return settings.LOCAL_PORT

# Helper function to get the correct host
def get_host():
    """Get host based on environment"""
    if settings.ENVIRONMENT == "production":
        return "0.0.0.0"
    return settings.LOCAL_HOST
