"""
Smart Content Generator - AI-Powered Multi-Image Posts
Handles intelligent content creation with multiple images and advanced strategies
"""

import random
import asyncio
from typing import Dict, List, Optional, Tuple
from services.unsplash_service import UnsplashService
from services.ai_bot_manager import BotProfile, AIBotManager
from services.gpt_service import GPTService

class SmartContentGenerator:
    """Advanced content generation with multi-image support"""
    
    def __init__(self, unsplash_service: UnsplashService):
        self.unsplash_service = unsplash_service
        self.gpt_service = GPTService()
    async def generate_smart_post(self, bot_profile: BotProfile, topic: str = None) -> Dict:
        """Generate intelligent post with multiple images"""
        
        # Smart topic selection if not provided
        if not topic:
            topic = await self._select_optimal_topic(bot_profile)
        
        # Determine number of images (1-4 based on content type)
        num_images = self._determine_image_count(topic, bot_profile)
        
        # Generate multi-image content
        if num_images == 1:
            return await self._generate_single_image_post(bot_profile, topic)
        else:
            return await self._generate_multi_image_post(bot_profile, topic, num_images)
    
    def _determine_image_count(self, topic: str, bot_profile: BotProfile) -> int:
        """Intelligently determine number of images based on content type"""
        
        # Multi-image preferences by personality
        multi_image_personalities = {
            "photographer": 0.7,  # 70% chance for multiple images
            "traveler": 0.8,      # 80% chance for travel galleries
            "artist": 0.6,        # 60% chance for art collections
            "lifestyle": 0.5,     # 50% chance for lifestyle posts
            "tech": 0.3,          # 30% chance for tech posts
            "foodie": 0.6         # 60% chance for food galleries
        }
        
        # Topic-based preferences
        multi_image_topics = {
            "travel": 0.8,
            "food": 0.7,
            "architecture": 0.6,
            "nature": 0.7,
            "art": 0.6,
            "lifestyle": 0.5,
            "fashion": 0.6
        }
        
        # Calculate probability for multiple images
        personality_prob = multi_image_personalities.get(bot_profile.personality_type, 0.4)
        topic_prob = max([prob for keyword, prob in multi_image_topics.items() 
                         if keyword in topic.lower()] + [0.3])
        
        combined_prob = (personality_prob + topic_prob) / 2
        
        # Decide on image count
        if random.random() < combined_prob:
            # Multiple images (2-4)
            weights = [0.4, 0.4, 0.2]  # 40% for 2 images, 40% for 3, 20% for 4
            return random.choices([2, 3, 4], weights=weights)[0]
        else:
            # Single image
            return 1
    
    async def _generate_single_image_post(self, bot_profile: BotProfile, topic: str) -> Dict:
        """Generate single image post with smart content"""
        
        # Fetch single high-quality image
        photos = await self.unsplash_service.get_random_photos(count=1, query=topic)
        
        if not photos:
            return None
        
        photo = photos[0]
        
        # Generate smart caption
        caption = await self._generate_smart_caption(photo, topic, bot_profile)
        
        # Generate contextual hashtags
        hashtags = self._generate_contextual_hashtags(photo, topic, bot_profile)
        
        # Combine content
        full_content = caption
        if hashtags:
            full_content += f"\n\n{hashtags}"
        
        return {
            "content": full_content,
            "images": [photo["urls"]["regular"]],
            "bot_user": self._bot_to_api_format(bot_profile),
            "photo_data": photo,
            "topic": topic,
            "post_type": "single_image"
        }
    
    async def _generate_multi_image_post(self, bot_profile: BotProfile, topic: str, num_images: int) -> Dict:
        """Generate multi-image post with cohesive storytelling"""
        
        # Fetch multiple related images
        photos = await self.unsplash_service.get_random_photos(count=num_images * 2, query=topic)
        
        if len(photos) < num_images:
            # Fallback to single image if not enough photos
            return await self._generate_single_image_post(bot_profile, topic)
        
        # Select best images for cohesive story
        selected_photos = self._select_cohesive_images(photos, num_images, topic)
        
        # Generate multi-image caption
        caption = self._generate_multi_image_caption(selected_photos, topic, bot_profile)
        
        # Generate hashtags
        hashtags = self._generate_contextual_hashtags(selected_photos[0], topic, bot_profile)
        
        # Combine content
        full_content = caption
        if hashtags:
            full_content += f"\n\n{hashtags}"
        
        return {
            "content": full_content,
            "images": [photo["urls"]["regular"] for photo in selected_photos],
            "bot_user": self._bot_to_api_format(bot_profile),
            "photo_data": selected_photos,
            "topic": topic,
            "post_type": f"multi_image_{num_images}"
        }
    
    def _select_cohesive_images(self, photos: List[Dict], num_images: int, topic: str) -> List[Dict]:
        """Select images that work well together"""
        
        # Score images based on cohesion factors
        scored_photos = []
        
        for photo in photos:
            score = 0
            
            # Color harmony scoring
            if photo.get("color"):
                color = photo["color"].lower()
                # Prefer certain color palettes for cohesion
                if any(c in color for c in ["blue", "green", "white"]):
                    score += 2
                elif any(c in color for c in ["orange", "yellow", "red"]):
                    score += 1
            
            # Description relevance
            description = photo.get("description", "").lower()
            alt_description = photo.get("alt_description", "").lower()
            combined_text = f"{description} {alt_description}"
            
            # Topic relevance scoring
            if topic.lower() in combined_text:
                score += 3
            
            # Quality indicators
            if photo.get("likes", 0) > 100:
                score += 1
            if photo.get("width", 0) > 2000:
                score += 1
            
            scored_photos.append((photo, score))
        
        # Sort by score and select top images
        scored_photos.sort(key=lambda x: x[1], reverse=True)
        return [photo for photo, score in scored_photos[:num_images]]
    
    def _generate_multi_image_caption(self, photos: List[Dict], topic: str, bot_profile: BotProfile) -> str:
        """Generate caption for multi-image posts"""
        
        # Multi-image caption templates by personality
        templates = {
            "photographer": [
                "A visual story in {count} frames 📸✨",
                "Capturing different perspectives of {topic} 📷",
                "When one shot isn't enough to tell the story 🎯",
                "Multiple angles, one beautiful moment 📸",
                "The complete picture in {count} shots ✨"
            ],
            "traveler": [
                "Journey highlights from {topic} ✈️",
                "{count} moments that made this trip unforgettable 🌍",
                "Travel diary: {topic} edition 📖",
                "Collecting memories, one frame at a time 📸",
                "Adventure recap in {count} photos 🗺️"
            ],
            "artist": [
                "Creative exploration: {topic} series 🎨",
                "Artistic interpretation in {count} pieces ✨",
                "Visual narrative about {topic} 🖼️",
                "When inspiration strikes multiple times 💡",
                "Art collection: {topic} theme 🎭"
            ],
            "lifestyle": [
                "Life moments worth sharing ✨",
                "{count} reasons why life is beautiful 💕",
                "Lifestyle highlights: {topic} vibes 🌸",
                "Good vibes in {count} frames 😊",
                "Living my best {topic} life 💫"
            ],
            "tech": [
                "Tech showcase: {topic} evolution 💻",
                "Innovation in {count} perspectives 🚀",
                "Future is here: {topic} breakdown ⚡",
                "Technology meets aesthetics 🔮",
                "Digital world in {count} frames 📱"
            ],
            "foodie": [
                "Food journey: {topic} edition 🍜",
                "Culinary adventure in {count} dishes 👨‍🍳",
                "Flavor story told in {count} photos 📸",
                "Food diary: {topic} exploration 🥘",
                "Taste the rainbow in {count} bites 🌈"
            ]
        }
        
        # Select appropriate template
        personality_templates = templates.get(bot_profile.personality_type, templates["lifestyle"])
        base_caption = random.choice(personality_templates)
        
        # Format with actual values
        caption = base_caption.format(
            count=len(photos),
            topic=topic.replace("_", " ").title()
        )
        
        # Add contextual elements
        contextual_additions = self._get_contextual_additions(photos, topic)
        if contextual_additions and random.random() < 0.4:
            caption += f" {random.choice(contextual_additions)}"
        
        return caption
    
    def _get_contextual_additions(self, photos: List[Dict], topic: str) -> List[str]:
        """Get contextual additions based on photos and topic"""
        additions = []
        
        # Time-based additions
        now = datetime.now(pytz.UTC)
        hour = now.hour
        
        if 6 <= hour < 12:
            additions.extend(["Perfect morning vibes", "Starting the day right"])
        elif 12 <= hour < 18:
            additions.extend(["Afternoon inspiration", "Midday magic"])
        elif 18 <= hour < 22:
            additions.extend(["Golden hour perfection", "Evening beauty"])
        else:
            additions.extend(["Night time wonders", "After dark magic"])
        
        # Topic-based additions
        topic_additions = {
            "nature": ["Nature therapy at its finest", "Earth's masterpiece"],
            "urban": ["City life captured", "Urban exploration"],
            "food": ["Flavor explosion", "Culinary perfection"],
            "travel": ["Wanderlust satisfied", "Adventure complete"],
            "art": ["Creative energy flowing", "Artistic vision realized"]
        }
        
        for key, values in topic_additions.items():
            if key in topic.lower():
                additions.extend(values)
        
        return additions
    
    async def _generate_smart_caption(self, photo: Dict, topic: str, bot_profile: BotProfile) -> str:
        """Generate smart single-image caption using GPT or fallback"""
        
        # Try GPT first for intelligent captions
        gpt_caption = await self.gpt_service.generate_smart_caption(
            bot_profile, photo, topic
        )
        
        if gpt_caption:
            print(f"✨ GPT caption generated for {bot_profile.name}: {gpt_caption[:50]}...")
            return gpt_caption
        
        # Fallback to template-based captions
        print(f"⚠️ Using fallback caption for {bot_profile.name}")
        return self._generate_fallback_caption(photo, topic, bot_profile)
    
    def _generate_fallback_caption(self, photo: Dict, topic: str, bot_profile: BotProfile) -> str:
        """Generate fallback caption using templates"""
        
        # Analyze image for context
        analysis = self._analyze_image_context(photo)
        
        # Personality-based caption templates
        personality_templates = {
            "photographer": [
                "Caught this moment and couldn't resist sharing 📸",
                "When the light hits just right ✨",
                "Frame-worthy moment right here 🎯",
                "This composition spoke to me 📷",
                "Sometimes the shot finds you 🌟"
            ],
            "traveler": [
                "Another day, another adventure! 🌍",
                "This place stole my heart ✈️",
                "Travel memories in the making 📖",
                "Found my happy place 💎",
                "Wanderlust level: maximum 🧳"
            ],
            "artist": [
                "Inspiration strikes everywhere 🎨",
                "Art is all around us ✨",
                "Creative energy captured 💡",
                "When reality becomes art 🖼️",
                "Visual poetry in motion 🎭"
            ],
            "lifestyle": [
                "Living for moments like these ✨",
                "Good vibes only today 🌸",
                "Life is beautiful when you notice 💕",
                "Grateful for this moment 🙏",
                "Simple pleasures, big joy 😊"
            ],
            "tech": [
                "Future is happening now 🚀",
                "Innovation meets beauty 💻",
                "Tech aesthetics at their finest ⚡",
                "Digital world, analog feelings 🔮",
                "Progress has never looked better 🌐"
            ],
            "foodie": [
                "Food is love made visible 🍜",
                "Culinary art at its finest 👨‍🍳",
                "Taste buds are dancing 😋",
                "Food photography is my passion 📸",
                "Flavor explosion incoming 🌶️"
            ]
        }
        
        # Select base caption
        templates = personality_templates.get(bot_profile.personality_type, personality_templates["lifestyle"])
        base_caption = random.choice(templates)
        
        # Add contextual elements
        if analysis.get("mood") and random.random() < 0.3:
            mood_additions = {
                "calm": "So peaceful 💫",
                "energetic": "Energy is everything ⚡",
                "creative": "Creativity flowing 🎨",
                "natural": "Nature therapy 🌿"
            }
            if analysis["mood"] in mood_additions:
                base_caption += f" {mood_additions[analysis['mood']]}"
        
        return base_caption
    
    def _analyze_image_context(self, photo: Dict) -> Dict:
        """Analyze image for contextual information"""
        analysis = {
            "colors": [],
            "mood": "neutral",
            "setting": "unknown",
            "keywords": []
        }
        
        # Color analysis
        if photo.get("color"):
            dominant_color = photo["color"].lower()
            analysis["colors"].append(dominant_color)
            
            # Mood from colors
            if any(c in dominant_color for c in ["blue", "teal", "cyan"]):
                analysis["mood"] = "calm"
            elif any(c in dominant_color for c in ["red", "orange", "yellow"]):
                analysis["mood"] = "energetic"
            elif any(c in dominant_color for c in ["green", "lime"]):
                analysis["mood"] = "natural"
            elif any(c in dominant_color for c in ["purple", "pink"]):
                analysis["mood"] = "creative"
        
        # Text analysis
        description = photo.get("description", "").lower()
        alt_description = photo.get("alt_description", "").lower()
        combined_text = f"{description} {alt_description}"
        
        # Setting detection
        if any(word in combined_text for word in ["city", "urban", "building", "street"]):
            analysis["setting"] = "urban"
        elif any(word in combined_text for word in ["nature", "forest", "mountain", "beach"]):
            analysis["setting"] = "nature"
        elif any(word in combined_text for word in ["water", "ocean", "sea", "lake"]):
            analysis["setting"] = "water"
        
        # Extract keywords
        analysis["keywords"] = [word for word in combined_text.split() 
                              if len(word) > 3 and word.isalpha()][:3]
        
        return analysis
    
    def _generate_contextual_hashtags(self, photo: Dict, topic: str, bot_profile: BotProfile) -> str:
        """Generate contextual hashtags based on all factors"""
        
        hashtags = []
        
        # Base topic hashtags
        topic_hashtags = {
            "nature": ["#nature", "#outdoors", "#naturalbeauty", "#peaceful"],
            "travel": ["#travel", "#wanderlust", "#adventure", "#explore"],
            "food": ["#food", "#foodie", "#delicious", "#culinary"],
            "art": ["#art", "#creative", "#artistic", "#inspiration"],
            "tech": ["#tech", "#innovation", "#digital", "#future"],
            "lifestyle": ["#lifestyle", "#vibes", "#mood", "#blessed"]
        }
        
        # Add topic-specific hashtags
        for key, tags in topic_hashtags.items():
            if key in topic.lower():
                hashtags.extend(random.sample(tags, min(3, len(tags))))
                break
        
        # Add personality hashtags
        personality_hashtags = {
            "photographer": ["#photography", "#photooftheday", "#capture"],
            "traveler": ["#travelgram", "#wanderer", "#journey"],
            "artist": ["#artistlife", "#creativity", "#design"],
            "lifestyle": ["#goodvibes", "#mindful", "#grateful"],
            "tech": ["#techlife", "#innovation", "#startup"],
            "foodie": ["#foodporn", "#yummy", "#chef"]
        }
        
        if bot_profile.personality_type in personality_hashtags:
            hashtags.extend(random.sample(
                personality_hashtags[bot_profile.personality_type], 
                min(2, len(personality_hashtags[bot_profile.personality_type]))
            ))
        
        # Add popular general hashtags
        popular_tags = ["#instagood", "#beautiful", "#amazing", "#love", "#life"]
        hashtags.extend(random.sample(popular_tags, 2))
        
        # Remove duplicates and limit
        unique_hashtags = list(dict.fromkeys(hashtags))
        selected_hashtags = unique_hashtags[:random.randint(5, 8)]
        
        return " ".join(selected_hashtags)
    
    async def _select_optimal_topic(self, bot_profile: BotProfile) -> str:
        """Select optimal topic based on bot personality and time"""
        
        # Get trending topics
        topics = await self.unsplash_service.get_trending_topics()
        
        # Personality preferences
        personality_preferences = {
            "photographer": ["photography", "art", "nature", "urban", "portrait"],
            "traveler": ["travel", "adventure", "culture", "landscape", "city"],
            "artist": ["art", "design", "creative", "abstract", "color"],
            "lifestyle": ["lifestyle", "wellness", "home", "fashion", "food"],
            "tech": ["technology", "innovation", "modern", "digital", "startup"],
            "foodie": ["food", "cooking", "restaurant", "coffee", "healthy"]
        }
        
        # Time-based preferences
        now = datetime.now(pytz.UTC)
        hour = now.hour
        
        time_preferences = []
        if 6 <= hour < 12:
            time_preferences = ["coffee", "morning", "sunrise", "breakfast"]
        elif 12 <= hour < 18:
            time_preferences = ["lunch", "work", "city", "business"]
        elif 18 <= hour < 22:
            time_preferences = ["dinner", "sunset", "evening", "lifestyle"]
        else:
            time_preferences = ["night", "urban", "lights", "mood"]
        
        # Combine preferences
        preferred_topics = personality_preferences.get(bot_profile.personality_type, [])
        preferred_topics.extend(time_preferences)
        
        # Find matching topics
        matching_topics = [topic for topic in topics 
                          if any(pref in topic.lower() for pref in preferred_topics)]
        
        if matching_topics and random.random() < 0.7:
            return random.choice(matching_topics)
        else:
            return random.choice(topics)
    
    def _bot_to_api_format(self, bot_profile: BotProfile) -> Dict:
        """Convert bot profile to API format"""
        return {
            "name": bot_profile.name,
            "username": bot_profile.username,
            "bio": bot_profile.bio,
            "avatar": bot_profile.avatar_style  # Include unique avatar URL
        }
