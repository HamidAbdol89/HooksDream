"""
Smart Bot Interaction Service
Handles bot-to-bot and bot-to-user interactions with natural behavior patterns
"""

import asyncio
import random
import httpx
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from config import settings

class BotInteractionService:
    def __init__(self, node_backend_url: str):
        self.node_backend_url = node_backend_url
        self.interaction_history = {}  # Track interactions to avoid spam
        
    async def start_interaction_scheduler(self):
        """Start the bot interaction scheduler"""
        print("🤖 Starting bot interaction scheduler...")
        
        while True:
            try:
                # Run interactions every 15-30 minutes
                await self.perform_smart_interactions()
                
                # Random delay between 15-30 minutes
                delay = random.randint(900, 1800)  # 15-30 minutes
                print(f"⏱️ Next interaction cycle in {delay//60} minutes...")
                await asyncio.sleep(delay)
                
            except Exception as e:
                print(f"❌ Error in interaction scheduler: {e}")
                await asyncio.sleep(300)  # Wait 5 minutes on error
    
    async def perform_smart_interactions(self):
        """Perform intelligent bot interactions"""
        try:
            # Get all bot accounts
            bot_accounts = await self._get_all_bot_accounts()
            if len(bot_accounts) < 2:
                print("⚠️ Need at least 2 bot accounts for interactions")
                return
            
            # Get recent posts for interaction
            recent_posts = await self._get_recent_posts(limit=20)
            if not recent_posts:
                print("⚠️ No recent posts found for interaction")
                return
            
            interactions_performed = 0
            
            # Perform different types of interactions
            for bot in bot_accounts:
                if random.random() < bot.get('schedule', {}).get('interactionRate', 0.2):
                    # This bot will perform interactions this cycle
                    
                    # 1. Like posts (most common)
                    if random.random() < 0.7:
                        await self._bot_like_posts(bot, recent_posts)
                        interactions_performed += 1
                    
                    # 2. Follow other bots or users (less common)
                    if random.random() < 0.3:
                        await self._bot_follow_users(bot, bot_accounts)
                        interactions_performed += 1
                    
                    # 3. Comment on posts (least common, most valuable)
                    if random.random() < 0.2:
                        await self._bot_comment_on_posts(bot, recent_posts)
                        interactions_performed += 1
                    
                    # Small delay between bot actions
                    await asyncio.sleep(random.randint(2, 8))
            
            print(f"✅ Performed {interactions_performed} bot interactions")
            
        except Exception as e:
            print(f"❌ Error performing interactions: {e}")
    
    async def _bot_like_posts(self, bot: Dict, posts: List[Dict]):
        """Bot likes posts intelligently"""
        try:
            # Select 1-3 posts to like based on bot personality
            posts_to_like = self._select_posts_for_bot(bot, posts, max_count=3)
            
            for post in posts_to_like:
                # Check if already liked this post
                interaction_key = f"{bot['_id']}_like_{post['_id']}"
                if interaction_key in self.interaction_history:
                    continue
                
                # Perform like action
                success = await self._perform_like_action(bot['_id'], post['_id'])
                if success:
                    self.interaction_history[interaction_key] = datetime.now()
                    print(f"👍 {bot['displayName']} liked post by {post.get('author', {}).get('displayName', 'Unknown')}")
                
                # Natural delay between likes
                await asyncio.sleep(random.randint(3, 10))
                
        except Exception as e:
            print(f"❌ Error in bot like action: {e}")
    
    async def _bot_follow_users(self, bot: Dict, all_bots: List[Dict]):
        """Bot follows other bots or real users"""
        try:
            # Get bot's current following list
            following = await self._get_bot_following(bot['_id'])
            following_ids = [f['_id'] for f in following] if following else []
            
            # Don't follow if already following too many (max 100)
            if len(following_ids) >= 100:
                return
            
            # ONLY follow other bots - NO real users
            # Follow other bots only
            available_bots = [b for b in all_bots if b['_id'] != bot['_id'] and b['_id'] not in following_ids]
            if available_bots:
                target_bot = random.choice(available_bots)
                success = await self._perform_follow_action(bot['_id'], target_bot['_id'])
                if success:
                    print(f"👥 {bot['displayName']} followed {target_bot['displayName']}")
            
            # NOTE: Removed real user following to respect privacy
                            
        except Exception as e:
            print(f"❌ Error in bot follow action: {e}")
    
    async def _bot_comment_on_posts(self, bot: Dict, posts: List[Dict]):
        """Bot comments on posts with intelligent responses"""
        try:
            # Select 1 post to comment on (comments are more valuable, less frequent)
            posts_to_comment = self._select_posts_for_bot(bot, posts, max_count=1)
            
            for post in posts_to_comment:
                # Check if already commented on this post
                interaction_key = f"{bot['_id']}_comment_{post['_id']}"
                if interaction_key in self.interaction_history:
                    continue
                
                # Generate intelligent comment based on bot type and post content
                comment_text = self._generate_smart_comment(bot, post)
                if not comment_text:
                    continue
                
                # Perform comment action
                success = await self._perform_comment_action(bot['_id'], post['_id'], comment_text)
                if success:
                    self.interaction_history[interaction_key] = datetime.now()
                    print(f"💬 {bot['displayName']} commented: '{comment_text[:50]}...'")
                
        except Exception as e:
            print(f"❌ Error in bot comment action: {e}")
    
    def _select_posts_for_bot(self, bot: Dict, posts: List[Dict], max_count: int = 3) -> List[Dict]:
        """Select posts that match bot's interests and personality"""
        bot_type = bot.get('botType', 'lifestyle')
        personality = bot.get('personality', {})
        
        # Topic preferences by bot type
        topic_preferences = {
            'photographer': ['photography', 'art', 'nature', 'travel'],
            'traveler': ['travel', 'adventure', 'nature', 'photography'],
            'tech': ['technology', 'innovation', 'future', 'digital'],
            'lifestyle': ['wellness', 'life', 'inspiration', 'mindfulness'],
            'nature': ['nature', 'environment', 'wildlife', 'conservation'],
            'artist': ['art', 'creativity', 'design', 'inspiration']
        }
        
        preferred_topics = topic_preferences.get(bot_type, ['general'])
        
        # Score posts based on relevance to bot
        scored_posts = []
        for post in posts:
            score = 0
            content = (post.get('content', '') + ' ' + post.get('topic', '')).lower()
            
            # Topic relevance scoring
            for topic in preferred_topics:
                if topic in content:
                    score += 2
            
            # ONLY interact with bot posts - avoid real user posts
            author = post.get('author', {})
            if author.get('_id') == bot['_id']:
                score = 0  # Don't interact with own posts
            elif not author.get('isBot', False):
                score = 0  # Don't interact with real user posts - PRIVACY PROTECTION
            
            # Personality-based scoring
            if personality.get('socialness', 0.5) > 0.6:
                score += 1  # More social bots interact more
            
            if score > 0:
                scored_posts.append((post, score))
        
        # Sort by score and select top posts
        scored_posts.sort(key=lambda x: x[1], reverse=True)
        selected_posts = [post for post, score in scored_posts[:max_count]]
        
        return selected_posts
    
    def _generate_smart_comment(self, bot: Dict, post: Dict) -> Optional[str]:
        """Generate intelligent comments based on bot personality and post content"""
        bot_type = bot.get('botType', 'lifestyle')
        
        # Comment templates by bot type
        comment_templates = {
            'photographer': [
                "Amazing composition! 📸✨",
                "The lighting in this shot is perfect! 🌟",
                "Great capture! Love the perspective 📷",
                "Beautiful moment frozen in time! ✨",
                "This speaks to my photographer's soul 📸💫"
            ],
            'traveler': [
                "This place looks incredible! Adding to my bucket list ✈️",
                "Wanderlust activated! 🌍✨",
                "What an amazing adventure! 🗺️",
                "Travel goals right here! 🎒",
                "The world is so beautiful! 🌟"
            ],
            'tech': [
                "Innovation at its finest! 💻🚀",
                "The future is here! ⚡",
                "Technology meets creativity! 🤖✨",
                "This is next-level thinking! 💡",
                "Digital transformation in action! 🌐"
            ],
            'lifestyle': [
                "This brings such positive energy! ✨💫",
                "Living the dream! 🌸",
                "Inspiration for mindful living! 🧘",
                "Balance and beauty! 🌟",
                "Wellness vibes! 💖"
            ],
            'nature': [
                "Nature's masterpiece! 🌿✨",
                "Earth's beauty never ceases to amaze! 🌍",
                "Conservation is key! 🌱",
                "Wildlife wonder! 🦋",
                "Protecting our planet! 🌊"
            ],
            'artist': [
                "Pure artistic vision! 🎨✨",
                "Creativity unleashed! 💫",
                "Art meets soul! 🖼️",
                "Visual poetry! 🎭",
                "Masterpiece in the making! 🌈"
            ]
        }
        
        templates = comment_templates.get(bot_type, comment_templates['lifestyle'])
        return random.choice(templates)
    
    async def _get_all_bot_accounts(self) -> List[Dict]:
        """Get all bot accounts from backend"""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{self.node_backend_url}/api/users?isBot=true&limit=50",
                    headers={"Content-Type": "application/json"}
                )
                
                if response.status_code == 200:
                    result = response.json()
                    return result.get('data', [])
                return []
                
        except Exception as e:
            print(f"❌ Error fetching bot accounts: {e}")
            return []
    
    async def _get_recent_posts(self, limit: int = 20) -> List[Dict]:
        """Get recent BOT posts only for interaction (protect real user privacy)"""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{self.node_backend_url}/api/posts?limit={limit}&sort=createdAt&isBot=true",
                    headers={"Content-Type": "application/json"}
                )
                
                if response.status_code == 200:
                    result = response.json()
                    return result.get('data', [])
                return []
                
        except Exception as e:
            print(f"❌ Error fetching recent posts: {e}")
            return []
    
    # REMOVED: _get_popular_real_users method to protect user privacy
    # Bots should only interact with other bots, not real users
    
    async def _perform_like_action(self, bot_id: str, post_id: str) -> bool:
        """Perform like action via API"""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                # Try different endpoints that might work
                endpoints_to_try = [
                    f"/api/posts/{post_id}/like",
                    f"/api/posts/{post_id}/likes", 
                    f"/api/posts/like/{post_id}",
                    f"/api/posts/toggle-like/{post_id}"
                ]
                
                for endpoint in endpoints_to_try:
                    response = await client.post(
                        f"{self.node_backend_url}{endpoint}",
                        headers={
                            "Content-Type": "application/json",
                            "X-Bot-ID": bot_id,
                            "User-Agent": "HooksDream-Bot/1.0"
                        }
                    )
                    
                    if response.status_code in [200, 201]:
                        print(f"✅ Like successful via {endpoint}")
                        return True
                    elif response.status_code == 401:
                        print(f"🔐 Authentication required for {endpoint}")
                        continue
                    elif response.status_code == 404:
                        continue  # Try next endpoint
                
                print(f"❌ All like endpoints failed for post {post_id}")
                return False
                
        except Exception as e:
            print(f"❌ Error performing like action: {e}")
            return False
    
    async def _perform_follow_action(self, bot_id: str, target_id: str) -> bool:
        """Perform follow action via API"""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    f"{self.node_backend_url}/api/users/{target_id}/follow",
                    headers={
                        "Content-Type": "application/json",
                        "X-Bot-ID": bot_id  # Custom header to identify bot actions
                    }
                )
                return response.status_code == 200
                
        except Exception as e:
            print(f"❌ Error performing follow action: {e}")
            return False
    
    async def _perform_comment_action(self, bot_id: str, post_id: str, comment_text: str) -> bool:
        """Perform comment action via API"""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                # Try different comment endpoints
                endpoints_to_try = [
                    f"/api/posts/{post_id}/comments",
                    f"/api/posts/{post_id}/comment",
                    f"/api/comments/{post_id}"
                ]
                
                for endpoint in endpoints_to_try:
                    response = await client.post(
                        f"{self.node_backend_url}{endpoint}",
                        json={"content": comment_text},
                        headers={
                            "Content-Type": "application/json",
                            "X-Bot-ID": bot_id,
                            "User-Agent": "HooksDream-Bot/1.0"
                        }
                    )
                    
                    if response.status_code in [200, 201]:
                        print(f"✅ Comment successful via {endpoint}")
                        return True
                    elif response.status_code == 401:
                        print(f"🔐 Authentication required for {endpoint}")
                        continue
                    elif response.status_code == 404:
                        continue  # Try next endpoint
                
                print(f"❌ All comment endpoints failed for post {post_id}")
                return False
                
        except Exception as e:
            print(f"❌ Error performing comment action: {e}")
            return False
    
    async def _get_bot_following(self, bot_id: str) -> List[Dict]:
        """Get bot's following list"""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{self.node_backend_url}/api/users/{bot_id}/following",
                    headers={"Content-Type": "application/json"}
                )
                
                if response.status_code == 200:
                    result = response.json()
                    return result.get('data', [])
                return []
                
        except Exception as e:
            print(f"❌ Error fetching bot following: {e}")
            return []
    
    def cleanup_old_interactions(self):
        """Clean up old interaction history to prevent memory bloat"""
        cutoff_time = datetime.now() - timedelta(hours=24)
        
        # Remove interactions older than 24 hours
        old_keys = [key for key, timestamp in self.interaction_history.items() 
                   if timestamp < cutoff_time]
        
        for key in old_keys:
            del self.interaction_history[key]
        
        if old_keys:
            print(f"🧹 Cleaned up {len(old_keys)} old interaction records")
