"""
Unsplash API Service
Handles fetching images from Unsplash API
"""

import httpx
import random
import asyncio
from typing import List, Dict, Optional
from config import settings

class UnsplashService:
    def __init__(self):
        self.access_key = settings.UNSPLASH_ACCESS_KEY
        self.base_url = "https://api.unsplash.com"
        self.headers = {
            "Authorization": f"Client-ID {self.access_key}",
            "Accept-Version": "v1"
        }
        self.rate_limit_reset_time = None
        self.consecutive_errors = 0
    
    async def _handle_rate_limit(self, response: httpx.Response) -> bool:
        """Handle rate limit response and implement backoff"""
        if response.status_code == 403:
            self.consecutive_errors += 1
            
            # Exponential backoff: 2^errors seconds, max 300 seconds (5 minutes)
            backoff_time = min(2 ** self.consecutive_errors, 300)
            
            print(f"🚨 Unsplash API rate limited. Backing off for {backoff_time} seconds...")
            await asyncio.sleep(backoff_time)
            return True
        elif response.status_code == 200:
            self.consecutive_errors = 0  # Reset on success
            return False
        
        return False
    
    async def get_random_photos(self, count: int = 1, query: Optional[str] = None) -> List[Dict]:
        """
        Fetch random photos from Unsplash
        
        Args:
            count: Number of photos to fetch (max 30)
            query: Search query for specific topics
            
        Returns:
            List of photo data dictionaries
        """
        try:
            async with httpx.AsyncClient() as client:
                params = {
                    "count": min(count, 30),  # Unsplash limit
                }
                
                if query:
                    params["query"] = query
                
                response = await client.get(
                    f"{self.base_url}/photos/random",
                    headers=self.headers,
                    params=params,
                    timeout=30.0
                )
                
                response.raise_for_status()
                data = response.json()
                
                # Ensure we always return a list
                if isinstance(data, dict):
                    data = [data]
                
                return [self._format_photo_data(photo) for photo in data]
                
        except Exception as e:
            print(f"❌ Error fetching Unsplash photos: {e}")
            return []
    
    async def search_photos(self, query: str, per_page: int = 10, page: int = 1, order_by: str = 'relevant') -> Dict:
        """
        Search for photos on Unsplash
        
        Args:
            query: Search query
            per_page: Number of results per page (max 30)
            page: Page number
            order_by: Sort order ('latest', 'oldest', 'popular', 'relevant')
            
        Returns:
            Search results with photos and metadata
        """
        try:
            async with httpx.AsyncClient() as client:
                params = {
                    "query": query,
                    "per_page": min(per_page, 30),
                    "page": page,
                    "order_by": order_by
                }
                
                response = await client.get(
                    f"{self.base_url}/search/photos",
                    headers=self.headers,
                    params=params,
                    timeout=30.0
                )
                
                response.raise_for_status()
                data = response.json()
                
                return {
                    "total": data.get("total", 0),
                    "total_pages": data.get("total_pages", 0),
                    "photos": [self._format_photo_data(photo) for photo in data.get("results", [])]
                }
                
        except Exception as e:
            print(f"❌ Error searching Unsplash photos: {e}")
            return {"total": 0, "total_pages": 0, "photos": []}
    
    def _format_photo_data(self, photo: Dict) -> Dict:
        """Format Unsplash photo data for our application"""
        return {
            "id": photo.get("id"),
            "description": photo.get("description") or photo.get("alt_description", ""),
            "urls": {
                "raw": photo["urls"]["raw"],
                "full": photo["urls"]["full"],
                "regular": photo["urls"]["regular"],
                "small": photo["urls"]["small"],
                "thumb": photo["urls"]["thumb"]
            },
            "user": {
                "name": photo["user"]["name"],
                "username": photo["user"]["username"],
                "profile_image": photo["user"]["profile_image"]["medium"]
            },
            "width": photo.get("width"),
            "height": photo.get("height"),
            "color": photo.get("color"),
            "likes": photo.get("likes", 0),
            "download_url": photo["links"]["download"],
            "html_url": photo["links"]["html"]
        }
    
    async def get_trending_topics(self) -> List[str]:
        """Get trending search topics for diverse content"""
        topics = [
            "nature", "technology", "lifestyle", "travel", "food",
            "architecture", "art", "fashion", "fitness", "business",
            "music", "photography", "design", "city", "landscape",
            "portrait", "abstract", "minimal", "vintage", "modern",
            "sunset", "ocean", "mountains", "forest", "urban",
            "coffee", "workspace", "creativity", "inspiration", "success"
        ]
        return random.sample(topics, 5)  # Return 5 random topics
    
    async def download_photo(self, photo_id: str) -> Optional[str]:
        """
        Trigger download tracking for Unsplash (required by API guidelines)
        Returns the download URL
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/photos/{photo_id}/download",
                    headers=self.headers,
                    timeout=30.0
                )
                
                response.raise_for_status()
                data = response.json()
                return data.get("url")
                
        except Exception as e:
            print(f"❌ Error downloading photo {photo_id}: {e}")
            return None
