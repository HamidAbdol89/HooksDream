"""
Smart Content Generator - AI-Powered Posts for Real Users
Simplified version that generates content for real users only
"""

import random
import asyncio
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from services.unsplash_service import UnsplashService
from services.bot_profile import BotProfile  # Simple bot profile for AI captions
from services.gpt_service import GPTService

class SmartContentGenerator:
    """Advanced content generation for real users"""
    
    def __init__(self, unsplash_service: UnsplashService):
        self.unsplash_service = unsplash_service
        self.gpt_service = GPTService()
        
    async def generate_smart_post_for_bot_account(self, bot_account: Dict, topic: str = None) -> Dict:
        """Generate intelligent post for real user with multiple images"""
        
        # Smart topic selection if not provided
        if not topic:
            topic = self._select_random_topic()
        
        # Determine number of images (1-3 for simplicity)
        num_images = random.randint(1, 3)
        
        # Generate content for bot account
        return await self._generate_post_for_bot_account(bot_account, topic, num_images)
    
    async def _generate_post_for_bot_account(self, bot_account: Dict, topic: str, num_images: int) -> Dict:
        """Generate post content for real user"""
        try:
            # Get images from Unsplash
            search_result = await self.unsplash_service.search_photos(topic, per_page=num_images)
            photos = search_result.get('results', []) if search_result else []
            
            if not photos:
                # Fallback to random photos if search fails
                photos = await self.unsplash_service.get_random_photos(count=num_images, query=topic)
                if not photos:
                    return None
            
            # Create bot profile using bot account data
            bot_profile = BotProfile(
                id=bot_account.get('_id', 'temp'),
                name=bot_account.get('displayName', 'Bot'),
                username=bot_account.get('username', 'bot'),
                personality_type=bot_account.get('botType', 'lifestyle'),  # Use bot's personality
                bio=bot_account.get('bio', 'AI Content Creator'),
                avatar_style="default",
                interests=[topic],
                posting_style="creative",
                created_at=datetime.now()
            )
            
            # Generate AI caption
            caption = await self.gpt_service.generate_smart_caption(
                bot_profile, 
                photos[0],  # Use first photo for caption
                topic
            )
            
            # Return post data
            return {
                "content": caption or f"Beautiful {topic} moment ✨ #{topic} #photography",
                "images": [photo["urls"]["regular"] for photo in photos],
                "bot_account": bot_account,
                "topic": topic,
                "post_type": f"bot_account_{num_images}_images"
            }
            
        except Exception as e:
            print(f"❌ Error generating post for bot account {bot_account.get('displayName', 'Unknown')}: {str(e)}")
            print(f"   Topic: {topic}, Images requested: {num_images}")
            return None
    
    def _select_random_topic(self) -> str:
        """Select random topic for content generation"""
        topics = [
            "nature", "sunset", "travel", "food", "technology", 
            "art", "lifestyle", "photography", "architecture", "ocean"
        ]
        return random.choice(topics)
