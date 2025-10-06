"""
Premium Bot Service
Creates and manages high-quality bot accounts with realistic profiles
"""

import asyncio
import aiohttp
import logging
from datetime import datetime
from typing import Dict, List, Optional
from .premium_bot_accounts import get_premium_bot_accounts, get_bot_cloudinary_folder
import os

logger = logging.getLogger(__name__)

class PremiumBotService:
    def __init__(self):
        self.node_backend_url = os.getenv('NODE_BACKEND_URL', 'http://localhost:5000')
        self.session = None
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def create_premium_bot_user(self, bot_data: Dict) -> Dict:
        """Create a premium bot user via Node.js backend"""
        try:
            # Prepare bot user data for Node.js backend
            bot_user_payload = {
                "_id": bot_data["_id"],
                "googleId": f"premium_bot_{bot_data['username']}_{int(datetime.now().timestamp())}",
                "username": bot_data["username"],
                "displayName": bot_data["displayName"],
                "email": bot_data["email"],
                "bio": bot_data["bio"],
                "location": bot_data.get("location", ""),
                "website": bot_data.get("website", ""),
                "avatar": bot_data["avatar"],
                "coverImage": bot_data.get("coverImage", ""),
                "isBot": True,
                "botType": bot_data["botType"],
                "isVerified": False,
                "hasCustomAvatar": True,
                "hasCustomDisplayName": True,
                "isSetupComplete": True,
                "specialBadge": bot_data.get("specialBadge"),
                "followerCount": 0,
                "followingCount": 0,
                "postCount": 0
            }
            
            # Send to Node.js backend to create user
            async with self.session.post(
                f"{self.node_backend_url}/api/bot/create-user",
                json=bot_user_payload,
                headers={'Content-Type': 'application/json'},
                timeout=aiohttp.ClientTimeout(total=30)
            ) as response:
                
                if response.status == 201:
                    result = await response.json()
                    logger.info(f"✅ Premium bot user created: {bot_data['username']}")
                    return {
                        "success": True,
                        "bot_user": result.get("user"),
                        "message": f"Premium bot {bot_data['displayName']} created successfully"
                    }
                else:
                    error_text = await response.text()
                    logger.error(f"❌ Failed to create bot user {bot_data['username']}: {error_text}")
                    return {
                        "success": False,
                        "error": error_text,
                        "message": f"Failed to create bot user {bot_data['username']}"
                    }
                    
        except asyncio.TimeoutError:
            logger.error(f"⏰ Timeout creating bot user {bot_data['username']}")
            return {
                "success": False,
                "error": "Request timeout",
                "message": f"Timeout creating bot user {bot_data['username']}"
            }
        except Exception as e:
            logger.error(f"❌ Error creating bot user {bot_data['username']}: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "message": f"Error creating bot user {bot_data['username']}"
            }
    
    async def create_all_premium_bots(self) -> Dict:
        """Create all premium bot accounts"""
        results = []
        premium_bots = get_premium_bot_accounts()
        
        logger.info(f"🚀 Creating {len(premium_bots)} premium bot accounts...")
        
        for bot_data in premium_bots:
            result = await self.create_premium_bot_user(bot_data)
            results.append({
                "username": bot_data["username"],
                "displayName": bot_data["displayName"],
                "botType": bot_data["botType"],
                "cloudinary_folder": get_bot_cloudinary_folder(bot_data["username"]),
                **result
            })
            
            # Small delay between creations
            await asyncio.sleep(1)
        
        successful_bots = [r for r in results if r["success"]]
        failed_bots = [r for r in results if not r["success"]]
        
        summary = {
            "success": len(failed_bots) == 0,
            "total_bots": len(premium_bots),
            "successful": len(successful_bots),
            "failed": len(failed_bots),
            "results": results,
            "successful_bots": [r["username"] for r in successful_bots],
            "failed_bots": [r["username"] for r in failed_bots] if failed_bots else [],
            "cloudinary_folders": {
                r["username"]: r["cloudinary_folder"] for r in results
            }
        }
        
        if successful_bots:
            logger.info(f"✅ Successfully created {len(successful_bots)} premium bots")
        if failed_bots:
            logger.warning(f"❌ Failed to create {len(failed_bots)} premium bots")
            
        return summary
    
    async def update_bot_avatar_to_cloudinary(self, username: str, avatar_url: str) -> Dict:
        """Update bot avatar to use Cloudinary folder"""
        try:
            # Upload avatar to bot's dedicated Cloudinary folder
            cloudinary_folder = get_bot_cloudinary_folder(username)
            
            upload_payload = {
                "username": username,
                "avatar_url": avatar_url,
                "cloudinary_folder": cloudinary_folder
            }
            
            async with self.session.post(
                f"{self.node_backend_url}/api/bot/upload-avatar",
                json=upload_payload,
                headers={'Content-Type': 'application/json'},
                timeout=aiohttp.ClientTimeout(total=30)
            ) as response:
                
                if response.status == 200:
                    result = await response.json()
                    logger.info(f"✅ Bot avatar updated for {username}")
                    return {
                        "success": True,
                        "cloudinary_url": result.get("avatar_url"),
                        "folder": cloudinary_folder
                    }
                else:
                    error_text = await response.text()
                    logger.error(f"❌ Failed to update avatar for {username}: {error_text}")
                    return {
                        "success": False,
                        "error": error_text
                    }
                    
        except Exception as e:
            logger.error(f"❌ Error updating avatar for {username}: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def get_premium_bot_status(self) -> Dict:
        """Get status of all premium bots"""
        try:
            async with self.session.get(
                f"{self.node_backend_url}/api/bot/premium-status",
                timeout=aiohttp.ClientTimeout(total=15)
            ) as response:
                
                if response.status == 200:
                    return await response.json()
                else:
                    return {
                        "success": False,
                        "error": f"HTTP {response.status}"
                    }
                    
        except Exception as e:
            logger.error(f"❌ Error getting bot status: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }

# Standalone functions for easy import
async def create_premium_bots():
    """Create all premium bot accounts"""
    async with PremiumBotService() as service:
        return await service.create_all_premium_bots()

async def get_bot_status():
    """Get premium bot status"""
    async with PremiumBotService() as service:
        return await service.get_premium_bot_status()

async def update_bot_avatars():
    """Update all bot avatars to use Cloudinary folders"""
    async with PremiumBotService() as service:
        premium_bots = get_premium_bot_accounts()
        results = []
        
        for bot in premium_bots:
            result = await service.update_bot_avatar_to_cloudinary(
                bot["username"], 
                bot["avatar"]
            )
            results.append({
                "username": bot["username"],
                "folder": get_bot_cloudinary_folder(bot["username"]),
                **result
            })
            
        return {
            "success": True,
            "results": results
        }
