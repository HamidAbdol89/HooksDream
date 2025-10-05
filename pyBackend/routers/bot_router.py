"""
Bot API Router
Endpoints for managing automated content generation
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional
from services.bot_service import BotService
from services.unsplash_service import UnsplashService
from services.smart_avatar_service import smart_avatar_service
from services.islamic_bot_manager import islamic_bot_manager
from services.bot_accounts import get_islamic_bot_accounts
import main

router = APIRouter()

class CreatePostRequest(BaseModel):
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

@router.post("/smart-avatar")
async def get_smart_avatar(request: dict):
    """Get smart realistic avatar for bot"""
    try:
        bot_account = request.get('bot_account', {})
        
        if not bot_account:
            raise HTTPException(status_code=400, detail="bot_account is required")
        
        # Initialize smart avatar service if needed
        if smart_avatar_service.image_service is None:
            smart_avatar_service.image_service = main.hybrid_image_service
        
        # Get smart avatar
        avatar_url = await smart_avatar_service.get_smart_avatar_for_bot(bot_account)
        
        if avatar_url:
            return {
                "success": True,
                "avatar_url": avatar_url,
                "query": smart_avatar_service._generate_targeted_query(
                    bot_account.get('botType', 'lifestyle'),
                    bot_account.get('displayName', 'Bot'),
                    bot_account.get('bio', '')
                )
            }
        else:
            raise HTTPException(status_code=404, detail="Could not generate smart avatar")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating smart avatar: {str(e)}")

@router.get("/avatar-stats")
async def get_avatar_stats():
    """Get avatar usage statistics"""
    try:
        stats = smart_avatar_service.get_avatar_stats()
        return {
            "success": True,
            "stats": stats
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting avatar stats: {str(e)}")

@router.get("/hybrid-stats")
async def get_hybrid_image_stats():
    """Get hybrid image service statistics"""
    try:
        hybrid_service = main.hybrid_image_service
        if not hybrid_service:
            raise HTTPException(status_code=503, detail="Hybrid image service not initialized")
        
        stats = hybrid_service.get_service_stats()
        
        return {
            "success": True,
            "hybrid_stats": stats,
            "services": {
                "unsplash": {
                    "consecutive_errors": main.unsplash_service.consecutive_errors if main.unsplash_service else 0
                },
                "pexels": {
                    "consecutive_errors": main.pexels_service.consecutive_errors if hasattr(main, 'pexels_service') else 0
                }
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting hybrid stats: {str(e)}")

@router.post("/reset-rate-limits")
async def reset_service_rate_limits():
    """Reset rate limits for all image services"""
    try:
        hybrid_service = main.hybrid_image_service
        if hybrid_service:
            hybrid_service.reset_rate_limits()
        
        return {
            "success": True,
            "message": "Rate limits reset for all image services"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error resetting rate limits: {str(e)}")

# Islamic Bot Management Endpoints

@router.post("/islamic/initialize")
async def initialize_islamic_bots():
    """Initialize all 5 Islamic bot accounts"""
    try:
        success = await islamic_bot_manager.initialize_islamic_bots()
        
        if success:
            return {
                "success": True,
                "message": "All 5 Islamic bot accounts initialized successfully",
                "bots": [bot['displayName'] for bot in get_islamic_bot_accounts()]
            }
        else:
            return {
                "success": False,
                "message": "Some Islamic bots failed to initialize",
                "bots": [bot['displayName'] for bot in get_islamic_bot_accounts()]
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error initializing Islamic bots: {str(e)}")

@router.post("/islamic/run-cycle")
async def run_islamic_bot_cycle(background_tasks: BackgroundTasks):
    """Run one cycle of Islamic bot posting"""
    try:
        # Run in background to avoid timeout
        background_tasks.add_task(islamic_bot_manager.run_islamic_bot_cycle)
        
        return {
            "success": True,
            "message": "Islamic bot cycle started in background",
            "bots": len(get_islamic_bot_accounts())
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error running Islamic bot cycle: {str(e)}")

@router.get("/islamic/accounts")
async def get_islamic_bot_accounts_info():
    """Get information about all Islamic bot accounts"""
    try:
        accounts = get_islamic_bot_accounts()
        
        return {
            "success": True,
            "accounts": [
                {
                    "username": bot["username"],
                    "displayName": bot["displayName"],
                    "botType": bot["botType"],
                    "bio": bot["bio"],
                    "specialties": bot["specialties"],
                    "content_focus": bot["content_focus"]
                }
                for bot in accounts
            ],
            "total": len(accounts)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting Islamic bot accounts: {str(e)}")

@router.get("/islamic/schedules")
async def get_islamic_bot_schedules():
    """Get posting schedules for all Islamic bots"""
    try:
        schedules = islamic_bot_manager.get_bot_schedules()
        
        return {
            "success": True,
            "schedules": schedules,
            "total_bots": len(schedules)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting Islamic bot schedules: {str(e)}")

@router.get("/islamic/stats")
async def get_islamic_bot_stats():
    """Get statistics for Islamic bots from Node.js backend"""
    try:
        stats = await islamic_bot_manager.get_islamic_bot_stats()
        
        return {
            "success": True,
            "islamic_stats": stats,
            "bot_count": len(get_islamic_bot_accounts())
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting Islamic bot stats: {str(e)}")
