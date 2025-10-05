"""
Bot Memory Service
Tracks bot post history and enables continuity in thoughts and conversations
"""

import json
import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Set
from collections import defaultdict, deque

class BotMemory:
    def __init__(self, bot_id: str, max_memory_size: int = 50):
        """Initialize bot memory for a specific bot"""
        self.bot_id = bot_id
        self.max_memory_size = max_memory_size
        
        # Memory storage
        self.post_history: deque = deque(maxlen=max_memory_size)
        self.topic_history: Dict[str, List[Dict]] = defaultdict(list)
        self.mood_patterns: Dict[str, int] = defaultdict(int)
        self.interaction_history: List[Dict] = []
        self.thought_threads: List[Dict] = []  # Connected thoughts over time
        
        # Tracking
        self.last_post_time: Optional[datetime] = None
        self.favorite_topics: Set[str] = set()
        self.posting_patterns: Dict[str, int] = defaultdict(int)
    
    def add_post_memory(self, post_data: Dict) -> None:
        """Add a new post to memory"""
        
        memory_entry = {
            'timestamp': datetime.now(),
            'content': post_data.get('content', ''),
            'topic': post_data.get('topic', ''),
            'post_type': post_data.get('post_type', ''),
            'mood': post_data.get('mood', ''),
            'images': post_data.get('images', []),
            'hashtags': self._extract_hashtags(post_data.get('content', '')),
            'engagement_prediction': post_data.get('engagement_prediction', 0)
        }
        
        # Add to history
        self.post_history.append(memory_entry)
        
        # Update topic tracking
        topic = memory_entry['topic']
        self.topic_history[topic].append(memory_entry)
        self.favorite_topics.add(topic)
        
        # Update mood patterns
        if memory_entry['mood']:
            self.mood_patterns[memory_entry['mood']] += 1
        
        # Update posting patterns
        hour = memory_entry['timestamp'].hour
        self.posting_patterns[f"hour_{hour}"] += 1
        
        self.last_post_time = memory_entry['timestamp']
        
        print(f"📝 Added memory for {self.bot_id}: {memory_entry['content'][:50]}...")
    
    def get_recent_posts(self, limit: int = 5) -> List[Dict]:
        """Get recent posts from memory"""
        return list(self.post_history)[-limit:]
    
    def get_topic_history(self, topic: str, limit: int = 3) -> List[Dict]:
        """Get previous posts about a specific topic"""
        return self.topic_history[topic][-limit:]
    
    def should_continue_thought(self, topic: str) -> Optional[Dict]:
        """Check if bot should continue a previous thought"""
        
        if not self.post_history:
            return None
        
        # Look for recent posts on similar topics
        recent_posts = self.get_recent_posts(10)
        
        for post in reversed(recent_posts):
            post_age = datetime.now() - post['timestamp']
            
            # If posted about this topic in last 3 days, consider continuation
            if (post_age.days <= 3 and 
                post['topic'] == topic and 
                len(post['content']) > 50):  # Substantial post
                
                return {
                    'previous_post': post,
                    'continuation_type': 'topic_follow_up',
                    'time_gap': post_age,
                    'suggestion': f"Continue thoughts from {post_age.days} days ago"
                }
        
        return None
    
    def get_thought_continuation_prompt(self, topic: str, base_prompt: str) -> str:
        """Generate prompt for continuing a previous thought"""
        
        continuation = self.should_continue_thought(topic)
        
        if not continuation:
            return base_prompt
        
        previous_post = continuation['previous_post']
        time_gap = continuation['time_gap']
        
        # Create continuation context
        continuation_context = f"""
THOUGHT CONTINUATION CONTEXT:
You previously posted about {topic} {time_gap.days} days ago:
"{previous_post['content'][:100]}..."

CONTINUATION OPTIONS:
1. Build upon that previous thought
2. Share an update or new realization
3. Reflect on how your thinking has evolved
4. Connect past insight to current experience

Use phrases like:
- "Been thinking more about..."
- "Update on my thoughts about..."
- "Last week I shared about X, today I realized..."
- "Building on my previous thoughts..."
"""
        
        return base_prompt + continuation_context
    
    def avoid_repetition_check(self, new_content: str) -> bool:
        """Check if new content is too similar to recent posts"""
        
        if not self.post_history:
            return True  # No history, allow post
        
        # Get recent posts
        recent_posts = self.get_recent_posts(5)
        
        # Simple similarity check (could be enhanced with NLP)
        new_words = set(new_content.lower().split())
        
        for post in recent_posts:
            post_words = set(post['content'].lower().split())
            
            # Calculate word overlap
            overlap = len(new_words.intersection(post_words))
            similarity = overlap / max(len(new_words), len(post_words), 1)
            
            # If too similar (>70% word overlap), suggest avoiding
            if similarity > 0.7:
                print(f"⚠️ High similarity detected ({similarity:.2f}) with recent post")
                return False
        
        return True
    
    def get_personality_insights(self) -> Dict:
        """Get insights about bot's posting personality"""
        
        if not self.post_history:
            return {}
        
        total_posts = len(self.post_history)
        
        # Analyze patterns
        insights = {
            'total_posts': total_posts,
            'favorite_topics': list(self.favorite_topics)[:5],
            'dominant_mood': max(self.mood_patterns.items(), key=lambda x: x[1])[0] if self.mood_patterns else None,
            'active_hours': [hour.replace('hour_', '') for hour, count in sorted(self.posting_patterns.items(), key=lambda x: x[1], reverse=True)[:3]],
            'avg_post_length': sum(len(post['content']) for post in self.post_history) / total_posts,
            'posting_frequency': self._calculate_posting_frequency(),
            'engagement_topics': self._get_high_engagement_topics()
        }
        
        return insights
    
    def _extract_hashtags(self, content: str) -> List[str]:
        """Extract hashtags from content"""
        import re
        return re.findall(r'#\w+', content)
    
    def _calculate_posting_frequency(self) -> str:
        """Calculate how often bot posts"""
        if len(self.post_history) < 2:
            return "insufficient_data"
        
        time_diffs = []
        for i in range(1, len(self.post_history)):
            diff = self.post_history[i]['timestamp'] - self.post_history[i-1]['timestamp']
            time_diffs.append(diff.total_seconds() / 3600)  # Convert to hours
        
        avg_hours = sum(time_diffs) / len(time_diffs)
        
        if avg_hours < 6:
            return "very_active"
        elif avg_hours < 24:
            return "active"
        elif avg_hours < 72:
            return "moderate"
        else:
            return "occasional"
    
    def _get_high_engagement_topics(self) -> List[str]:
        """Get topics that typically get high engagement"""
        # Placeholder - would analyze actual engagement data
        return list(self.favorite_topics)[:3]

