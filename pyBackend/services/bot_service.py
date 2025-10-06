"""
Bot Service - Marcin Art Bot Automated Posting
Handles automated content creation for Marcin Frames Art Bot
"""

import asyncio
import aiohttp
import logging
import random
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import os

from .premium_bot_accounts import get_premium_bot_accounts
from .marcin_art_service import MarcinArtService
from .schedule_tracker_service import can_post_now, mark_post_created, get_schedule_stats, is_posting_time, get_vietnam_time

logger = logging.getLogger(__name__)

class BotService:
    def __init__(self, image_service=None):
        self.image_service = image_service
        self.node_backend_url = os.getenv('NODE_BACKEND_URL', 'http://localhost:5000')
        self.is_running = False
        self.scheduler_task = None
        self.marcin_service = MarcinArtService()
        
        # Get Marcin bot configuration
        bot_accounts = get_premium_bot_accounts()
        self.marcin_bot = bot_accounts[0] if bot_accounts else None
        
        if not self.marcin_bot:
            logger.warning("⚠️ No Marcin bot configuration found")
    
    async def start_scheduler(self):
        """Start the automated posting scheduler"""
        if self.is_running:
            logger.warning("⚠️ Bot scheduler is already running")
            return
        
        self.is_running = True
        logger.info("🚀 Starting Marcin Art Bot scheduler...")
        
        # Start the scheduler task
        self.scheduler_task = asyncio.create_task(self._scheduler_loop())
        
    async def stop_scheduler(self):
        """Stop the automated posting scheduler"""
        if not self.is_running:
            return
        
        self.is_running = False
        logger.info("🛑 Stopping Marcin Art Bot scheduler...")
        
        if self.scheduler_task:
            self.scheduler_task.cancel()
            try:
                await self.scheduler_task
            except asyncio.CancelledError:
                pass
    
    async def _scheduler_loop(self):
        """Main scheduler loop for automated posting with persistent tracking"""
        try:
            while self.is_running:
                try:
                    # Check if it's time to post using Vietnam timezone and persistent tracking
                    if can_post_now("marcin_frames_art"):
                        vietnam_time = get_vietnam_time()
                        logger.info(f"⏰ Time to create Marcin art post at {vietnam_time.strftime('%H:%M')} Vietnam time...")
                        
                        result = await self._create_art_post()
                        if result and result.get("success"):
                            # Mark post as created in persistent tracker
                            mark_post_created("marcin_frames_art")
                            logger.info("✅ Post created and tracked successfully")
                    
                    # Check every 5 minutes for more responsive scheduling
                    await asyncio.sleep(300)  # 5 minutes
                    
                except Exception as e:
                    logger.error(f"❌ Error in scheduler loop: {str(e)}")
                    await asyncio.sleep(300)  # Wait 5 minutes on error
                    
        except asyncio.CancelledError:
            logger.info("📋 Scheduler loop cancelled")
        except Exception as e:
            logger.error(f"❌ Fatal error in scheduler loop: {str(e)}")
    
    async def _should_post_now(self) -> bool:
        """DEPRECATED: Use schedule_tracker_service.can_post_now() instead"""
        # This method is now replaced by persistent schedule tracking
        return can_post_now("marcin_frames_art")
    
    # Removed _can_post_now method - replaced by persistent schedule tracking
    
    async def _create_art_post(self):
        """Create and post an artistic post using Marcin's photos"""
        try:
            if not self.marcin_bot:
                logger.error("❌ No Marcin bot configuration available")
                return
            
            logger.info("🎨 Creating Marcin art post...")
            
            # Get a random artistic photo from Marcin's collection
            async with self.marcin_service as service:
                # Randomly choose between different selection methods
                selection_methods = [
                    ("random", lambda: service.get_random_marcin_photo("marcin_frames_art")),
                    ("portrait", lambda: service.get_marcin_photo_by_theme("portrait")),
                    ("artistic", lambda: service.get_marcin_photo_by_theme("artistic")),
                    ("dramatic", lambda: service.get_marcin_photo_by_theme("dramatic")),
                    ("fashion", lambda: service.get_marcin_photo_by_theme("fashion"))
                ]
                
                method_name, method_func = random.choice(selection_methods)
                logger.info(f"🎲 Using selection method: {method_name}")
                
                if method_name == "random":
                    result = await method_func()
                    if result["success"]:
                        photo = result["photo"]
                        caption = service.generate_artistic_caption(photo)
                    else:
                        logger.error(f"❌ Failed to get random photo: {result['error']}")
                        return
                else:
                    result = await method_func()
                    if result["success"] and result["photos"]:
                        photo = random.choice(result["photos"])
                        caption = service.generate_artistic_caption(photo)
                    else:
                        logger.error(f"❌ Failed to get {method_name} photos: {result.get('error', 'No photos found')}")
                        return
            
            # Prepare post data for Node.js backend
            post_data = {
                "content": caption,
                "images": [photo["urls"]["regular"]],  # Use regular size for posts
                "bot_metadata": {
                    "bot_user": {
                        "username": self.marcin_bot["username"],
                        "name": self.marcin_bot["displayName"],
                        "bio": self.marcin_bot["bio"],
                        "botType": self.marcin_bot["botType"]
                    },
                    "topic": method_name,
                    "photo_data": {
                        "id": photo["id"],
                        "description": photo["description"],
                        "photographer": photo["photographer"]["name"],
                        "likes": photo["likes"],
                        "tags": photo["tags"],
                        "unsplash_url": photo["html_url"]
                    }
                },
                "post_type": "artistic_photo",
                "mood": self._determine_mood_from_photo(photo),
                "time_context": {
                    "posting_time": datetime.now().isoformat(),
                    "scheduled": True,
                    "selection_method": method_name
                }
            }
            
            # Send to Node.js backend
            success = await self._send_post_to_backend(post_data)
            
            if success:
                logger.info(f"✅ Successfully created Marcin art post using {method_name} method")
                logger.info(f"📸 Photo: {photo['id']} by {photo['photographer']['name']}")
                logger.info(f"❤️ Likes: {photo['likes']}")
            else:
                logger.error("❌ Failed to create Marcin art post")
                
        except Exception as e:
            logger.error(f"❌ Error creating art post: {str(e)}")
    
    def _determine_mood_from_photo(self, photo: Dict) -> str:
        """Determine mood from photo metadata"""
        description = (photo.get("description", "") or "").lower()
        tags = [tag.lower() for tag in photo.get("tags", [])]
        all_text = f"{description} {' '.join(tags)}"
        
        # Mood keywords
        if any(word in all_text for word in ["dark", "shadow", "dramatic", "moody", "black"]):
            return "dramatic"
        elif any(word in all_text for word in ["fashion", "style", "elegant", "chic"]):
            return "sophisticated"
        elif any(word in all_text for word in ["portrait", "face", "person", "model"]):
            return "intimate"
        elif any(word in all_text for word in ["art", "creative", "artistic", "abstract"]):
            return "creative"
        else:
            return "artistic"
    
    async def _send_post_to_backend(self, post_data: Dict) -> bool:
        """Send post data to Node.js backend"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.node_backend_url}/api/bot/create-post",
                    json=post_data,
                    headers={'Content-Type': 'application/json'},
                    timeout=aiohttp.ClientTimeout(total=30)
                ) as response:
                    
                    if response.status == 201:
                        result = await response.json()
                        logger.info(f"✅ Post created successfully: {result.get('message', 'Success')}")
                        return True
                    else:
                        error_text = await response.text()
                        logger.error(f"❌ Backend error {response.status}: {error_text}")
                        return False
                        
        except asyncio.TimeoutError:
            logger.error("⏰ Timeout sending post to backend")
            return False
        except Exception as e:
            logger.error(f"❌ Error sending post to backend: {str(e)}")
            return False
    
    async def create_manual_post(self, theme: str = "random") -> Dict:
        """Manually create a post for testing"""
        try:
            logger.info(f"🎨 Creating manual Marcin art post with theme: {theme}")
            
            if not self.marcin_bot:
                return {
                    "success": False,
                    "error": "No Marcin bot configuration available"
                }
            
            # Get photo based on theme
            async with self.marcin_service as service:
                if theme == "random":
                    result = await service.get_random_marcin_photo("marcin_frames_art")
                    if result["success"]:
                        photo = result["photo"]
                    else:
                        return {
                            "success": False,
                            "error": f"Failed to get random photo: {result['error']}"
                        }
                else:
                    result = await service.get_marcin_photo_by_theme(theme)
                    if result["success"] and result["photos"]:
                        photo = random.choice(result["photos"])
                    else:
                        return {
                            "success": False,
                            "error": f"Failed to get {theme} photos: {result.get('error', 'No photos found')}"
                        }
                
                caption = service.generate_artistic_caption(photo)
            
            # Create post data
            post_data = {
                "content": caption,
                "images": [photo["urls"]["regular"]],
                "bot_metadata": {
                    "bot_user": {
                        "username": self.marcin_bot["username"],
                        "name": self.marcin_bot["displayName"],
                        "bio": self.marcin_bot["bio"],
                        "botType": self.marcin_bot["botType"]
                    },
                    "topic": theme,
                    "photo_data": {
                        "id": photo["id"],
                        "description": photo["description"],
                        "photographer": photo["photographer"]["name"],
                        "likes": photo["likes"],
                        "tags": photo["tags"],
                        "unsplash_url": photo["html_url"]
                    }
                },
                "post_type": "artistic_photo",
                "mood": self._determine_mood_from_photo(photo),
                "time_context": {
                    "posting_time": datetime.now().isoformat(),
                    "manual": True,
                    "theme": theme
                }
            }
            
            # Send to backend
            success = await self._send_post_to_backend(post_data)
            
            if success:
                return {
                    "success": True,
                    "message": f"Successfully created manual art post with theme: {theme}",
                    "photo_id": photo["id"],
                    "photographer": photo["photographer"]["name"],
                    "likes": photo["likes"]
                }
            else:
                return {
                    "success": False,
                    "error": "Failed to send post to backend"
                }
                
        except Exception as e:
            logger.error(f"❌ Error creating manual post: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }

# For backward compatibility
async def create_bot_post():
    """Create a manual bot post"""
    service = BotService()
    return await service.create_manual_post()
