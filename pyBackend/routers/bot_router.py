"""
Bot API Router
Endpoints for managing automated content generation
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional
from services.bot_service import BotService
from services.premium_bot_accounts import get_premium_bot_accounts
from config import settings

# Global service references (will be set by main.py)
bot_service = None

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
    global bot_service
    
    if not bot_service:
        raise HTTPException(status_code=503, detail="Bot service not initialized")
    
    return BotStatusResponse(
        is_running=bot_service.is_running,
        interval_minutes=settings.BOT_INTERVAL_MINUTES,
        posts_per_run=settings.BOT_POSTS_PER_RUN
    )

@router.post("/start")
async def start_bot():
    """Start the automated bot scheduler"""
    global bot_service
    
    if not bot_service:
        raise HTTPException(status_code=503, detail="Bot service not initialized")
    
    if bot_service.is_running:
        return {"message": "Bot is already running", "status": "running"}
    
    await bot_service.start_scheduler()
    return {"message": "Bot scheduler started successfully", "status": "started"}

@router.post("/stop")
async def stop_bot():
    """Stop the automated bot scheduler"""
    global bot_service
    
    if not bot_service:
        raise HTTPException(status_code=503, detail="Bot service not initialized")
    
    if not bot_service.is_running:
        return {"message": "Bot is not running", "status": "stopped"}
    
    await bot_service.stop_scheduler()
    return {"message": "Bot scheduler stopped successfully", "status": "stopped"}

@router.post("/create-post")
async def create_single_post(theme: str = "random"):
    """Create a single Marcin art post manually"""
    global bot_service
    
    if not bot_service:
        raise HTTPException(status_code=503, detail="Bot service not initialized")
    
    try:
        result = await bot_service.create_manual_post(theme)
        
        if result["success"]:
            return {
                "message": result["message"],
                "photo_id": result.get("photo_id"),
                "photographer": result.get("photographer"),
                "likes": result.get("likes"),
                "theme": theme
            }
        else:
            raise HTTPException(status_code=400, detail=result["error"])
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating post: {str(e)}")

# Removed run-now endpoint to prevent spam and maintain scheduled posting only

@router.get("/stats")
async def get_bot_stats():
    """Get Marcin art bot statistics"""
    global bot_service
    
    if not bot_service:
        raise HTTPException(status_code=503, detail="Bot service not initialized")
    
    try:
        # Get Marcin bot info
        bot_accounts = get_premium_bot_accounts()
        marcin_bot = bot_accounts[0] if bot_accounts else None
        
        if not marcin_bot:
            return {"error": "No Marcin bot configuration found"}
        
        return {
            "bot_info": {
                "username": marcin_bot["username"],
                "displayName": marcin_bot["displayName"],
                "botType": marcin_bot["botType"],
                "unsplash_source": marcin_bot["unsplash_source"],
                "total_source_photos": marcin_bot["total_source_photos"]
            },
            "scheduler_status": {
                "is_running": bot_service.is_running,
                "posting_times": ["09:00", "15:00", "19:00"],
                "timezone": "Asia/Ho_Chi_Minh"
            },
            "content_strategy": {
                "themes": marcin_bot["content_themes"],
                "content_mix": marcin_bot.get("posting_schedule", {}).get("content_mix", {}),
                "engagement_style": marcin_bot["engagement_style"]
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting stats: {str(e)}")

@router.get("/users")
async def get_bot_users():
    """Get Marcin art bot user info"""
    try:
        bot_accounts = get_premium_bot_accounts()
        
        if not bot_accounts:
            return {
                "bot_users": [],
                "total": 0,
                "message": "No bot accounts configured"
            }
        
        marcin_bot = bot_accounts[0]
        
        return {
            "bot_users": [
                {
                    "username": marcin_bot["username"],
                    "displayName": marcin_bot["displayName"],
                    "botType": marcin_bot["botType"],
                    "bio": marcin_bot["bio"],
                    "location": marcin_bot["location"],
                    "website": marcin_bot["website"],
                    "cloudinary_folder": marcin_bot["cloudinary_folder"],
                    "unsplash_source": marcin_bot["unsplash_source"],
                    "specialBadge": marcin_bot["specialBadge"]
                }
            ],
            "total": 1,
            "type": "art_bot"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting bot users: {str(e)}")

@router.post("/smart-avatar")
async def get_smart_avatar(request: dict):
    """Get smart realistic avatar for bot"""
    try:
        bot_account = request.get('bot_account', {})
        
        if not bot_account:
            raise HTTPException(status_code=400, detail="bot_account is required")
        
        # Initialize smart avatar service if needed
        global hybrid_image_service
        if smart_avatar_service.image_service is None:
            smart_avatar_service.image_service = hybrid_image_service
        
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
        global hybrid_image_service, unsplash_service
        if not hybrid_image_service:
            raise HTTPException(status_code=503, detail="Hybrid image service not initialized")
        
        stats = hybrid_image_service.get_service_stats()
        
        return {
            "success": True,
            "hybrid_stats": stats,
            "services": {
                "unsplash": {
                    "consecutive_errors": unsplash_service.consecutive_errors if unsplash_service else 0
                },
                "pexels": {
                    "consecutive_errors": 0  # Pexels service doesn't track errors yet
                }
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting hybrid stats: {str(e)}")

@router.post("/reset-rate-limits")
async def reset_service_rate_limits():
    """Reset rate limits for all image services"""
    try:
        global hybrid_image_service
        if hybrid_image_service:
            hybrid_image_service.reset_rate_limits()
        
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

@router.get("/marcin-photos")
async def get_marcin_photos(per_page: int = 10, page: int = 1):
    """Get photos from Marcin Sajur's Unsplash account"""
    try:
        from services.marcin_art_service import get_marcin_photos
        
        result = await get_marcin_photos(per_page, page)
        
        if result["success"]:
            return {
                "success": True,
                "photos": result["photos"],
                "total_photos": result["total_photos"],
                "photographer": result["photographer"],
                "page": page,
                "per_page": per_page
            }
        else:
            raise HTTPException(status_code=400, detail=result["error"])
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching Marcin photos: {str(e)}")

