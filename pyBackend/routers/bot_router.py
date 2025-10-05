"""
Bot API Router
Endpoints for managing automated content generation
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Dict, Optional
import main

router = APIRouter()

class CreatePostRequest(BaseModel):
    topic: Optional[str] = None
    count: int = 1

class BotStatusResponse(BaseModel):
    is_running: bool
    interval_minutes: int
    posts_per_run: int
    next_run_in_seconds: Optional[int] = None

@router.get("/status", response_model=BotStatusResponse)
async def get_bot_status():
    """Get current bot status and configuration"""
    bot_service = main.bot_service
    
    if not bot_service:
        raise HTTPException(status_code=503, detail="Bot service not initialized")
    
    return BotStatusResponse(
        is_running=bot_service.is_running,
        interval_minutes=main.settings.BOT_INTERVAL_MINUTES,
        posts_per_run=main.settings.BOT_POSTS_PER_RUN
    )

@router.post("/start")
async def start_bot():
    """Start the automated bot scheduler"""
    bot_service = main.bot_service
    
    if not bot_service:
        raise HTTPException(status_code=503, detail="Bot service not initialized")
    
    if bot_service.is_running:
        return {"message": "Bot is already running", "status": "running"}
    
    await bot_service.start_scheduler()
    return {"message": "Bot scheduler started successfully", "status": "started"}

@router.post("/stop")
async def stop_bot():
    """Stop the automated bot scheduler"""
    bot_service = main.bot_service
    
    if not bot_service:
        raise HTTPException(status_code=503, detail="Bot service not initialized")
    
    if not bot_service.is_running:
        return {"message": "Bot is not running", "status": "stopped"}
    
    await bot_service.stop_scheduler()
    return {"message": "Bot scheduler stopped successfully", "status": "stopped"}

@router.post("/create-post")
async def create_single_post(request: CreatePostRequest):
    """Create a single post manually"""
    bot_service = main.bot_service
    
    if not bot_service:
        raise HTTPException(status_code=503, detail="Bot service not initialized")
    
    try:
        if request.count == 1:
            result = await bot_service.create_single_post(request.topic)
            if not result:
                raise HTTPException(status_code=400, detail="Failed to create post")
            return {"message": "Post created successfully", "post": result}
        else:
            # Create multiple posts
            results = []
            for _ in range(min(request.count, 10)):  # Limit to 10 posts max
                result = await bot_service.create_single_post(request.topic)
                if result:
                    results.append(result)
            
            return {
                "message": f"Created {len(results)} posts successfully",
                "posts": results,
                "requested": request.count,
                "created": len(results)
            }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating post: {str(e)}")

@router.post("/run-now")
async def run_bot_now(background_tasks: BackgroundTasks):
    """Trigger bot to create posts immediately (background task)"""
    bot_service = main.bot_service
    
    if not bot_service:
        raise HTTPException(status_code=503, detail="Bot service not initialized")
    
    # Run in background to avoid timeout
    background_tasks.add_task(bot_service.create_automated_posts)
    
    return {
        "message": "Bot execution triggered",
        "status": "running_in_background",
        "posts_to_create": main.settings.BOT_POSTS_PER_RUN
    }

@router.get("/stats")
async def get_bot_stats():
    """Get bot statistics and analytics"""
    bot_service = main.bot_service
    
    if not bot_service:
        raise HTTPException(status_code=503, detail="Bot service not initialized")
    
    try:
        # Get stats from AI bot manager
        stats = bot_service.bot_manager.get_stats()
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting stats: {str(e)}")

@router.get("/users")
async def get_bot_users():
    """Get list of available bot users"""
    bot_service = main.bot_service
    
    if not bot_service:
        raise HTTPException(status_code=503, detail="Bot service not initialized")
    
    try:
        # Get active bots from AI bot manager
        active_bots = bot_service.bot_manager.get_active_bots()
        return {
            "active_bots": [bot_service.bot_manager.get_bot_for_api(bot) for bot in active_bots],
            "total_active": len(active_bots),
            "total_bots": len(bot_service.bot_manager.bot_profiles)
        }
    except Exception as e:
        return {
            "bot_users": getattr(bot_service, 'bot_users', []),
            "total": len(getattr(bot_service, 'bot_users', []))
        }
