"""
AI Bot Manager - Dynamic Bot Creation & Management
Handles intelligent bot user creation, tracking, and content strategy
"""

import os
import random
import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import json
import uuid
from dataclasses import dataclass, field, asdict

@dataclass
class BotProfile:
    id: str
    name: str
    username: str
    personality_type: str  # Photographer, traveler, artist, lifestyle, tech, foodie
    bio: str
    avatar_style: str
    interests: List[str]
    posting_style: str
    created_at: datetime
    engagement_score: float = 0.0
    post_count: int = 0
    last_post_at: Optional[datetime] = None
    is_active: bool = True
    
    # GPT-enhanced personality traits
    writing_tone: str = field(default="friendly")
    content_focus: List[str] = field(default_factory=list)
    emoji_style: str = field(default="moderate")  # minimal, moderate, expressive
    hashtag_strategy: str = field(default="relevant")  # minimal, relevant, trending
    
    def __post_init__(self):
        if not self.content_focus:
            self.content_focus = self.interests[:3]  # Top 3 interests
    
    def to_dict(self) -> Dict:
        data = asdict(self)
        # Convert datetime to string for JSON serialization
        data['created_at'] = self.created_at.isoformat()
        data['last_post_at'] = self.last_post_at.isoformat() if self.last_post_at else None
        return data
    
    @classmethod
    def from_dict(cls, data: Dict) -> 'BotProfile':
        # Convert string back to datetime
        data['created_at'] = datetime.fromisoformat(data['created_at'])
        data['last_post_at'] = datetime.fromisoformat(data['last_post_at']) if data['last_post_at'] else None
        return cls(**data)

