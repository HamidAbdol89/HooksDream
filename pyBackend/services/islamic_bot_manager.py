"""
Islamic Bot Manager
Manages the 5 Islamic bot accounts and their posting schedules
"""

import asyncio
import random
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from services.bot_accounts import get_islamic_bot_accounts, ISLAMIC_BOT_ACCOUNTS
from services.smart_content_generator import SmartContentGenerator
from services.hybrid_image_service import HybridImageService
from services.unsplash_service import UnsplashService
from services.bot_interaction_service import BotInteractionService
import requests
import os

class IslamicBotManager:
    def __init__(self):
        # Initialize Unsplash service first
        self.unsplash_service = UnsplashService()
        
        # Initialize hybrid image service with Unsplash
        self.image_service = HybridImageService(self.unsplash_service)
        
        # Initialize content generator
        self.content_generator = SmartContentGenerator(self.image_service)
        
        # Node.js backend URL
        self.backend_url = os.getenv('NODE_BACKEND_URL', 'http://localhost:3001')
        
        # Bot posting intervals (in minutes)
        self.posting_intervals = {
            'islamic_scholar': 45,      # Every 45 minutes - frequent wisdom
            'islamic_news': 90,         # Every 1.5 hours - news updates
            'islamic_lifestyle': 120,   # Every 2 hours - lifestyle content
            'islamic_historian': 180,   # Every 3 hours - historical content
            'islamic_motivational': 60  # Every hour - daily motivation
        }
        
        # Track last post times
        self.last_post_times = {}
        
    async def initialize_islamic_bots(self):
        """Initialize all 5 Islamic bot accounts in the system"""
        print("🕌 Initializing Islamic bot accounts...")
        
        success_count = 0
        for bot_account in ISLAMIC_BOT_ACCOUNTS:
            try:
                # Create bot user in Node.js backend
                await self._create_bot_user_in_backend(bot_account)
                success_count += 1
                print(f"✅ Initialized {bot_account['displayName']}")
                
            except Exception as e:
                print(f"❌ Failed to initialize {bot_account['displayName']}: {str(e)}")
        
        print(f"🎉 Successfully initialized {success_count}/5 Islamic bot accounts")
        return success_count == 5
    
    async def _create_bot_user_in_backend(self, bot_account: Dict):
        """Create bot user in Node.js backend if not exists"""
        try:
            # Check if bot already exists
            response = requests.get(f"{self.backend_url}/api/bot/stats")
            if response.status_code == 200:
                stats = response.json()
                existing_bots = [bot['username'] for bot in stats.get('stats', {}).get('bot_users', [])]
                
                if bot_account['username'] in existing_bots:
                    print(f"🔄 Bot {bot_account['username']} already exists")
                    return
            
            # Create a dummy post to trigger bot user creation
            dummy_post_data = {
                "content": f"Assalamu Alaikum! I'm {bot_account['displayName']}, ready to share beneficial content with the Ummah. 🕌✨",
                "images": [],
                "bot_metadata": {
                    "bot_user": {
                        "username": bot_account['username'],
                        "name": bot_account['displayName'],
                        "bio": bot_account['bio'],
                        "avatar": bot_account['avatar']
                    },
                    "topic": "introduction",
                    "photo_data": []
                },
                "post_type": "text_only",
                "mood": "welcoming",
                "time_context": "general",
                "events_referenced": []
            }
            
            response = requests.post(
                f"{self.backend_url}/api/bot/create-post",
                json=dummy_post_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 201:
                print(f"✅ Created bot user: {bot_account['username']}")
            else:
                print(f"⚠️ Backend response: {response.status_code} - {response.text}")
                
        except Exception as e:
            print(f"❌ Error creating bot user {bot_account['username']}: {str(e)}")
            raise
    
    async def run_islamic_bot_cycle(self):
        """Run one cycle of Islamic bot posting"""
        print("🕌 Starting Islamic bot posting cycle...")
        
        current_time = datetime.now()
        posts_created = 0
        
        for bot_account in ISLAMIC_BOT_ACCOUNTS:
            bot_type = bot_account['botType']
            bot_username = bot_account['username']
            
            # Check if it's time to post for this bot
            if self._should_bot_post(bot_username, bot_type, current_time):
                try:
                    print(f"📝 Generating post for {bot_account['displayName']}...")
                    
                    # Generate content using smart content generator
                    post_data = await self.content_generator.generate_smart_post_for_bot_account(bot_account)
                    
                    if post_data:
                        # Send to Node.js backend
                        success = await self._send_post_to_backend(post_data)
                        
                        if success:
                            posts_created += 1
                            self.last_post_times[bot_username] = current_time
                            print(f"✅ Posted for {bot_account['displayName']}")
                        else:
                            print(f"❌ Failed to send post for {bot_account['displayName']}")
                    else:
                        print(f"⚠️ No content generated for {bot_account['displayName']}")
                        
                except Exception as e:
                    print(f"❌ Error posting for {bot_account['displayName']}: {str(e)}")
            else:
                print(f"⏰ Not time yet for {bot_account['displayName']}")
        
        print(f"🎉 Islamic bot cycle complete: {posts_created} posts created")
        return posts_created
    
    def _should_bot_post(self, bot_username: str, bot_type: str, current_time: datetime) -> bool:
        """Check if bot should post based on its schedule"""
        
        # Get last post time
        last_post = self.last_post_times.get(bot_username)
        
        if not last_post:
            # First time posting - add some randomness
            return random.random() < 0.3  # 30% chance on first run
        
        # Calculate time since last post
        time_since_last = current_time - last_post
        interval_minutes = self.posting_intervals.get(bot_type, 120)
        
        # Add some randomness (±20% of interval)
        randomness = random.uniform(0.8, 1.2)
        adjusted_interval = interval_minutes * randomness
        
        return time_since_last.total_seconds() >= (adjusted_interval * 60)
    
    async def _send_post_to_backend(self, post_data: Dict) -> bool:
        """Send generated post to Node.js backend"""
        try:
            response = requests.post(
                f"{self.backend_url}/api/bot/create-post",
                json=post_data,
                headers={'Content-Type': 'application/json'},
                timeout=15
            )
            
            if response.status_code == 201:
                return True
            else:
                print(f"❌ Backend error: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Error sending to backend: {str(e)}")
            return False
    
    async def get_islamic_bot_stats(self) -> Dict:
        """Get statistics for Islamic bots"""
        try:
            response = requests.get(f"{self.backend_url}/api/bot/stats")
            if response.status_code == 200:
                return response.json()
            else:
                return {"error": f"Backend error: {response.status_code}"}
                
        except Exception as e:
            return {"error": f"Connection error: {str(e)}"}
    
    def get_bot_schedules(self) -> Dict:
        """Get posting schedules for all Islamic bots"""
        schedules = {}
        current_time = datetime.now()
        
        for bot_account in ISLAMIC_BOT_ACCOUNTS:
            bot_username = bot_account['username']
            bot_type = bot_account['botType']
            
            last_post = self.last_post_times.get(bot_username)
            interval_minutes = self.posting_intervals.get(bot_type, 120)
            
            if last_post:
                next_post = last_post + timedelta(minutes=interval_minutes)
                time_until_next = next_post - current_time
                
                schedules[bot_username] = {
                    'displayName': bot_account['displayName'],
                    'botType': bot_type,
                    'lastPost': last_post.isoformat(),
                    'nextPost': next_post.isoformat(),
                    'timeUntilNext': str(time_until_next),
                    'intervalMinutes': interval_minutes
                }
            else:
                schedules[bot_username] = {
                    'displayName': bot_account['displayName'],
                    'botType': bot_type,
                    'lastPost': None,
                    'nextPost': 'Ready to post',
                    'timeUntilNext': '0',
                    'intervalMinutes': interval_minutes
                }
        
        return schedules

# Global instance
islamic_bot_manager = IslamicBotManager()
