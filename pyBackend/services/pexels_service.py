"""
Pexels API Service
Alternative image source to reduce dependency on Unsplash
"""

import httpx
import random
import asyncio
from typing import List, Dict, Optional
from config import settings

class PexelsService:
    def __init__(self):
        self.api_key = settings.PEXELS_API_KEY or "VmrswkKHoYIRCDjEedaeGrm7iOQjYNdS3BavOK5aEPYVxa3GtRQurAx8"
        self.base_url = "https://api.pexels.com/v1"
        self.headers = {
            "Authorization": self.api_key,
            "User-Agent": "HooksDream Bot/1.0"
        }
        self.consecutive_errors = 0
    
    async def _handle_rate_limit(self, response: httpx.Response) -> bool:
        """Handle rate limit response and implement backoff"""
        if response.status_code == 429:  # Too Many Requests
            self.consecutive_errors += 1
            
            # Exponential backoff: 2^errors seconds, max 300 seconds (5 minutes)
            backoff_time = min(2 ** self.consecutive_errors, 300)
            
            print(f"🚨 Pexels API rate limited. Backing off for {backoff_time} seconds...")
            await asyncio.sleep(backoff_time)
            return True
        elif response.status_code == 200:
            self.consecutive_errors = 0  # Reset on success
            return False
        
        return False
    
    async def search_photos(self, query: str, per_page: int = 15, page: int = 1) -> List[Dict]:
        """
        Search for photos on Pexels
        
        Args:
            query: Search query
            per_page: Number of results per page (max 80)
            page: Page number
            
        Returns:
            List of photo data dictionaries
        """
        try:
            async with httpx.AsyncClient() as client:
                params = {
                    "query": query,
                    "per_page": min(per_page, 80),  # Pexels limit
                    "page": page
                }
                
                response = await client.get(
                    f"{self.base_url}/search",
                    headers=self.headers,
                    params=params,
                    timeout=30.0
                )
                
                # Handle rate limiting
                if await self._handle_rate_limit(response):
                    return []
                
                response.raise_for_status()
                data = response.json()
                
                if 'photos' in data:
                    return [self._format_photo_data(photo) for photo in data['photos']]
                
                return []
                
        except Exception as e:
            print(f"❌ Error searching Pexels photos: {e}")
            return []
    
    async def get_curated_photos(self, per_page: int = 15, page: int = 1) -> List[Dict]:
        """
        Get curated photos from Pexels (high quality, hand-picked)
        
        Args:
            per_page: Number of results per page (max 80)
            page: Page number
            
        Returns:
            List of photo data dictionaries
        """
        try:
            async with httpx.AsyncClient() as client:
                params = {
                    "per_page": min(per_page, 80),
                    "page": page
                }
                
                response = await client.get(
                    f"{self.base_url}/curated",
                    headers=self.headers,
                    params=params,
                    timeout=30.0
                )
                
                # Handle rate limiting
                if await self._handle_rate_limit(response):
                    return []
                
                response.raise_for_status()
                data = response.json()
                
                if 'photos' in data:
                    return [self._format_photo_data(photo) for photo in data['photos']]
                
                return []
                
        except Exception as e:
            print(f"❌ Error getting curated Pexels photos: {e}")
            return []
    
    def _format_photo_data(self, photo: Dict) -> Dict:
        """Format Pexels photo data to match Unsplash format"""
        return {
            'id': str(photo.get('id', '')),
            'urls': {
                'raw': photo.get('src', {}).get('original', ''),
                'full': photo.get('src', {}).get('large2x', ''),
                'regular': photo.get('src', {}).get('large', ''),
                'small': photo.get('src', {}).get('medium', ''),
                'thumb': photo.get('src', {}).get('small', '')
            },
            'alt_description': photo.get('alt', ''),
            'description': photo.get('alt', ''),
            'width': photo.get('width', 0),
            'height': photo.get('height', 0),
            'color': photo.get('avg_color', '#000000'),
            'user': {
                'name': photo.get('photographer', 'Unknown'),
                'username': photo.get('photographer', '').lower().replace(' ', '_'),
                'links': {
                    'html': photo.get('photographer_url', '')
                }
            },
            'links': {
                'html': photo.get('url', ''),
                'download': photo.get('src', {}).get('original', '')
            },
            'source': 'pexels'  # Mark source for tracking
        }
    
    async def get_portrait_photos(self, query: str = "portrait", per_page: int = 15, page: int = 1) -> List[Dict]:
        """
        Get portrait photos specifically for avatars
        
        Args:
            query: Search query (default: "portrait")
            per_page: Number of results per page
            page: Page number
            
        Returns:
            List of portrait photo data
        """
        
        # Enhanced portrait queries for better results
        portrait_queries = [
            f"{query} person face",
            f"professional {query}",
            f"{query} headshot",
            f"business {query}",
            f"{query} closeup"
        ]
        
        # Try different variations
        for enhanced_query in portrait_queries:
            photos = await self.search_photos(enhanced_query, per_page, page)
            
            # Filter for portrait orientation and face photos
            portrait_photos = []
            for photo in photos:
                if self._is_good_portrait(photo):
                    portrait_photos.append(photo)
            
            if portrait_photos:
                return portrait_photos
            
            # Small delay between queries
            await asyncio.sleep(0.3)
        
        return []
    
    def _is_good_portrait(self, photo: Dict) -> bool:
        """Check if photo is suitable for portrait/avatar use"""
        
        # Check dimensions (prefer portrait or square)
        width = photo.get('width', 0)
        height = photo.get('height', 0)
        
        if width == 0 or height == 0:
            return False
        
        aspect_ratio = width / height
        
        # Prefer portraits (0.6-1.4 ratio) and avoid very wide images
        if aspect_ratio > 1.6:  # Too wide
            return False
        
        # Check if it's likely a face/portrait based on description
        description = photo.get('description', '').lower()
        alt_description = photo.get('alt_description', '').lower()
        
        portrait_keywords = ['person', 'man', 'woman', 'face', 'portrait', 'headshot', 'professional', 'people']
        avoid_keywords = ['landscape', 'building', 'food', 'animal', 'car', 'nature scene', 'object']
        
        combined_text = f"{description} {alt_description}"
        
        has_portrait_keyword = any(keyword in combined_text for keyword in portrait_keywords)
        has_avoid_keyword = any(keyword in combined_text for keyword in avoid_keywords)
        
        return has_portrait_keyword and not has_avoid_keyword
    
    def get_service_info(self) -> Dict:
        """Get service information and statistics"""
        return {
            'service': 'pexels',
            'base_url': self.base_url,
            'consecutive_errors': self.consecutive_errors,
            'features': [
                'search_photos',
                'curated_photos', 
                'portrait_photos',
                'high_quality_images',
                'commercial_use_allowed'
            ]
        }

# Global instance
pexels_service = PexelsService()