@router.get("/marcin-random")
async def get_random_marcin_photo():
    """Get a random photo from Marcin's collection"""
    try:
        from services.marcin_art_service import get_random_marcin_photo
        
        result = await get_random_marcin_photo()
        
        if result["success"]:
            return {
                "success": True,
                "photo": result["photo"],
                "selection_method": result["selection_method"]
            }
        else:
            raise HTTPException(status_code=400, detail=result["error"])
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting random photo: {str(e)}")

@router.get("/marcin-theme/{theme}")
async def get_marcin_photos_by_theme(theme: str):
    """Get photos from Marcin's collection by theme"""
    try:
        from services.marcin_art_service import get_marcin_photo_by_theme
        
        result = await get_marcin_photo_by_theme(theme)
        
        if result["success"]:
            return {
                "success": True,
                "photos": result["photos"],
                "theme": result["theme"],
                "total_found": result["total_found"],
                "selection_method": result["selection_method"]
            }
        else:
            raise HTTPException(status_code=400, detail=result["error"])
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting themed photos: {str(e)}")

@router.get("/art-accounts")
async def get_art_bot_accounts_info():
    """Get information about art bot accounts"""
    try:
        accounts = get_premium_bot_accounts()
        
        return {
            "success": True,
            "accounts": [
                {
                    "username": bot["username"],
                    "displayName": bot["displayName"],
                    "botType": bot["botType"],
                    "bio": bot["bio"],
                    "location": bot["location"],
                    "website": bot["website"],
                    "unsplash_source": bot["unsplash_source"],
                    "total_source_photos": bot["total_source_photos"],
                    "content_themes": bot["content_themes"],
                    "specialties": bot["specialties"],
                    "cloudinary_folder": bot["cloudinary_folder"]
                }
                for bot in accounts
            ],
            "total": len(accounts)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting art bot accounts: {str(e)}")

@router.get("/photo-stats")
async def get_photo_usage_stats():
    """Get photo usage statistics to prevent duplicates"""
    try:
        from services.photo_tracker_service import get_photo_stats
        
        bot_username = "marcin_frames_art"
        stats = get_photo_stats(bot_username)
        
        return {
            "success": True,
            "bot_username": bot_username,
            "photo_usage": stats,
            "duplicate_prevention": "active"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting photo stats: {str(e)}")

@router.get("/schedule-stats")
async def get_schedule_stats():
    """Get schedule tracking statistics"""
    try:
        from services.schedule_tracker_service import get_schedule_stats
        
        bot_username = "marcin_frames_art"
        stats = get_schedule_stats(bot_username)
        
        return {
            "success": True,
            "bot_username": bot_username,
            "schedule_tracking": stats,
            "persistent_scheduling": "active"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting schedule stats: {str(e)}")

@router.post("/reset-photo-history")
async def reset_photo_usage_history():
    """Reset photo usage history (for testing or when all photos exhausted)"""
    try:
        from services.photo_tracker_service import reset_used_photos
        
        bot_username = "marcin_frames_art"
        reset_used_photos(bot_username)
        
        return {
            "success": True,
            "message": f"Photo usage history reset for {bot_username}",
            "bot_username": bot_username
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error resetting photo history: {str(e)}")

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