class BotMemoryService:
    def __init__(self):
        """Initialize bot memory service"""
        self.bot_memories: Dict[str, BotMemory] = {}
        self.global_topic_trends: Dict[str, int] = defaultdict(int)
        self.interaction_network: Dict[str, Set[str]] = defaultdict(set)
    
    def get_bot_memory(self, bot_id: str) -> BotMemory:
        """Get or create memory for a bot"""
        if bot_id not in self.bot_memories:
            self.bot_memories[bot_id] = BotMemory(bot_id)
        return self.bot_memories[bot_id]
    
    def add_post_to_memory(self, bot_id: str, post_data: Dict) -> None:
        """Add post to bot's memory"""
        memory = self.get_bot_memory(bot_id)
        memory.add_post_memory(post_data)
        
        # Update global trends
        topic = post_data.get('topic', '')
        if topic:
            self.global_topic_trends[topic] += 1
    
    def enhance_prompt_with_memory(self, bot_id: str, topic: str, base_prompt: str) -> str:
        """Enhance prompt with bot's memory and personality"""
        
        memory = self.get_bot_memory(bot_id)
        
        # Check for thought continuation
        enhanced_prompt = memory.get_thought_continuation_prompt(topic, base_prompt)
        
        # Add personality insights
        insights = memory.get_personality_insights()
        
        if insights:
            personality_context = f"""
BOT PERSONALITY INSIGHTS:
- Favorite topics: {', '.join(insights.get('favorite_topics', [])[:3])}
- Dominant mood: {insights.get('dominant_mood', 'balanced')}
- Posting style: {insights.get('posting_frequency', 'moderate')}
- Active hours: {', '.join(insights.get('active_hours', [])[:2])}

MEMORY GUIDANCE:
- Maintain consistency with your established personality
- Avoid repeating recent content
- Build upon previous thoughts when relevant
"""
            enhanced_prompt += personality_context
        
        return enhanced_prompt
    
    def should_allow_post(self, bot_id: str, content: str) -> bool:
        """Check if post should be allowed (avoid repetition)"""
        memory = self.get_bot_memory(bot_id)
        return memory.avoid_repetition_check(content)
    
    def get_global_trends(self) -> Dict[str, int]:
        """Get global topic trends across all bots"""
        return dict(self.global_topic_trends)
    
    def add_interaction(self, bot_id: str, target_bot_id: str, interaction_type: str) -> None:
        """Track bot interactions for network analysis"""
        self.interaction_network[bot_id].add(target_bot_id)
        
        # Add to memory
        memory = self.get_bot_memory(bot_id)
        memory.interaction_history.append({
            'timestamp': datetime.now(),
            'target_bot': target_bot_id,
            'type': interaction_type
        })
    
    def get_memory_stats(self) -> Dict:
        """Get overall memory system statistics"""
        return {
            'total_bots_tracked': len(self.bot_memories),
            'total_posts_remembered': sum(len(memory.post_history) for memory in self.bot_memories.values()),
            'global_trends': dict(list(self.global_topic_trends.items())[:10]),
            'interaction_network_size': sum(len(connections) for connections in self.interaction_network.values())
        }

# Global instance
bot_memory_service = BotMemoryService()