class AIBotManager:
    """Advanced AI Bot Management System"""
    
    def __init__(self):
        self.bots_file = "data/bot_profiles.json"
        self.bot_profiles: Dict[str, BotProfile] = {}
        self.personality_templates = self._load_personality_templates()
        self.name_pools = self._load_name_pools()
        self._ensure_data_directory()
        self._load_existing_bots()
    
    def _ensure_data_directory(self):
        """Ensure data directory exists"""
        os.makedirs("data", exist_ok=True)
    
    def _load_existing_bots(self):
        """Load existing bot profiles from file"""
        if os.path.exists(self.bots_file):
            try:
                with open(self.bots_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    for bot_id, bot_data in data.items():
                        self.bot_profiles[bot_id] = BotProfile.from_dict(bot_data)
                print(f"📂 Loaded {len(self.bot_profiles)} existing bot profiles")
            except Exception as e:
                print(f"⚠️ Error loading bot profiles: {e}")
    
    def _save_bot_profiles(self):
        """Save bot profiles to file"""
        try:
            data = {bot_id: bot.to_dict() for bot_id, bot in self.bot_profiles.items()}
            with open(self.bots_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"⚠️ Error saving bot profiles: {e}")
    
    def _load_personality_templates(self) -> Dict:
        """Load personality templates for bot creation"""
        return {
            "photographer": {
                "bio_templates": [
                    "Visual storyteller 📸 | Capturing life's beautiful moments ✨",
                    "Photography enthusiast 📷 | Light chaser 🌅 | Frame by frame 🎯",
                    "Street photographer 📸 | Urban explorer 🏙️ | Moment collector ✨",
                    "Nature photographer 🌿 | Wildlife lover 🦋 | Conservation advocate 🌍",
                    "Portrait artist 📸 | Human stories 👥 | Emotion capturer 💫"
                ],
                "specialties": ["portrait", "landscape", "street", "nature", "urban", "artistic"],
                "content_style": "artistic_visual"
            },
            "traveler": {
                "bio_templates": [
                    "World explorer ✈️ | Culture collector 🌍 | Adventure seeker 🗺️",
                    "Digital nomad 💻 | 50+ countries 🌎 | Living the dream ✨",
                    "Travel blogger ✈️ | Hidden gems finder 💎 | Wanderlust addict 🧳",
                    "Backpacker 🎒 | Solo traveler 🚶‍♀️ | Stories from the road 📖",
                    "Adventure photographer 📸 | Mountain lover ⛰️ | Off the beaten path 🥾"
                ],
                "specialties": ["adventure", "culture", "food", "nature", "urban", "backpacking"],
                "content_style": "adventure_lifestyle"
            },
            "artist": {
                "bio_templates": [
                    "Digital artist 🎨 | Creative soul ✨ | Color enthusiast 🌈",
                    "Graphic designer 💻 | Visual communicator 🎯 | Pixel perfectionist ✨",
                    "Illustrator ✏️ | Storyteller through art 📚 | Dream weaver 🌙",
                    "Creative director 🎨 | Brand storyteller 📱 | Design thinking 💡",
                    "Visual artist 🖼️ | Mixed media lover 🎭 | Inspiration seeker ✨"
                ],
                "specialties": ["digital", "illustration", "design", "abstract", "conceptual", "mixed_media"],
                "content_style": "creative_artistic"
            },
            "lifestyle": {
                "bio_templates": [
                    "Lifestyle blogger ✨ | Wellness advocate 🧘‍♀️ | Good vibes only 🌸",
                    "Mindful living 🌿 | Self-care queen 💆‍♀️ | Positive energy 💫",
                    "Life coach 💪 | Motivation speaker 🎯 | Dream chaser ✨",
                    "Wellness enthusiast 🌱 | Yoga lover 🧘‍♀️ | Balance seeker ⚖️",
                    "Minimalist 🤍 | Sustainable living 🌍 | Conscious choices 💚"
                ],
                "specialties": ["wellness", "mindfulness", "fitness", "nutrition", "sustainability", "minimalism"],
                "content_style": "inspirational_lifestyle"
            },
            "tech": {
                "bio_templates": [
                    "Tech innovator 💻 | Future builder 🚀 | Code poet ⚡",
                    "Software engineer 👨‍💻 | AI enthusiast 🤖 | Problem solver 🧩",
                    "Startup founder 🚀 | Tech entrepreneur 💡 | Innovation driver ⚡",
                    "UX designer 📱 | User advocate 👥 | Digital craftsman ✨",
                    "Data scientist 📊 | ML engineer 🤖 | Pattern finder 🔍"
                ],
                "specialties": ["ai", "software", "startup", "innovation", "design", "data"],
                "content_style": "tech_innovation"
            },
            "foodie": {
                "bio_templates": [
                    "Food explorer 🍜 | Flavor hunter 👨‍🍳 | Culinary adventurer 🌶️",
                    "Home chef 👩‍🍳 | Recipe creator 📝 | Taste maker 😋",
                    "Food photographer 📸 | Restaurant reviewer 🍽️ | Foodie life 🥘",
                    "Culinary student 🎓 | Cooking enthusiast 👨‍🍳 | Flavor experimenter 🧪",
                    "Food blogger 📱 | Local eats finder 🗺️ | Comfort food lover 🍕"
                ],
                "specialties": ["cooking", "baking", "restaurants", "street_food", "healthy", "comfort"],
                "content_style": "food_lifestyle"
            }
        }
    
    def _load_name_pools(self) -> Dict:
        """Load name pools for different cultures/regions"""
        return {
            "western": {
                "first_names": [
                    "Alex", "Jordan", "Casey", "Taylor", "Morgan", "Riley", "Avery", "Quinn",
                    "Blake", "Cameron", "Drew", "Emery", "Finley", "Harper", "Hayden", "Jamie",
                    "Kai", "Logan", "Marley", "Parker", "Reese", "River", "Sage", "Skylar"
                ],
                "last_names": [
                    "Chen", "Kim", "Rodriguez", "Johnson", "Williams", "Brown", "Davis", "Miller",
                    "Wilson", "Moore", "Taylor", "Anderson", "Thomas", "Jackson", "White", "Harris",
                    "Martin", "Thompson", "Garcia", "Martinez", "Robinson", "Clark", "Lewis", "Lee"
                ]
            },
            "creative": {
                "first_names": [
                    "Luna", "Nova", "Sage", "River", "Phoenix", "Indigo", "Orion", "Atlas",
                    "Iris", "Jade", "Onyx", "Ruby", "Violet", "Aspen", "Cedar", "Coral",
                    "Echo", "Fern", "Grove", "Haven", "Ivy", "Jasper", "Kai", "Lyra"
                ],
                "last_names": [
                    "Stone", "Rivers", "Woods", "Fields", "Brooks", "Cross", "Fox", "Wolf",
                    "Storm", "Rain", "Snow", "Moon", "Star", "Sun", "Sky", "Ocean",
                    "Forest", "Mountain", "Valley", "Creek", "Ridge", "Peak", "Grove", "Meadow"
                ]
            }
        }
    
    def should_create_new_bot(self) -> bool:
        """Determine if we should create a new bot"""
        active_bots = [bot for bot in self.bot_profiles.values() if bot.is_active]
        
        # Create new bot if:
        # 1. Less than 20 active bots
        # 2. Random chance (5% per hour)
        # 3. No posts in last 2 hours from any bot
        
        if len(active_bots) < 20:
            return True
        
        if random.random() < 0.05:  # 5% chance
            return True
        
        # Check if we need fresh content
        now = datetime.now()
        recent_posts = [bot for bot in active_bots 
                       if bot.last_post_at and (now - bot.last_post_at).total_seconds() < 7200]
        
        if len(recent_posts) < 3:
            return True
        
        return False
    
    def create_new_bot(self) -> BotProfile:
        """Create a new AI bot with unique personality"""
        
        # Select personality type
        personality_type = random.choice(list(self.personality_templates.keys()))
        template = self.personality_templates[personality_type]
        
        # Select name style
        name_style = random.choice(["western", "creative"])
        names = self.name_pools[name_style]
        
        # Generate unique name
        first_name = random.choice(names["first_names"])
        last_name = random.choice(names["last_names"])
        full_name = f"{first_name} {last_name}"
        
        # Generate username (ensure uniqueness)
        base_username = f"{first_name.lower()}_{last_name.lower()}"
        username = base_username
        counter = 1
        while any(bot.username == username for bot in self.bot_profiles.values()):
            username = f"{base_username}_{counter}"
            counter += 1
        
        # Select bio and specialty
        bio = random.choice(template["bio_templates"])
        specialty = random.choice(template["specialties"])
        
        # Create bot profile
        bot = BotProfile(
            id=str(uuid.uuid4()),
            username=username,
            name=full_name,
            bio=bio,
            specialty=specialty,
            personality_type=personality_type,
            avatar_style=self._select_avatar_style(personality_type),
            created_at=datetime.now(),
            engagement_score=random.uniform(0.1, 0.3)  # Start with low engagement
        )
        
        # Add to profiles and save
        self.bot_profiles[bot.id] = bot
        self._save_bot_profiles()
        
        print(f"🤖 Created new bot: {bot.name} (@{bot.username}) - {bot.personality_type}")
        return bot
    
    def _select_avatar_style(self, personality_type: str) -> str:
        """Generate unique avatar URL based on personality"""
        
        # Avatar generation services with different styles
        avatar_services = {
            "photographer": [
                "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
                "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face", 
                "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face",
                "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop&crop=face",
                "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&crop=face"
            ],
            "traveler": [
                "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face",
                "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face",
                "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face",
                "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=400&h=400&fit=crop&crop=face",
                "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop&crop=face"
            ],
            "artist": [
                "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop&crop=face",
                "https://images.unsplash.com/photo-1463453091185-61582044d556?w=400&h=400&fit=crop&crop=face",
                "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=400&h=400&fit=crop&crop=face",
                "https://images.unsplash.com/photo-1521119989659-a83eee488004?w=400&h=400&fit=crop&crop=face",
                "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=400&h=400&fit=crop&crop=face"
            ],
            "lifestyle": [
                "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=400&fit=crop&crop=face",
                "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=400&fit=crop&crop=face",
                "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=400&h=400&fit=crop&crop=face",
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=face",
                "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=400&fit=crop&crop=face"
            ],
            "tech": [
                "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop&crop=face",
                "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&crop=face",
                "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=400&fit=crop&crop=face",
                "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=400&h=400&fit=crop&crop=face",
                "https://images.unsplash.com/photo-1566492031773-4f4e44671d66?w=400&h=400&fit=crop&crop=face"
            ],
            "foodie": [
                "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?w=400&h=400&fit=crop&crop=face",
                "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=400&h=400&fit=crop&crop=face",
                "https://images.unsplash.com/photo-1559548331-f9cb98001426?w=400&h=400&fit=crop&crop=face",
                "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=400&h=400&fit=crop&crop=face",
                "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop&crop=face"
            ]
        }
        
        # Get available avatars for personality type
        available_avatars = avatar_services.get(personality_type, avatar_services["lifestyle"])
        
        # Check which avatars are already used
        used_avatars = {bot.avatar_style for bot in self.bot_profiles.values() 
                       if hasattr(bot, 'avatar_style') and bot.avatar_style}
        
        # Find unused avatars
        unused_avatars = [avatar for avatar in available_avatars if avatar not in used_avatars]
        
        # If all avatars used, generate dynamic avatar
        if not unused_avatars:
            return self._generate_dynamic_avatar(personality_type)
        
        return random.choice(unused_avatars)
    
    def _generate_dynamic_avatar(self, personality_type: str) -> str:
        """Generate dynamic avatar when all predefined ones are used"""
        
        # Use avatar generation services with random seeds
        avatar_generators = [
            # Diverse avatar generation services
            f"https://images.unsplash.com/photo-{random.randint(1500000000000, 1700000000000)}?w=400&h=400&fit=crop&crop=face",
            f"https://api.dicebear.com/7.x/avataaars/svg?seed={uuid.uuid4().hex[:8]}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf",
            f"https://api.dicebear.com/7.x/personas/svg?seed={uuid.uuid4().hex[:8]}&backgroundColor=b6e3f4,c0aede,d1d4f9",
            f"https://api.dicebear.com/7.x/adventurer/svg?seed={uuid.uuid4().hex[:8]}&backgroundColor=b6e3f4,c0aede,d1d4f9",
            f"https://api.dicebear.com/7.x/big-smile/svg?seed={uuid.uuid4().hex[:8]}&backgroundColor=b6e3f4,c0aede,d1d4f9"
        ]
        
        # Personality-specific avatar styles
        personality_styles = {
            "photographer": f"https://api.dicebear.com/7.x/avataaars/svg?seed={uuid.uuid4().hex[:8]}&accessories=eyepatch,wayfarers,sunglasses&backgroundColor=b6e3f4",
            "traveler": f"https://api.dicebear.com/7.x/adventurer/svg?seed={uuid.uuid4().hex[:8]}&backgroundColor=c0aede,d1d4f9",
            "artist": f"https://api.dicebear.com/7.x/personas/svg?seed={uuid.uuid4().hex[:8]}&backgroundColor=ffd5dc,ffdfbf",
            "lifestyle": f"https://api.dicebear.com/7.x/big-smile/svg?seed={uuid.uuid4().hex[:8]}&backgroundColor=b6e3f4,c0aede",
            "tech": f"https://api.dicebear.com/7.x/avataaars/svg?seed={uuid.uuid4().hex[:8]}&accessories=prescription02,prescription01&backgroundColor=d1d4f9",
            "foodie": f"https://api.dicebear.com/7.x/big-smile/svg?seed={uuid.uuid4().hex[:8]}&backgroundColor=ffdfbf,ffd5dc"
        }
        
        # Return personality-specific or random generator
        if personality_type in personality_styles:
            return personality_styles[personality_type]
        else:
            return random.choice(avatar_generators)
    
    def get_active_bots(self) -> List[BotProfile]:
        """Get list of active bot profiles"""
        return [bot for bot in self.bot_profiles.values() if bot.is_active]
    
    def select_bot_for_posting(self, topic: str = None) -> Optional[BotProfile]:
        """Select best bot for posting based on topic and activity"""
        active_bots = self.get_active_bots()
        
        if not active_bots:
            return self.create_new_bot()
        
        # Score bots based on relevance and activity
        bot_scores = {}
        now = datetime.now()
        
        for bot in active_bots:
            score = 1.0
            
            # Topic relevance scoring
            if topic:
                if bot.specialty.lower() in topic.lower():
                    score += 2.0
                if bot.personality_type.lower() in topic.lower():
                    score += 1.5
            
            # Activity scoring (prefer less active bots)
            if bot.last_post_at:
                hours_since_post = (now - bot.last_post_at).total_seconds() / 3600
                if hours_since_post > 24:
                    score += 2.0  # Haven't posted in a day
                elif hours_since_post > 12:
                    score += 1.0  # Haven't posted in 12 hours
                elif hours_since_post < 2:
                    score -= 1.0  # Posted recently
            else:
                score += 3.0  # Never posted
            
            # Engagement scoring
            score += bot.engagement_score
            
            bot_scores[bot.id] = score
        
        # Select bot with highest score (with some randomness)
        if random.random() < 0.8:  # 80% chance to pick best
            best_bot_id = max(bot_scores.keys(), key=lambda x: bot_scores[x])
            return self.bot_profiles[best_bot_id]
        else:  # 20% chance for random selection
            return random.choice(active_bots)
    
    def update_bot_activity(self, bot_id: str, post_created: bool = True):
        """Update bot activity after posting"""
        if bot_id in self.bot_profiles:
            bot = self.bot_profiles[bot_id]
            if post_created:
                bot.last_post_at = datetime.now()
                bot.post_count += 1
                # Slightly increase engagement score
                bot.engagement_score = min(1.0, bot.engagement_score + 0.01)
            self._save_bot_profiles()
    
    def get_bot_for_api(self, bot_profile: BotProfile) -> Dict:
        """Convert bot profile to API format"""
        return {
            "name": bot_profile.name,
            "username": bot_profile.username,
            "bio": bot_profile.bio,
            "avatar": bot_profile.avatar_style  # Include unique avatar URL
        }
    
    def cleanup_inactive_bots(self):
        """Remove inactive bots (optional maintenance)"""
        now = datetime.now()
        inactive_threshold = timedelta(days=30)
        
        inactive_bots = []
        for bot_id, bot in self.bot_profiles.items():
            if bot.last_post_at and (now - bot.last_post_at) > inactive_threshold:
                if bot.post_count < 5:  # Remove bots with very low activity
                    inactive_bots.append(bot_id)
        
        for bot_id in inactive_bots:
            del self.bot_profiles[bot_id]
            print(f"🗑️ Removed inactive bot: {bot_id}")
        
        if inactive_bots:
            self._save_bot_profiles()
    
    def get_stats(self) -> Dict:
        """Get bot manager statistics"""
        active_bots = self.get_active_bots()
        total_posts = sum(bot.post_count for bot in active_bots)
        avg_engagement = sum(bot.engagement_score for bot in active_bots) / len(active_bots) if active_bots else 0
        
        return {
            "total_bots": len(self.bot_profiles),
            "active_bots": len(active_bots),
            "total_posts": total_posts,
            "avg_engagement": round(avg_engagement, 3),
            "personality_distribution": self._get_personality_distribution()
        }
    
    def _get_personality_distribution(self) -> Dict:
        """Get distribution of personality types"""
        distribution = {}
        for bot in self.bot_profiles.values():
            personality = bot.personality_type
            distribution[personality] = distribution.get(personality, 0) + 1
        return distribution
