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
from services.image_tracker import global_image_tracker

class SmartContentGenerator:
    
    def __init__(self, unsplash_service: UnsplashService):
        self.unsplash_service = unsplash_service
        self.gpt_service = GPTService()
        
    async def generate_smart_post_for_bot_account(self, bot_account: Dict) -> Optional[Dict]:
        """Generate smart post content for bot account based on their expertise"""
        # Select topic based on bot's expertise and interests
        topic = self._select_smart_topic_for_bot(bot_account)
        
        # Determine number of images based on bot type
        bot_type = bot_account.get('botType', 'lifestyle')
        if bot_type == 'photographer':
            num_images = random.randint(1, 4)  # Photographers post more images
        elif bot_type == 'artist':
            num_images = random.randint(1, 3)  # Artists showcase their work
        else:
            num_images = random.randint(1, 2)  # Others post fewer images
        
        # Generate content for bot account
        return await self._generate_post_for_bot_account(bot_account, topic, num_images)
    
    async def _generate_post_for_bot_account(self, bot_account: Dict, topic: str, num_images: int) -> Dict:
        try:
            # Get unique images from Unsplash with randomization
            photos = await self._get_unique_images(topic, num_images, bot_account)
            
            if not photos:
                return None
            
            # Create bot profile using bot account data
            bot_profile = BotProfile(
                id=bot_account.get('_id', 'temp'),
                name=bot_account.get('displayName', 'Bot'),
                username=bot_account.get('username', 'bot'),
                personality_type=bot_account.get('botType', 'lifestyle'),  # Use bot's personality
                bio=bot_account.get('bio', 'AI Content Creator'),
                interests=[topic],
                posting_style="creative",
                created_at=datetime.now()
            )
            
            # Generate AI caption using bot profile and expertise
            caption = await self.gpt_service.generate_professional_caption(
                bot_account, 
                topic, 
                photos[0] if photos else None
            )
            
            # Return post data
            return {
                "content": caption or f" Beautiful {topic} moment ✨ #{topic} #photography",
                "bot_account": bot_account,
                "topic": topic,
                "post_type": f"bot_account_{num_images}_images"
            }
            
        except Exception as e:
            print(f"❌ Error generating post for bot account {bot_account.get('displayName', 'Unknown')}: {str(e)}")
            print(f"   Topic: {topic}, Images requested: {num_images}")
            return None
    
    def _select_smart_topic_for_bot(self, bot_account: Dict) -> str:
        """Select topic based on bot's expertise and interests"""
        bot_type = bot_account.get('botType', 'lifestyle')
        interests = bot_account.get('interests', [])
        
        # Topic mapping based on bot type and interests
        topic_mapping = {
            'tech': [
                'technology', 'artificial intelligence', 'coding', 'innovation', 
                'software development', 'startup', 'digital transformation', 'cybersecurity'
            ],
            'photographer': [
                'photography', 'golden hour', 'portrait', 'landscape', 
                'street photography', 'nature photography', 'architectural photography'
            ],
            'artist': [
                'digital art', 'creative design', 'illustration', 'graphic design',
                'contemporary art', 'artistic inspiration', 'creative process'
            ],
            'traveler': [
                'travel destination', 'adventure', 'cultural heritage', 'backpacking',
                'world exploration', 'local cuisine', 'hidden gems'
            ],
            'lifestyle': [
                'wellness', 'mindful living', 'healthy lifestyle', 'work life balance',
                'self care', 'fitness motivation', 'morning routine'
            ],
            'nature': [
                'wildlife', 'conservation', 'forest', 'ocean waves', 
                'mountain landscape', 'environmental protection', 'natural beauty'
            ]
        }
        
        # Get topics for bot type
        available_topics = topic_mapping.get(bot_type, topic_mapping['lifestyle'])
        
        # Add interest-based topics
        if interests:
            for interest in interests:
                if interest in ['islamic studies', 'community leadership', 'halal business']:
                    available_topics.extend(['islamic architecture', 'community service', 'peaceful lifestyle'])
                elif interest in ['healthcare', 'medicine']:
                    available_topics.extend(['medical technology', 'health awareness', 'wellness'])
                elif interest in ['education', 'teaching']:
                    available_topics.extend(['learning', 'knowledge sharing', 'educational technology'])
        
        return random.choice(available_topics)
    
    async def _get_unique_images(self, topic: str, num_images: int, bot_account: Dict) -> List[Dict]:
        """Get unique, non-duplicate images from Unsplash"""
        photos = []
        
        try:
            # Strategy 1: Try search with random page to get different results
            random_page = random.randint(1, 5)  # Random page 1-5
            search_result = await self.unsplash_service.search_photos(
                topic, 
                per_page=min(30, num_images * 3),  # Get more photos to choose from
                page=random_page
            )
            
            if search_result and search_result.get('results'):
                available_photos = search_result['results']
                
                # Randomly select from available photos (check global uniqueness)
                unique_photos = []
                for photo in available_photos:
                    photo_id = photo.get('id')
                    photo_url = photo.get('urls', {}).get('regular', '')
                    
                    if not global_image_tracker.is_image_used(photo_id, photo_url):
                        unique_photos.append(photo)
                        # Mark as used immediately
                        global_image_tracker.mark_image_used(photo_id, photo_url)
                        
                        if len(unique_photos) >= num_images:
                            break
                
                photos = unique_photos
            
            # Strategy 2: If not enough photos, try random photos with variations
            if len(photos) < num_images:
                remaining_needed = num_images - len(photos)
                
                # Add topic variations for more diversity
                topic_variations = self._get_topic_variations(topic, bot_account)
                
                for variation in topic_variations:
                    if len(photos) >= num_images:
                        break
                        
                    random_photos = await self.unsplash_service.get_random_photos(
                        count=remaining_needed, 
                        query=variation
                    )
                    
                    if random_photos:
                        # Add unique photos (avoid duplicates by ID and global tracking)
                        existing_ids = {p.get('id') for p in photos}
                        for photo in random_photos:
                            photo_id = photo.get('id')
                            photo_url = photo.get('urls', {}).get('regular', '')
                            
                            # Check both local and global uniqueness
                            if (photo_id not in existing_ids and 
                                len(photos) < num_images and
                                not global_image_tracker.is_image_used(photo_id, photo_url)):
                                
                                photos.append(photo)
                                existing_ids.add(photo_id)
                                # Mark as used globally
                                global_image_tracker.mark_image_used(photo_id, photo_url)
            
            # Strategy 3: Final fallback - completely random photos
            if len(photos) < num_images:
                remaining_needed = num_images - len(photos)
                fallback_photos = await self.unsplash_service.get_random_photos(count=remaining_needed)
                
                if fallback_photos:
                    existing_ids = {p.get('id') for p in photos}
                    for photo in fallback_photos:
                        photo_id = photo.get('id')
                        photo_url = photo.get('urls', {}).get('regular', '')
                        
                        # Final check for global uniqueness
                        if (photo_id not in existing_ids and 
                            len(photos) < num_images and
                            not global_image_tracker.is_image_used(photo_id, photo_url)):
                            
                            photos.append(photo)
                            global_image_tracker.mark_image_used(photo_id, photo_url)
            
            # Log statistics
            stats = global_image_tracker.get_stats()
            print(f"📸 Retrieved {len(photos)} unique images for topic '{topic}'")
            print(f"📊 Global tracker: {stats['tracked_images']} images tracked")
            return photos
            
        except Exception as e:
            print(f"❌ Error getting unique images: {e}")
            return []
    
    def _get_topic_variations(self, topic: str, bot_account: Dict) -> List[str]:
        """Generate topic variations for more diverse image results"""
        bot_type = bot_account.get('botType', 'lifestyle')
        
        # Base variations
        variations = [topic]
        
        # Add bot-type specific variations
        if bot_type == 'tech':
            variations.extend([
                f"{topic} technology",
                f"modern {topic}",
                f"{topic} innovation",
                f"digital {topic}"
            ])
        elif bot_type == 'photographer':
            variations.extend([
                f"{topic} photography",
                f"beautiful {topic}",
                f"{topic} aesthetic",
                f"professional {topic}"
            ])
        elif bot_type == 'artist':
            variations.extend([
                f"{topic} art",
                f"creative {topic}",
                f"{topic} design",
                f"artistic {topic}"
            ])
        elif bot_type == 'traveler':
            variations.extend([
                f"{topic} travel",
                f"{topic} destination",
                f"explore {topic}",
                f"{topic} adventure"
            ])
        elif bot_type == 'lifestyle':
            variations.extend([
                f"{topic} lifestyle",
                f"healthy {topic}",
                f"{topic} wellness",
                f"mindful {topic}"
            ])
        elif bot_type == 'nature':
            variations.extend([
                f"{topic} nature",
                f"wild {topic}",
                f"{topic} environment",
                f"natural {topic}"
            ])
        
        # Add time-based variations for more uniqueness
        import datetime
        hour = datetime.datetime.now().hour
        if 6 <= hour <= 10:
            variations.append(f"morning {topic}")
        elif 11 <= hour <= 14:
            variations.append(f"midday {topic}")
        elif 15 <= hour <= 18:
            variations.append(f"afternoon {topic}")
        else:
            variations.append(f"evening {topic}")
        
        # Shuffle and return unique variations
        unique_variations = list(set(variations))
        random.shuffle(unique_variations)
        return unique_variations[:5]  # Limit to 5 variations
