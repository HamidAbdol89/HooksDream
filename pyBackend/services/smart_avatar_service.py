"""
Smart Avatar Service
Generates realistic human avatars for bots using Unsplash portraits
Avoids duplicates and prioritizes fresh, diverse photos
"""

import asyncio
import random
import hashlib
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Set
from services.unsplash_service import UnsplashService

class SmartAvatarService:
    def __init__(self, image_service=None):
        self.image_service = image_service  # Will be HybridImageService
        self.used_avatars: Set[str] = set()  # Track used photo IDs
        self.avatar_cache: List[Dict] = []  # Cache fresh portraits
        self.last_refresh = None
        
        # Diverse portrait search terms for realistic variety
        self.portrait_queries = [
            "professional headshot",
            "business portrait", 
            "casual portrait",
            "creative professional",
            "entrepreneur portrait",
            "tech professional",
            "young professional",
            "diverse professional",
            "confident person",
            "friendly face",
            "approachable person",
            "modern portrait",
            "lifestyle portrait",
            "authentic portrait"
        ]
        
        # Demographic diversity for inclusive representation
        self.demographic_terms = [
            "asian professional",
            "african american professional", 
            "hispanic professional",
            "middle eastern professional",
            "european professional",
            "indian professional",
            "mixed race professional",
            "diverse ethnicity"
        ]
    
    async def get_smart_avatar_for_bot(self, bot_account: Dict) -> Optional[str]:
        """
        Get a smart, realistic avatar for a bot based on their personality and type
        Ensures no duplicates and prioritizes fresh photos
        """
        try:
            # Refresh cache if needed (every 6 hours)
            await self._refresh_avatar_cache_if_needed()
            
            # Get bot characteristics for targeted search
            bot_type = bot_account.get('botType', 'lifestyle')
            bot_name = bot_account.get('displayName', 'Bot')
            bot_bio = bot_account.get('bio', '')
            
            # Generate targeted search query based on bot personality
            search_query = self._generate_targeted_query(bot_type, bot_name, bot_bio)
            
            # Try to get fresh avatar from cache first
            avatar_url = await self._get_cached_avatar(search_query)
            
            if not avatar_url:
                # Fetch new avatars if cache is empty
                avatar_url = await self._fetch_fresh_avatar(search_query)
            
            if avatar_url:
                print(f"👤 Smart avatar assigned to {bot_name}: {search_query}")
                return avatar_url
            else:
                print(f"⚠️ Fallback avatar for {bot_name}")
                return self._get_fallback_avatar(bot_account)
                
        except Exception as e:
            print(f"❌ Error getting smart avatar: {e}")
            return self._get_fallback_avatar(bot_account)
    
    def _generate_targeted_query(self, bot_type: str, bot_name: str, bot_bio: str) -> str:
        """Generate targeted search query based on bot characteristics"""
        
        # Base queries by bot type
        type_queries = {
            'tech': ['tech professional', 'software engineer', 'developer portrait', 'tech startup'],
            'photographer': ['photographer portrait', 'creative professional', 'artist portrait', 'visual artist'],
            'lifestyle': ['lifestyle blogger', 'wellness coach', 'life coach', 'mindful person'],
            'travel': ['travel blogger', 'adventurer portrait', 'explorer', 'world traveler'],
            'food': ['chef portrait', 'food blogger', 'culinary professional', 'restaurant owner'],
            'fitness': ['fitness trainer', 'health coach', 'athletic person', 'wellness expert'],
            'business': ['business professional', 'entrepreneur', 'executive portrait', 'corporate leader'],
            'art': ['artist portrait', 'creative professional', 'designer', 'artistic person'],
            'nature': ['environmental scientist', 'nature lover', 'outdoor enthusiast', 'conservationist']
        }
        
        # Get base query for bot type
        base_queries = type_queries.get(bot_type, ['professional portrait'])
        base_query = random.choice(base_queries)
        
        # Add demographic diversity (30% chance)
        if random.random() < 0.3:
            demographic = random.choice(self.demographic_terms)
            return demographic
        
        # Add age variation (20% chance)
        if random.random() < 0.2:
            age_terms = ['young', 'millennial', 'gen z', 'mature', 'experienced']
            age_term = random.choice(age_terms)
            return f"{age_term} {base_query}"
        
        return base_query
    
    async def _refresh_avatar_cache_if_needed(self):
        """Refresh avatar cache every 6 hours to get fresh photos"""
        now = datetime.now()
        
        if (self.last_refresh is None or 
            now - self.last_refresh > timedelta(hours=6) or 
            len(self.avatar_cache) < 20):
            
            print("🔄 Refreshing avatar cache with fresh portraits...")
            await self._build_avatar_cache()
            self.last_refresh = now
    
    async def _build_avatar_cache(self):
        """Build cache of diverse, high-quality portraits"""
        self.avatar_cache = []
        
        # Mix of general and specific queries for diversity
        cache_queries = (
            self.portrait_queries[:8] +  # General professional portraits
            self.demographic_terms[:6] +  # Diverse demographics
            ['creative professional', 'tech startup founder', 'wellness coach']  # Specific roles
        )
        
        for query in cache_queries:
            try:
                # Use hybrid service to get portraits - prioritizes Pexels for better quality
                photos = await self.image_service.get_portrait_photos_hybrid(query, count=10)
                
                for photo in photos:
                    photo_id = photo.get('id')
                    
                    # Only add if not already used and high quality
                    if (photo_id not in self.used_avatars and 
                        self._is_good_portrait(photo)):
                        
                        self.avatar_cache.append({
                            'id': photo_id,
                            'url': photo['urls']['regular'],
                            'thumb': photo['urls']['thumb'],
                            'query': query,
                            'photographer': photo.get('user', {}).get('name', 'Unknown'),
                            'width': photo.get('width', 0),
                            'height': photo.get('height', 0),
                            'source': photo.get('source', 'unknown')  # Track source (unsplash/pexels)
                        })
                
                # Small delay to avoid rate limits
                await asyncio.sleep(0.3)
                
            except Exception as e:
                print(f"⚠️ Error caching avatars for '{query}': {e}")
                continue
        
        print(f"✅ Avatar cache built: {len(self.avatar_cache)} fresh portraits")
    
    def _is_good_portrait(self, photo: Dict) -> bool:
        """Check if photo is suitable for bot avatar"""
        
        # Check dimensions (prefer portrait or square)
        width = photo.get('width', 0)
        height = photo.get('height', 0)
        
        if width == 0 or height == 0:
            return False
        
        aspect_ratio = width / height
        
        # Prefer portraits (0.7-1.3 ratio) and avoid very wide images
        if aspect_ratio > 1.5:  # Too wide
            return False
        
        # Check if it's likely a face/portrait based on description
        description = photo.get('description', '').lower()
        alt_description = photo.get('alt_description', '').lower()
        
        portrait_keywords = ['person', 'man', 'woman', 'face', 'portrait', 'headshot', 'professional']
        avoid_keywords = ['landscape', 'building', 'food', 'animal', 'car', 'nature scene']
        
        combined_text = f"{description} {alt_description}"
        
        has_portrait_keyword = any(keyword in combined_text for keyword in portrait_keywords)
        has_avoid_keyword = any(keyword in combined_text for keyword in avoid_keywords)
        
        return has_portrait_keyword and not has_avoid_keyword
    
    async def _get_cached_avatar(self, preferred_query: str) -> Optional[str]:
        """Get avatar from cache, preferring ones matching the query"""
        
        if not self.avatar_cache:
            return None
        
        # First try to find avatars matching the preferred query
        matching_avatars = [
            avatar for avatar in self.avatar_cache 
            if preferred_query.lower() in avatar['query'].lower()
            and avatar['id'] not in self.used_avatars
        ]
        
        if matching_avatars:
            chosen_avatar = random.choice(matching_avatars)
        else:
            # Fallback to any unused avatar
            unused_avatars = [
                avatar for avatar in self.avatar_cache 
                if avatar['id'] not in self.used_avatars
            ]
            
            if unused_avatars:
                chosen_avatar = random.choice(unused_avatars)
            else:
                return None
        
        # Mark as used and return URL
        self.used_avatars.add(chosen_avatar['id'])
        return chosen_avatar['url']
    
    async def _fetch_fresh_avatar(self, query: str) -> Optional[str]:
        """Fetch a fresh avatar directly from Unsplash"""
        try:
            # Try multiple pages to find unused photos
            for page in [1, 2, 3]:
                search_result = await self.unsplash_service.search_photos(
                    query=query,
                    per_page=20,
                    page=page,
                    order_by='latest'
                )
                
                if search_result and 'results' in search_result:
                    for photo in search_result['results']:
                        photo_id = photo.get('id')
                        
                        if (photo_id not in self.used_avatars and 
                            self._is_good_portrait(photo)):
                            
                            self.used_avatars.add(photo_id)
                            return photo['urls']['regular']
                
                await asyncio.sleep(0.3)  # Rate limit protection
            
            return None
            
        except Exception as e:
            print(f"❌ Error fetching fresh avatar: {e}")
            return None
    
    def _get_fallback_avatar(self, bot_account: Dict) -> str:
        """Generate fallback avatar using bot characteristics"""
        
        # Create deterministic avatar based on bot username
        username = bot_account.get('username', 'bot')
        bot_type = bot_account.get('botType', 'lifestyle')
        
        # Use different avatar services as fallback
        fallback_services = [
            f"https://api.dicebear.com/7.x/avataaars/svg?seed={username}&backgroundColor=b6e3f4",
            f"https://api.dicebear.com/7.x/personas/svg?seed={username}&backgroundColor=c0aede", 
            f"https://api.dicebear.com/7.x/adventurer/svg?seed={username}&backgroundColor=ffd5dc",
            f"https://robohash.org/{username}?set=set4&size=200x200",  # Human-like robots
        ]
        
        # Choose based on bot type
        type_index = hash(bot_type) % len(fallback_services)
        return fallback_services[type_index]
    
    def get_avatar_stats(self) -> Dict:
        """Get statistics about avatar usage"""
        return {
            'total_cached': len(self.avatar_cache),
            'total_used': len(self.used_avatars),
            'available': len(self.avatar_cache) - len(self.used_avatars),
            'last_refresh': self.last_refresh.isoformat() if self.last_refresh else None
        }

# Global instance
smart_avatar_service = SmartAvatarService(None)  # Will be initialized with unsplash_service later
