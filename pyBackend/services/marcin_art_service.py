"""
Marcin Art Service
Fetches and manages artistic photos from Marcin Sajur's Unsplash account
"""

import aiohttp
import random
import logging
from typing import Dict, List, Optional
from datetime import datetime
import os
from .photo_tracker_service import get_unused_photos, mark_photo_used, get_photo_stats, reset_used_photos

logger = logging.getLogger(__name__)
class MarcinArtService:
    def __init__(self):
        self.unsplash_access_key = os.getenv('UNSPLASH_ACCESS_KEY')
        self.base_url = "https://api.unsplash.com"
        self.marcin_username = "m_sajur"
        self.session = None
        
        if not self.unsplash_access_key:
            logger.warning("⚠️ UNSPLASH_ACCESS_KEY not found in environment variables")
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def get_marcin_photos(self, per_page: int = 30, page: int = 1) -> Dict:
        """Get photos from Marcin Sajur's Unsplash account"""
        try:
            if not self.unsplash_access_key:
                return {
                    "success": False,
                    "error": "Unsplash API key not configured",
                    "photos": []
                }
            
            url = f"{self.base_url}/users/{self.marcin_username}/photos"
            params = {
                "per_page": min(per_page, 30),  # Max 30 per request
                "page": page,
                "order_by": "popular"  # Get most popular photos first
            }
            
            headers = {
                "Authorization": f"Client-ID {self.unsplash_access_key}",
                "Accept-Version": "v1"
            }
            
            async with self.session.get(url, params=params, headers=headers) as response:
                if response.status == 200:
                    photos = await response.json()
                    
                    processed_photos = []
                    for photo in photos:
                        processed_photo = {
                            "id": photo.get("id"),
                            "description": photo.get("description") or photo.get("alt_description", ""),
                            "urls": {
                                "raw": photo["urls"]["raw"],
                                "full": photo["urls"]["full"],
                                "regular": photo["urls"]["regular"],
                                "small": photo["urls"]["small"],
                                "thumb": photo["urls"]["thumb"]
                            },
                            "width": photo.get("width"),
                            "height": photo.get("height"),
                            "color": photo.get("color"),
                            "likes": photo.get("likes", 0),
                            "created_at": photo.get("created_at"),
                            "updated_at": photo.get("updated_at"),
                            "download_url": photo["links"]["download"],
                            "html_url": photo["links"]["html"],
                            "photographer": {
                                "name": photo["user"]["name"],
                                "username": photo["user"]["username"],
                                "profile_url": f"https://unsplash.com/@{photo['user']['username']}"
                            },
                            "tags": [tag["title"] for tag in photo.get("tags", [])[:5]],  # First 5 tags
                            "exif": photo.get("exif", {}),
                            "location": photo.get("location", {})
                        }
                        processed_photos.append(processed_photo)
                    
                    logger.info(f"✅ Fetched {len(processed_photos)} photos from @{self.marcin_username}")
                    
                    return {
                        "success": True,
                        "photos": processed_photos,
                        "total_photos": len(processed_photos),
                        "page": page,
                        "per_page": per_page,
                        "photographer": {
                            "name": "Marcin Sajur",
                            "username": self.marcin_username,
                            "profile_url": f"https://unsplash.com/@{self.marcin_username}",
                            "instagram": "https://instagram.com/frames_and_faces"
                        }
                    }
                else:
                    error_text = await response.text()
                    logger.error(f"❌ Unsplash API error {response.status}: {error_text}")
                    return {
                        "success": False,
                        "error": f"Unsplash API error: {response.status}",
                        "photos": []
                    }
                    
        except Exception as e:
            logger.error(f"❌ Error fetching Marcin's photos: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "photos": []
            }
    
    async def get_random_marcin_photo(self, bot_username: str = "marcin_frames_art") -> Dict:
        """Get a random unused photo from Marcin's collection"""
        try:
            # Get multiple pages to have more variety
            all_photos = []
            for page in range(1, 4):  # Get first 3 pages (90 photos total)
                result = await self.get_marcin_photos(per_page=30, page=page)
                if result["success"] and result["photos"]:
                    all_photos.extend(result["photos"])
                else:
                    break
            
            if not all_photos:
                return {
                    "success": False,
                    "error": "No photos available from Marcin's collection",
                    "photo": None
                }
            
            # Filter out used photos
            unused_photos = get_unused_photos(bot_username, all_photos)
            
            # If no unused photos, reset and use all photos again
            if not unused_photos:
                logger.info(f"🔄 All photos used for {bot_username}, resetting...")
                reset_used_photos(bot_username)
                unused_photos = all_photos
            
            # Select random photo from unused ones
            selected_photo = random.choice(unused_photos)
            
            # Mark as used
            mark_photo_used(bot_username, selected_photo["id"])
            
            # Get usage stats
            stats = get_photo_stats(bot_username)
            
            logger.info(f"🎲 Selected unused photo: {selected_photo['id']} (Used: {stats['used_count']}/{len(all_photos)})")
            
            return {
                "success": True,
                "photo": selected_photo,
                "selection_method": "random_unused",
                "usage_stats": stats,
                "total_available": len(all_photos)
            }
                
        except Exception as e:
            logger.error(f"❌ Error getting random photo: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "photo": None
            }
    
    async def get_best_marcin_photos(self, count: int = 10) -> Dict:
        """Get the most popular photos from Marcin's collection"""
        try:
            result = await self.get_marcin_photos(per_page=30, page=1)
            
            if result["success"] and result["photos"]:
                # Sort by likes (popularity)
                sorted_photos = sorted(
                    result["photos"], 
                    key=lambda x: x["likes"], 
                    reverse=True
                )
                
                best_photos = sorted_photos[:count]
                
                logger.info(f"⭐ Selected {len(best_photos)} best photos from @{self.marcin_username}")
                
                return {
                    "success": True,
                    "photos": best_photos,
                    "total_selected": len(best_photos),
                    "selection_method": "popularity",
                    "criteria": "most_liked"
                }
            else:
                return {
                    "success": False,
                    "error": "No photos available",
                    "photos": []
                }
                
        except Exception as e:
            logger.error(f"❌ Error getting best photos: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "photos": []
            }
    
    async def get_marcin_photo_by_theme(self, theme: str = "portrait") -> Dict:
        """Get photos from Marcin's collection filtered by theme"""
        try:
            result = await self.get_marcin_photos(per_page=30, page=1)
            
            if result["success"] and result["photos"]:
                # Filter by theme keywords
                theme_keywords = {
                    "portrait": ["portrait", "face", "person", "model", "fashion"],
                    "artistic": ["art", "creative", "artistic", "conceptual", "abstract"],
                    "dramatic": ["dramatic", "dark", "moody", "shadow", "contrast"],
                    "fashion": ["fashion", "style", "clothing", "outfit", "editorial"]
                }
                
                keywords = theme_keywords.get(theme.lower(), ["portrait"])
                
                # Filter photos by description and tags
                filtered_photos = []
                for photo in result["photos"]:
                    description = (photo["description"] or "").lower()
                    tags = [tag.lower() for tag in photo["tags"]]
                    
                    # Check if any keyword matches
                    if any(keyword in description or keyword in " ".join(tags) for keyword in keywords):
                        filtered_photos.append(photo)
                
                # If no themed photos found, return random selection
                if not filtered_photos:
                    filtered_photos = random.sample(
                        result["photos"], 
                        min(5, len(result["photos"]))
                    )
                
                logger.info(f"🎨 Found {len(filtered_photos)} photos matching theme '{theme}'")
                
                return {
                    "success": True,
                    "photos": filtered_photos,
                    "theme": theme,
                    "total_found": len(filtered_photos),
                    "selection_method": "theme_filtered"
                }
            else:
                return {
                    "success": False,
                    "error": "No photos available",
                    "photos": []
                }
                
        except Exception as e:
            logger.error(f"❌ Error getting themed photos: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "photos": []
            }
    
    def generate_artistic_caption(self, photo: Dict) -> str:
        """Generate artistic caption for Marcin's photo"""
        try:
            description = photo.get("description", "")
            tags = photo.get("tags", [])
            likes = photo.get("likes", 0)
            
            # Artistic caption templates
            templates = [
                f"Capturing the essence of human emotion through light and shadow. {description} ✨",
                f"Every frame tells a story of depth and beauty. {description} 🎭",
                f"Art is not what you see, but what you make others see. {description} 📸",
                f"In the dance between light and darkness, we find truth. {description} 🖤",
                f"Portrait photography is about capturing the soul behind the eyes. {description} 👁️",
                f"Creating visual poetry through the lens of creativity. {description} 🎨",
                f"Where fashion meets art, magic happens. {description} ✨",
                f"Every shadow has a story, every light reveals truth. {description} 💫"
            ]
            
            # Select random template
            caption = random.choice(templates)
            
            # Add relevant hashtags
            hashtags = [
                "#PortraitArt", "#CreativePhotography", "#ArtisticVision", 
                "#VisualStorytelling", "#FramesAndFaces", "#ArtPhotography",
                "#CreativePortrait", "#ArtisticExpression", "#PhotographyArt"
            ]
            
            # Add theme-specific hashtags based on tags
            if any("fashion" in tag.lower() for tag in tags):
                hashtags.extend(["#FashionPhotography", "#EditorialPortrait"])
            if any("portrait" in tag.lower() for tag in tags):
                hashtags.extend(["#PortraitPhotography", "#HumanEmotion"])
            if any("art" in tag.lower() for tag in tags):
                hashtags.extend(["#ConceptualArt", "#ArtisticPhotography"])
            
            # Add hashtags to caption
            selected_hashtags = random.sample(hashtags, min(8, len(hashtags)))
            caption += f"\n\n{' '.join(selected_hashtags)}"
            
            return caption
            
        except Exception as e:
            logger.error(f"❌ Error generating caption: {str(e)}")
            return "Artistic vision through the lens of creativity. 🎨📸 #PortraitArt #CreativePhotography"

# Standalone functions for easy import
async def get_marcin_photos(per_page: int = 30, page: int = 1):
    """Get photos from Marcin Sajur's account"""
    async with MarcinArtService() as service:
        return await service.get_marcin_photos(per_page, page)

async def get_random_marcin_photo():
    """Get random photo from Marcin's collection"""
    async with MarcinArtService() as service:
        return await service.get_random_marcin_photo()

async def get_best_marcin_photos(count: int = 10):
    """Get best photos from Marcin's collection"""
    async with MarcinArtService() as service:
        return await service.get_best_marcin_photos(count)

async def get_marcin_photo_by_theme(theme: str = "portrait"):
    """Get themed photos from Marcin's collection"""
    async with MarcinArtService() as service:
        return await service.get_marcin_photo_by_theme(theme)
