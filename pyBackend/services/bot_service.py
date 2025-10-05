"""
Bot Service for automated content generation
Creates posts with Unsplash images and sends to Node.js backend
"""
import asyncio
import random
import httpx
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
from services.unsplash_service import UnsplashService
from services.smart_content_generator import SmartContentGenerator
from services.bot_interaction_service import BotInteractionService
from config import settings

class BotService:
    def __init__(self, image_service):
        self.image_service = image_service  # HybridImageService
        self.node_backend_url = settings.NODE_BACKEND_URL
        self.is_running = False
        self.scheduler_task = None
        
        # Initialize services
        self.content_generator = SmartContentGenerator(image_service)
        self.interaction_service = BotInteractionService(self.node_backend_url)
    
    async def start_scheduler(self):
        """Start the automated posting scheduler"""
        if self.is_running:
            return
        
        self.is_running = True
        self.scheduler_task = asyncio.create_task(self._scheduler_loop())
        
        # Start interaction service
        asyncio.create_task(self.interaction_service.start_interaction_scheduler())
        
        print(f"🤖 Bot scheduler started - posting every {settings.BOT_INTERVAL_MINUTES} minutes")
        print(f"🤝 Bot interaction service started")
    
    async def stop_scheduler(self):
        """Stop the automated posting scheduler"""
        self.is_running = False
        if self.scheduler_task:
            self.scheduler_task.cancel()
            try:
                await self.scheduler_task
            except asyncio.CancelledError:
                pass
        print("🛑 Bot scheduler stopped")
    
    async def _scheduler_loop(self):
        """Smart scheduler loop with optimal timing"""
        while self.is_running:
            try:
                # Smart posting strategy
                should_post, reason = self._should_post_now()
                
                if should_post:
                    print(f"🎯 Optimal posting time detected: {reason}")
                    await self.create_automated_posts()
                else:
                    print(f"⏳ Waiting for better timing: {reason}")
                
                # Smart interval calculation
                sleep_time = self._calculate_smart_interval()
                
                print(f"🕐 Next check in {sleep_time//60} minutes...")
                await asyncio.sleep(sleep_time)
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"❌ Error in bot scheduler: {e}")
                await asyncio.sleep(60)  # Wait 1 minute before retry
    
    async def create_automated_posts(self) -> List[Dict]:
        """Create automated posts with smart time distribution"""
        try:
            # Get all bot accounts for smart scheduling
            all_bots = await self._get_all_bot_accounts()
            if not all_bots:
                print("⚠️ No bot accounts available")
                return []
            
            # Smart posting based on time and bot schedules
            current_hour = datetime.now().hour
            active_bots = self._get_active_bots_for_hour(all_bots, current_hour)
            
            if not active_bots:
                print(f"⏰ No bots scheduled to post at hour {current_hour}")
                return []
            
            # Limit posts per cycle to avoid spam (max 5 posts per 30min)
            max_posts = min(5, len(active_bots))
            selected_bots = random.sample(active_bots, min(max_posts, len(active_bots)))
            
            print(f"🤖 Creating posts with {len(selected_bots)} bot accounts at hour {current_hour}")
            
            created_posts = []
            
            for i, bot_account in enumerate(selected_bots):
                # Generate smart content for bot account
                post_data = await self.content_generator.generate_smart_post_for_bot_account(bot_account)
                
                if not post_data:
                    print(f"⚠️ Failed to generate content for {bot_account.get('displayName', 'Bot')}")
                    continue
                
                # Send to Node.js backend
                result = await self._send_post_to_backend(post_data)
                
                if result:
                    created_posts.append(result)
                    
                    image_count = len(post_data.get('images', []))
                    bot_name = bot_account.get('displayName', 'Bot')
                    print(f"✅ {bot_name}: {image_count} image(s) - {post_data['content'][:50]}...")
                else:
                    print(f"❌ Failed to create post for {bot_account.get('displayName', 'Bot')}")
                
                # Smart delay between posts (1-3 minutes)
                delay = random.randint(60, 180)
                print(f"⏱️ Waiting {delay} seconds before next post...")
                await asyncio.sleep(delay)
            
            # Print statistics
            print(f"🎉 Created {len(created_posts)} posts using bot accounts")
            
            # Cleanup old interaction history
            self.interaction_service.cleanup_old_interactions()
            
            return created_posts
            
        except Exception as e:
            print(f"❌ Error creating automated posts: {e}")
            return []
    
    async def create_single_post(self, topic: str = None) -> Optional[Dict]:
        """Create a single AI-powered post manually"""
        try:
            # Select or create bot
            bot_profile = self.bot_manager.select_bot_for_posting(topic)
            if not bot_profile:
                bot_profile = self.bot_manager.create_new_bot()
            
            # Generate smart content
            post_data = await self.content_generator.generate_smart_post(bot_profile, topic)
            
            if not post_data:
                print(f"⚠️ Failed to generate content for {bot_profile.name}")
                return None
            
            # Send to Node.js backend
            result = await self._send_post_to_backend(post_data)
            
            if result:
                self.bot_manager.update_bot_activity(bot_profile.id, True)
                image_count = len(post_data.get('images', []))
                print(f"✅ Manual post created by {bot_profile.name}: {image_count} image(s)")
                return result
            else:
                print(f"❌ Failed to create manual post for {bot_profile.name}")
                return None
                
        except Exception as e:
            print(f"❌ Error creating single post: {e}")
            return None
    
    async def _generate_post_content(self, photo: Dict, topic: str, bot_user: Dict) -> Dict:
        """Generate post content based on photo and topic"""
        
        # AI-powered smart caption generation based on image analysis
        return await self._generate_smart_caption(photo, topic, bot_user)
    
    def _generate_hashtags(self, topic: str, photo: Dict) -> str:
        """Generate natural, international hashtags"""
        
        # International hashtags that match Unsplash content
        topic_hashtags = {
            "nature": ["#nature", "#peaceful", "#green", "#beautiful", "#outdoors", "#natural"],
            "technology": ["#tech", "#innovation", "#future", "#digital", "#modern", "#gadgets"],
            "lifestyle": ["#lifestyle", "#happiness", "#chill", "#mood", "#vibes", "#blessed"],
            "travel": ["#travel", "#explore", "#wanderlust", "#adventure", "#memories", "#journey"],
            "art": ["#art", "#creative", "#inspiration", "#artistic", "#design", "#passion"],
            "food": ["#food", "#delicious", "#foodie", "#cooking", "#yummy", "#tasty"],
            "coffee": ["#coffee", "#caffeine", "#morning", "#coffeetime", "#relax", "#brew"],
            "architecture": ["#architecture", "#design", "#building", "#urban", "#modern", "#city"],
            "fashion": ["#fashion", "#style", "#outfit", "#trendy", "#ootd", "#chic"],
            "fitness": ["#fitness", "#healthy", "#workout", "#gym", "#active", "#wellness"],
            "business": ["#business", "#success", "#entrepreneur", "#professional", "#growth", "#hustle"],
            "minimal": ["#minimal", "#clean", "#simple", "#aesthetic", "#minimalism", "#white"]
        }
        
        # Get topic hashtags or create generic ones
        hashtags = topic_hashtags.get(topic, [f"#{topic}", "#beautiful", "#inspiration"])
        
        # Sometimes add generic popular hashtags
        popular_tags = ["#instagood", "#photooftheday", "#amazing", "#love", "#life", "#daily"]
        if random.random() < 0.5:  # 50% chance
            hashtags.extend(random.sample(popular_tags, 2))
        
        # Limit to 4-7 hashtags (Instagram style)
        num_tags = random.randint(4, 7)
        selected_hashtags = random.sample(hashtags, min(num_tags, len(hashtags)))
        return " ".join(selected_hashtags)
    
    async def _generate_smart_caption(self, photo: Dict, topic: str, bot_user: Dict) -> Dict:
        """AI-powered smart caption generation based on image analysis"""
        
        # Analyze image metadata for smart content generation
        image_analysis = self._analyze_image_metadata(photo)
        
        # Generate contextual caption based on bot personality
        caption = self._generate_contextual_caption(photo, topic, bot_user, image_analysis)
        
        # Add smart hashtags based on image content
        hashtags = self._generate_smart_hashtags(topic, photo, image_analysis)
        
        # Combine caption with hashtags
        full_content = caption
        if hashtags:
            full_content += f"\n\n{hashtags}"
        
        return {
            "content": full_content,
            "images": [photo["urls"]["regular"]],
            "bot_user": bot_user,
            "photo_data": photo,
            "topic": topic,
            "analysis": image_analysis
        }
    
    def _analyze_image_metadata(self, photo: Dict) -> Dict:
        """Analyze image metadata for smart content generation"""
        
        analysis = {
            "colors": [],
            "mood": "neutral",
            "time_of_day": "unknown",
            "setting": "unknown",
            "style": "unknown",
            "keywords": []
        }
        
        # Extract color information
        if photo.get("color"):
            dominant_color = photo["color"].lower()
            analysis["colors"].append(dominant_color)
            
            # Determine mood from colors
            if dominant_color in ["#ff", "#red", "#orange"]:
                analysis["mood"] = "energetic"
            elif dominant_color in ["#blue", "#teal", "#cyan"]:
                analysis["mood"] = "calm"
            elif dominant_color in ["#green", "#lime"]:
                analysis["mood"] = "natural"
            elif dominant_color in ["#purple", "#pink"]:
                analysis["mood"] = "creative"
        
        # Analyze description and alt text for context
        description = photo.get("description", "").lower()
        alt_description = photo.get("alt_description", "").lower()
        combined_text = f"{description} {alt_description}"
        
        # Detect time of day
        time_keywords = {
            "morning": ["sunrise", "dawn", "morning", "early"],
            "afternoon": ["noon", "afternoon", "midday", "bright"],
            "evening": ["sunset", "dusk", "evening", "golden hour"],
            "night": ["night", "dark", "stars", "moon", "lights"]
        }
        
        for time_period, keywords in time_keywords.items():
            if any(keyword in combined_text for keyword in keywords):
                analysis["time_of_day"] = time_period
                break
        
        # Detect setting/location
        setting_keywords = {
            "urban": ["city", "building", "street", "urban", "downtown"],
            "nature": ["forest", "mountain", "beach", "lake", "tree", "outdoor"],
            "indoor": ["room", "interior", "inside", "home", "office"],
            "water": ["ocean", "sea", "river", "water", "beach", "lake"]
        }
        
        for setting_type, keywords in setting_keywords.items():
            if any(keyword in combined_text for keyword in keywords):
                analysis["setting"] = setting_type
                break
        
        # Extract relevant keywords
        analysis["keywords"] = [word for word in combined_text.split() 
                              if len(word) > 3 and word.isalpha()][:5]
        
        return analysis
    
    def _generate_contextual_caption(self, photo: Dict, topic: str, bot_user: Dict, analysis: Dict) -> str:
        """Generate contextual caption based on bot personality and image analysis"""
        
        # Bot personality templates
        personality_templates = {
            "alexchen_photo": {
                "style": "photographer",
                "tone": "artistic",
                "templates": [
                    "Caught this moment and had to share 📸",
                    "The light was just perfect for this shot ✨",
                    "Sometimes you just have to stop and capture the beauty 🌟",
                    "This composition spoke to me 📷",
                    "When the scene is this good, the camera does the work 🎯"
                ]
            },
            "maya_wanderlust": {
                "style": "traveler",
                "tone": "adventurous", 
                "templates": [
                    "Another day, another adventure! 🌍",
                    "This place just took my breath away ✈️",
                    "Travel days are the best days 🗺️",
                    "Found this hidden gem today 💎",
                    "Wanderlust mode: always activated 🧳"
                ]
            },
            "jordan_creates": {
                "style": "artist",
                "tone": "creative",
                "templates": [
                    "Inspiration strikes in the most unexpected places 🎨",
                    "Colors and creativity everywhere I look ✨",
                    "Art is all around us, just gotta see it 👁️",
                    "This sparked something creative in me 💡",
                    "When reality becomes art 🖼️"
                ]
            },
            "sophie_lifestyle": {
                "style": "lifestyle",
                "tone": "positive",
                "templates": [
                    "Living my best life, one moment at a time ✨",
                    "Good vibes only today 🌸",
                    "This is what happiness looks like 💕",
                    "Grateful for moments like these 🙏",
                    "Life is beautiful when you pay attention 🌺"
                ]
            },
            "ryan_tech": {
                "style": "tech",
                "tone": "innovative",
                "templates": [
                    "The future is happening right now 🚀",
                    "Innovation meets beauty 💻",
                    "Tech and aesthetics in perfect harmony ⚡",
                    "This is what progress looks like 🔮",
                    "Building tomorrow, one pixel at a time 🌐"
                ]
            }
        }
        
        # Get bot personality
        bot_personality = personality_templates.get(
            bot_user["username"], 
            personality_templates["alexchen_photo"]
        )
        
        # Select base template
        base_caption = random.choice(bot_personality["templates"])
        
        # Add contextual elements based on analysis
        contextual_additions = []
        
        # Add time-based context
        if analysis["time_of_day"] == "morning":
            contextual_additions.append("Perfect way to start the day")
        elif analysis["time_of_day"] == "evening":
            contextual_additions.append("Golden hour magic")
        elif analysis["time_of_day"] == "night":
            contextual_additions.append("Night vibes hit different")
        
        # Add mood-based context
        if analysis["mood"] == "calm":
            contextual_additions.append("So peaceful")
        elif analysis["mood"] == "energetic":
            contextual_additions.append("Energy is everything")
        elif analysis["mood"] == "creative":
            contextual_additions.append("Creativity flowing")
        
        # Add setting context
        if analysis["setting"] == "nature":
            contextual_additions.append("Nature therapy")
        elif analysis["setting"] == "urban":
            contextual_additions.append("City life")
        elif analysis["setting"] == "water":
            contextual_additions.append("Water always calms the soul")
        
        # Sometimes add contextual element
        if contextual_additions and random.random() < 0.4:
            addition = random.choice(contextual_additions)
            base_caption += f" {addition} 💫"
        
        # Sometimes add photo description naturally
        if photo.get("description") and random.random() < 0.2:
            base_caption += f"\n\n{photo['description']} 📸"
        
        return base_caption
    
    def _generate_smart_hashtags(self, topic: str, photo: Dict, analysis: Dict) -> str:
        """Generate smart hashtags based on image analysis"""
        
        # Base topic hashtags
        base_hashtags = self._generate_hashtags(topic, photo).split()
        
        # Smart contextual hashtags
        contextual_hashtags = []
        
        # Add mood-based hashtags
        mood_hashtags = {
            "calm": ["#peaceful", "#serene", "#tranquil"],
            "energetic": ["#vibrant", "#dynamic", "#bold"],
            "creative": ["#artistic", "#inspiring", "#imaginative"],
            "natural": ["#organic", "#pure", "#authentic"]
        }
        
        if analysis["mood"] in mood_hashtags:
            contextual_hashtags.extend(mood_hashtags[analysis["mood"]])
        
        # Add time-based hashtags
        time_hashtags = {
            "morning": ["#sunrise", "#morningvibes", "#newday"],
            "evening": ["#sunset", "#goldenhour", "#eveninglight"],
            "night": ["#nighttime", "#afterdark", "#nightvibes"]
        }
        
        if analysis["time_of_day"] in time_hashtags:
            contextual_hashtags.extend(time_hashtags[analysis["time_of_day"]])
        
        # Add setting hashtags
        setting_hashtags = {
            "urban": ["#citylife", "#urban", "#metropolitan"],
            "nature": ["#outdoors", "#wilderness", "#naturalbeauty"],
            "water": ["#waterscape", "#reflection", "#aquatic"]
        }
        
        if analysis["setting"] in setting_hashtags:
            contextual_hashtags.extend(setting_hashtags[analysis["setting"]])
        
        # Combine and limit hashtags
        all_hashtags = base_hashtags + contextual_hashtags
        
        # Remove duplicates and limit to 6-8 hashtags
        unique_hashtags = list(dict.fromkeys(all_hashtags))
        selected_hashtags = unique_hashtags[:random.randint(5, 7)]
        
        return " ".join(selected_hashtags)
    
    def _should_post_now(self) -> tuple[bool, str]:
        """Determine if now is an optimal time to post (simplified for testing)"""
        from datetime import datetime
        import pytz
        
        # SIMPLIFIED LOGIC FOR TESTING - Always allow posting
        utc_now = datetime.now(pytz.UTC)
        
        # Only avoid very late hours (2-5 AM UTC)
        if 2 <= utc_now.hour <= 5:
            return False, f"Very late hours (current: {utc_now.hour}:00 UTC)"
        
        # Allow posting most of the time for testing
        return True, f"Active posting time (current: {utc_now.hour}:00 UTC)"
    
    def _calculate_smart_interval(self) -> int:
        """Calculate smart interval (simplified for testing)"""
        # SIMPLIFIED FOR TESTING - Use config interval
        base_interval = settings.BOT_INTERVAL_MINUTES * 60  # Convert to seconds
        
        # Add small randomness (±2 minutes)
        random_offset = random.randint(-120, 120)
        
        return max(300, base_interval + random_offset)  # Minimum 5 minutes
    
    def _select_smart_topic(self, topics: List[str]) -> str:
        """Smart topic selection based on time and trends"""
        from datetime import datetime
        import pytz
        
        utc_now = datetime.now(pytz.UTC)
        hour = utc_now.hour
        day_of_week = utc_now.weekday()  # 0=Monday, 6=Sunday
        
        # Time-based topic preferences
        time_preferences = {
            # Morning topics (6-11 AM UTC)
            "morning": ["coffee", "sunrise", "morning", "breakfast", "workout", "nature"],
            # Lunch topics (11 AM - 2 PM UTC) 
            "lunch": ["food", "lifestyle", "work", "office", "city", "business"],
            # Afternoon topics (2-6 PM UTC)
            "afternoon": ["technology", "art", "design", "creativity", "innovation"],
            # Evening topics (6-10 PM UTC)
            "evening": ["travel", "sunset", "architecture", "culture", "photography"],
            # Night topics (10 PM - 2 AM UTC)
            "night": ["night", "lights", "urban", "music", "entertainment", "mood"]
        }
        
        # Weekend vs weekday preferences
        weekend_boost = ["travel", "nature", "adventure", "leisure", "fun", "weekend"]
        weekday_boost = ["business", "technology", "work", "productivity", "innovation"]
        
        # Determine current time period
        if 6 <= hour < 11:
            period = "morning"
        elif 11 <= hour < 14:
            period = "lunch"
        elif 14 <= hour < 18:
            period = "afternoon"
        elif 18 <= hour < 22:
            period = "evening"
        else:
            period = "night"
        
        # Get preferred topics for current time
        preferred_topics = time_preferences.get(period, [])
        
        # Add weekend/weekday boost
        if day_of_week >= 5:  # Weekend
            preferred_topics.extend(weekend_boost)
        else:  # Weekday
            preferred_topics.extend(weekday_boost)
        
        # Find matching topics from available list
        matching_topics = [topic for topic in topics if any(pref in topic.lower() for pref in preferred_topics)]
        
        # If we have matching topics, prefer them (70% chance)
        if matching_topics and random.random() < 0.7:
            return random.choice(matching_topics)
        
        # Otherwise, random selection
        return random.choice(topics)
    
    def _select_smart_bot_user(self, topic: str) -> Dict:
        """Select bot user based on their expertise and topic"""
        
        # Bot expertise mapping
        bot_expertise = {
            "alexchen_photo": ["photography", "art", "visual", "creative", "aesthetic", "composition"],
            "maya_wanderlust": ["travel", "adventure", "culture", "exploration", "journey", "wanderlust"],
            "jordan_creates": ["art", "design", "creative", "innovation", "artistic", "inspiration"],
            "sophie_lifestyle": ["lifestyle", "wellness", "happiness", "mood", "positive", "life"],
            "ryan_tech": ["technology", "innovation", "future", "digital", "tech", "modern"]
        }
        
        # Calculate expertise scores for each bot
        bot_scores = {}
        for bot in self.bot_users:
            username = bot["username"]
            expertise_keywords = bot_expertise.get(username, [])
            
            # Calculate relevance score
            score = 0
            topic_lower = topic.lower()
            
            for keyword in expertise_keywords:
                if keyword in topic_lower:
                    score += 2  # Direct match
                elif any(word in keyword for word in topic_lower.split()):
                    score += 1  # Partial match
            
            bot_scores[username] = score
        
        # Find bots with highest scores
        max_score = max(bot_scores.values()) if bot_scores else 0
        
        if max_score > 0:
            # Select from top-scoring bots (80% chance)
            if random.random() < 0.8:
                top_bots = [bot for bot in self.bot_users 
                           if bot_scores.get(bot["username"], 0) == max_score]
                return random.choice(top_bots)
        
        # Random selection (20% chance or no expertise match)
        return random.choice(self.bot_users)
    
    def _get_color_name(self, hex_color: str) -> Optional[str]:
        """Convert hex color to color name for hashtags"""
        color_map = {
            "#000000": "black", "#FFFFFF": "white", "#FF0000": "red",
            "#00FF00": "green", "#0000FF": "blue", "#FFFF00": "yellow",
            "#FF00FF": "magenta", "#00FFFF": "cyan", "#FFA500": "orange",
            "#800080": "purple", "#FFC0CB": "pink", "#A52A2A": "brown",
            "#808080": "gray", "#C0C0C0": "silver", "#FFD700": "gold"
        }
        
        # Simple color matching (could be improved with color distance calculation)
        return color_map.get(hex_color.upper())
    
    async def _send_post_to_backend(self, post_data: Dict) -> Optional[Dict]:
        """Send generated post to Node.js backend using real user"""
        try:
            # Extract bot account from post_data
            bot_account = post_data.get("bot_account")
            if not bot_account:
                print("❌ No bot account data in post_data")
                return None
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.node_backend_url}/api/bot/create-post",  # Use bot-specific endpoint
                    json=post_data,  # Send the entire post_data as formatted by smart_content_generator
                    headers={
                        "Content-Type": "application/json"
                    }
                )
                
                response.raise_for_status()
                return response.json()
                
        except Exception as e:
            print(f"❌ Error sending post to backend: {e}")
            return None
    
    async def _get_all_bot_accounts(self) -> List[Dict]:
        """Get all bot accounts from Node.js backend"""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{self.node_backend_url}/api/users?isBot=true&limit=50",
                    headers={"Content-Type": "application/json"}
                )
                
                if response.status_code == 200:
                    result = response.json()
                    if result.get('success') and result.get('data'):
                        bot_accounts = result['data']
                        print(f"🤖 Found {len(bot_accounts)} bot accounts")
                        return bot_accounts
                    else:
                        print(f"⚠️ No bot accounts found, using fallback")
                        return self._get_fallback_bot_accounts()
                else:
                    print(f"⚠️ Failed to get bot accounts: {response.status_code}, using fallback")
                    return self._get_fallback_bot_accounts()
                    
        except Exception as e:
            print(f"❌ Error getting bot accounts: {e}, using fallback")
            return self._get_fallback_bot_accounts()
    
    def _get_fallback_bot_accounts(self) -> List[Dict]:
        """Fallback bot accounts if backend is unavailable"""
        return [
            {
                "_id": "bot_sarah_chen",
                "username": "sarah_chen_ai",
                "displayName": "Sarah Chen",
                "bio": "Software Engineer passionate about AI",
                "botType": "tech",
                "interests": ["technology", "coding", "innovation"],
                "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah"
            },
            {
                "_id": "bot_james_photo",
                "username": "james_photographer",
                "displayName": "James Thompson",
                "bio": "Professional Photographer capturing life's moments",
                "botType": "photographer", 
                "interests": ["photography", "art", "travel"],
                "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=james"
            },
            {
                "_id": "bot_maya_lifestyle",
                "username": "maya_wellness",
                "displayName": "Maya Patel",
                "bio": "Wellness coach and mindfulness advocate",
                "botType": "lifestyle",
                "interests": ["wellness", "mindfulness", "health"],
                "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=maya"
            },
            {
                "_id": "bot_ahmed_ai",
                "username": "ahmed_hassan_ai",
                "displayName": "Ahmed Hassan",
                "bio": "AI Researcher passionate about machine learning",
                "botType": "tech",
                "interests": ["artificial intelligence", "research", "ethics"],
                "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=ahmed"
            },
            {
                "_id": "bot_halima_community",
                "username": "halima_said_community",
                "displayName": "Halima Said",
                "bio": "Community leader and social advocate",
                "botType": "lifestyle",
                "interests": ["community", "leadership", "social justice"],
                "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=halima"
            }
        ]
    
    def _get_active_bots_for_hour(self, all_bots: List[Dict], current_hour: int) -> List[Dict]:
        """Get bots that should be active at the current hour"""
        active_bots = []
        
        # Default active hours (peak social media times)
        default_hours = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]
        
        for bot in all_bots:
            # Get bot's preferred posting hours (fallback to default if not set)
            schedule = bot.get('schedule', {})
            preferred_hours = schedule.get('preferredHours', default_hours)
            
            # Check if current hour is in bot's preferred hours
            if current_hour in preferred_hours:
                # Additional randomness - bot might not post every preferred hour
                personality = bot.get('personality', {})
                activity_level = personality.get('activityLevel', 0.7)  # Higher default for more posts
                
                if random.random() < activity_level:
                    active_bots.append(bot)
                    print(f"🤖 {bot.get('displayName', 'Bot')} is active at hour {current_hour}")
        
        print(f"📊 {len(active_bots)}/{len(all_bots)} bots active at hour {current_hour}")
        return active_bots
    
    def _calculate_smart_interval(self) -> int:
        """Calculate smart interval between checks"""
        # For testing, use shorter intervals
        base_interval = settings.BOT_INTERVAL_MINUTES * 60  # Convert to seconds
        
        # Add some randomness (±20%)
        variation = int(base_interval * 0.2)
        return base_interval + random.randint(-variation, variation)
