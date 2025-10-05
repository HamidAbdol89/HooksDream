"""
Hybrid Image Service
Combines Unsplash and Pexels APIs for better reliability and diversity
Implements intelligent load balancing and fallback strategies
"""

import random
import asyncio
from typing import List, Dict, Optional, Tuple
from datetime import datetime, timedelta
from services.unsplash_service import UnsplashService
from services.pexels_service import PexelsService, pexels_service
class HybridImageService:
    def __init__(self, unsplash_service: UnsplashService):
        self.unsplash_service = unsplash_service
        self.pexels_service = pexels_service
        
        # Load balancing weights (prioritize Pexels for better image quality)
        self.service_weights = {
            'pexels': 0.65,   # 65% Pexels (higher quality, better portraits, commercial friendly)
            'unsplash': 0.35  # 35% Unsplash (good variety, backup)
        }
        
        # Track service health
        self.service_health = {
            'unsplash': {'errors': 0, 'last_success': None, 'rate_limited': False},
            'pexels': {'errors': 0, 'last_success': None, 'rate_limited': False}
        }
        
        # Used image tracking to avoid duplicates
        self.used_images = set()
        
    def _select_service(self, prefer_service: Optional[str] = None) -> str:
        """
        Intelligently select which service to use based on:
        - Service health
        - Load balancing weights
        - Rate limiting status
        - User preference
        """
        
        if prefer_service and prefer_service in self.service_weights:
            # Check if preferred service is healthy
            if not self.service_health[prefer_service]['rate_limited']:
                return prefer_service
        
        # Filter out rate-limited services
        available_services = []
        for service, health in self.service_health.items():
            if not health['rate_limited'] and health['errors'] < 5:
                available_services.append(service)
        
        if not available_services:
            # All services have issues, reset and try anyway
            print("⚠️ All image services have issues, resetting health status")
            for service in self.service_health:
                self.service_health[service]['errors'] = 0
                self.service_health[service]['rate_limited'] = False
            available_services = list(self.service_weights.keys())
        
        # Weighted random selection from available services
        if len(available_services) == 1:
            return available_services[0]
        
        # Calculate adjusted weights for available services
        total_weight = sum(self.service_weights[s] for s in available_services)
        rand = random.random() * total_weight
        
        cumulative = 0
        for service in available_services:
            cumulative += self.service_weights[service]
            if rand <= cumulative:
                return service
        
        return available_services[0]  # Fallback
    
    async def search_photos_hybrid(self, query: str, count: int = 1, prefer_service: Optional[str] = None) -> List[Dict]:
        """
        Search for photos using hybrid approach
        
        Args:
            query: Search query
            count: Number of photos needed
            prefer_service: Preferred service ('unsplash' or 'pexels')
            
        Returns:
            List of photo data from multiple sources
        """
        
        photos = []
        attempts = 0
        max_attempts = 6  # Try multiple services/pages
        
        while len(photos) < count and attempts < max_attempts:
            attempts += 1
            
            # Select service for this attempt
            service = self._select_service(prefer_service)
            
            try:
                # Calculate how many photos we still need
                needed = count - len(photos)
                per_page = min(needed * 2, 20)  # Get extra to filter duplicates
                page = random.randint(1, 5)  # Random page for variety
                
                print(f"🔍 Attempt {attempts}: Using {service.upper()} for '{query}' (need {needed} photos)")
                
                if service == 'unsplash':
                    service_photos = await self._search_unsplash(query, per_page, page)
                else:  # pexels
                    service_photos = await self._search_pexels(query, per_page, page)
                
                # Filter out duplicates and add to results
                new_photos = []
                for photo in service_photos:
                    photo_id = photo.get('id')
                    if photo_id not in self.used_images:
                        new_photos.append(photo)
                        self.used_images.add(photo_id)
                        
                        if len(photos) + len(new_photos) >= count:
                            break
                
                photos.extend(new_photos)
                
                # Record success
                self.service_health[service]['last_success'] = datetime.now()
                self.service_health[service]['errors'] = max(0, self.service_health[service]['errors'] - 1)
                
                if new_photos:
                    print(f"✅ Got {len(new_photos)} photos from {service.upper()}")
                else:
                    print(f"⚠️ No new photos from {service.upper()}")
                
            except Exception as e:
                print(f"❌ Error with {service.upper()}: {e}")
                self.service_health[service]['errors'] += 1
                
                # Mark as rate limited if 403/429 error
                if '403' in str(e) or '429' in str(e) or 'rate' in str(e).lower():
                    self.service_health[service]['rate_limited'] = True
                    print(f"🚨 {service.upper()} marked as rate limited")
            
            # Small delay between attempts
            await asyncio.sleep(0.5)
        
        print(f"🎯 Hybrid search result: {len(photos)} photos from {attempts} attempts")
        return photos[:count]  # Return exact count requested
    
    async def _search_unsplash(self, query: str, per_page: int, page: int) -> List[Dict]:
        """Search Unsplash with error handling"""
        
        # Try search first
        try:
            result = await self.unsplash_service.search_photos(query, per_page, page)
            if result and 'results' in result:
                return result['results']
        except Exception as e:
            print(f"⚠️ Unsplash search failed: {e}")
        
        # Fallback to random photos
        try:
            return await self.unsplash_service.get_random_photos(per_page, query)
        except Exception as e:
            print(f"⚠️ Unsplash random failed: {e}")
            return []
    
    async def _search_pexels(self, query: str, per_page: int, page: int) -> List[Dict]:
        """Search Pexels with error handling"""
        
        # Try search first
        try:
            photos = await self.pexels_service.search_photos(query, per_page, page)
            if photos:
                return photos
        except Exception as e:
            print(f"⚠️ Pexels search failed: {e}")
        
        # Fallback to curated photos
        try:
            return await self.pexels_service.get_curated_photos(per_page, page)
        except Exception as e:
            print(f"⚠️ Pexels curated failed: {e}")
            return []
    
    async def get_portrait_photos_hybrid(self, query: str = "portrait", count: int = 1) -> List[Dict]:
        """
        Get portrait photos specifically for avatars using hybrid approach
        """
        
        portrait_queries = [
            f"professional {query}",
            f"{query} headshot", 
            f"business {query}",
            f"{query} person",
            "professional headshot",
            "business portrait",
            "person face"
        ]
        
        photos = []
        
        for enhanced_query in portrait_queries:
            if len(photos) >= count:
                break
                
            # Try both services for portraits, prioritize Pexels
            for service in ['pexels', 'unsplash']:  # Pexels first - better portrait quality
                try:
                    needed = count - len(photos)
                    if needed <= 0:
                        break
                    
                    if service == 'pexels':
                        service_photos = await self.pexels_service.get_portrait_photos(enhanced_query, needed * 2)
                    else:
                        # For Unsplash, use regular search
                        result = await self.unsplash_service.search_photos(enhanced_query, needed * 2, 1)
                        service_photos = result.get('results', []) if result else []
                    
                    # Filter for good portraits
                    for photo in service_photos:
                        if len(photos) >= count:
                            break
                            
                        photo_id = photo.get('id')
                        if (photo_id not in self.used_images and 
                            self._is_good_portrait_hybrid(photo)):
                            
                            photos.append(photo)
                            self.used_images.add(photo_id)
                    
                    await asyncio.sleep(0.3)  # Rate limit protection
                    
                except Exception as e:
                    print(f"⚠️ Portrait search failed for {service}: {e}")
                    continue
        
        print(f"👤 Found {len(photos)} portrait photos for avatars")
        return photos[:count]
    
    def _is_good_portrait_hybrid(self, photo: Dict) -> bool:
        """Check if photo is good for portrait use (works with both services)"""
        
        width = photo.get('width', 0)
        height = photo.get('height', 0)
        
        if width == 0 or height == 0:
            return False
        
        aspect_ratio = width / height
        
        # Prefer portrait orientation (0.6-1.4 ratio)
        if aspect_ratio > 1.5:
            return False
        
        # Check descriptions
        description = photo.get('description', '').lower()
        alt_description = photo.get('alt_description', '').lower()
        
        portrait_keywords = ['person', 'man', 'woman', 'face', 'portrait', 'headshot', 'professional']
        avoid_keywords = ['landscape', 'building', 'food', 'animal', 'car', 'multiple people', 'crowd']
        
        combined_text = f"{description} {alt_description}"
        
        has_portrait = any(keyword in combined_text for keyword in portrait_keywords)
        has_avoid = any(keyword in combined_text for keyword in avoid_keywords)
        
        return has_portrait and not has_avoid
    
    def get_service_stats(self) -> Dict:
        """Get statistics about service usage and health"""
        
        return {
            'service_weights': self.service_weights,
            'service_health': self.service_health,
            'total_used_images': len(self.used_images),
            'available_services': [
                service for service, health in self.service_health.items()
                if not health['rate_limited'] and health['errors'] < 5
            ]
        }
    
    def reset_rate_limits(self):
        """Reset rate limit flags (call periodically)"""
        for service in self.service_health:
            self.service_health[service]['rate_limited'] = False
            self.service_health[service]['errors'] = 0
        print("🔄 Reset all service rate limits")

# This will be initialized in main.py
hybrid_image_service = None
