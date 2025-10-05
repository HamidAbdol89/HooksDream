"""
Engagement Strategy Service
Implements mini-games, polls, and auto-engagement features for bots
"""

import random
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from enum import Enum

class EngagementType(Enum):
    POLL = "poll"
    QUESTION = "question"
    CHALLENGE = "challenge"
    QUIZ = "quiz"
    OPINION_REQUEST = "opinion_request"
    TIP_SHARING = "tip_sharing"

class EngagementStrategy:
    def __init__(self):
        """Initialize engagement strategy"""
        self.engagement_templates = self._initialize_engagement_templates()
        self.auto_like_probability = 0.3  # 30% chance to auto-like comments
        self.auto_reply_probability = 0.15  # 15% chance to auto-reply
        
    def should_add_engagement_hook(self, bot_type: str, content: str) -> bool:
        """Determine if post should include engagement hook"""
        
        # Higher chance for social bot types
        engagement_probabilities = {
            'lifestyle': 0.4,
            'photographer': 0.3,
            'artist': 0.35,
            'tech': 0.25,
            'nature': 0.3
        }
        
        base_probability = engagement_probabilities.get(bot_type, 0.2)
        
        # Increase probability for shorter posts (more room for engagement)
        if len(content) < 150:
            base_probability += 0.1
        
        return random.random() < base_probability
    
    def generate_engagement_hook(self, bot_type: str, topic: str, content: str) -> Optional[str]:
        """Generate engagement hook for post"""
        
        engagement_type = self._select_engagement_type(bot_type, topic)
        templates = self.engagement_templates.get(engagement_type, [])
        
        if not templates:
            return None
        
        # Select appropriate template
        template_data = random.choice(templates)
        template = template_data['template']
        
        # Customize template with topic
        engagement_hook = template.format(topic=topic)
        
        return f"\n\n{engagement_hook}"
    
    def _select_engagement_type(self, bot_type: str, topic: str) -> EngagementType:
        """Select appropriate engagement type"""
        
        # Bot type preferences
        type_preferences = {
            'tech': [EngagementType.POLL, EngagementType.QUESTION, EngagementType.QUIZ],
            'photographer': [EngagementType.CHALLENGE, EngagementType.OPINION_REQUEST],
            'artist': [EngagementType.CHALLENGE, EngagementType.OPINION_REQUEST],
            'lifestyle': [EngagementType.TIP_SHARING, EngagementType.QUESTION],
            'nature': [EngagementType.QUESTION, EngagementType.OPINION_REQUEST]
        }
        
        preferences = type_preferences.get(bot_type, [EngagementType.QUESTION])
        return random.choice(preferences)
    
    def _initialize_engagement_templates(self) -> Dict:
        """Initialize engagement templates"""
        
        return {
            EngagementType.POLL: [
                {'template': "🗳️ Quick poll: What's your experience with {topic}? A) Beginner B) Intermediate C) Expert", 'responses': ['A', 'B', 'C']},
                {'template': "📊 Poll time: How important is {topic} to you? 1️⃣ Very 2️⃣ Somewhat 3️⃣ Not much", 'responses': ['1️⃣', '2️⃣', '3️⃣']},
                {'template': "🤔 Vote: What's the biggest challenge with {topic}? A) Time B) Resources C) Knowledge", 'responses': ['A', 'B', 'C']}
            ],
            EngagementType.QUESTION: [
                {'template': "❓ What's your take on {topic}? Would love to hear different perspectives!", 'responses': []},
                {'template': "🤔 Question for you: How has {topic} impacted your daily life?", 'responses': []},
                {'template': "💭 Curious: What's the first thing that comes to mind when you think of {topic}?", 'responses': []},
                {'template': "🗣️ Let's discuss: What's one thing about {topic} that surprised you recently?", 'responses': []}
            ],
            EngagementType.CHALLENGE: [
                {'template': "🎯 Challenge: Share your best {topic} tip in the comments!", 'responses': []},
                {'template': "📸 Photo challenge: Show me your {topic} setup/workspace!", 'responses': []},
                {'template': "⚡ Quick challenge: Describe {topic} in just 3 words. Go!", 'responses': []}
            ],
            EngagementType.QUIZ: [
                {'template': "🧠 Mini quiz: What's the most important aspect of {topic}? Test your knowledge!", 'responses': []},
                {'template': "🎓 Pop quiz: True or false - {topic} is essential for everyone?", 'responses': ['True', 'False']},
                {'template': "🤓 Brain teaser: If you could change one thing about {topic}, what would it be?", 'responses': []}
            ],
            EngagementType.OPINION_REQUEST: [
                {'template': "💬 Your opinion matters: What's the future of {topic}?", 'responses': []},
                {'template': "🎭 Hot take needed: Is {topic} overrated or underrated?", 'responses': ['Overrated', 'Underrated']},
                {'template': "⚖️ Debate time: {topic} - blessing or curse? Defend your position!", 'responses': []}
            ],
            EngagementType.TIP_SHARING: [
                {'template': "💡 Tip exchange: Share your best {topic} hack below!", 'responses': []},
                {'template': "🔥 Pro tip thread: What's your secret {topic} strategy?", 'responses': []},
                {'template': "📝 Knowledge sharing: What's one {topic} lesson you wish you knew earlier?", 'responses': []}
            ]
        }
    
    def generate_auto_like_response(self, comment_content: str, bot_account: Dict) -> bool:
        """Determine if bot should auto-like a comment"""
        
        # Don't like negative comments
        negative_words = ['hate', 'terrible', 'awful', 'stupid', 'wrong', 'disagree strongly']
        if any(word in comment_content.lower() for word in negative_words):
            return False
        
        # Higher chance to like positive comments
        positive_words = ['great', 'awesome', 'love', 'amazing', 'brilliant', 'helpful', 'thanks']
        if any(word in comment_content.lower() for word in positive_words):
            return random.random() < 0.7  # 70% chance for positive comments
        
        # Standard probability for neutral comments
        return random.random() < self.auto_like_probability
    
    def generate_auto_reply(self, comment_content: str, bot_account: Dict, post_topic: str) -> Optional[str]:
        """Generate auto-reply to comment if appropriate"""
        
        if random.random() > self.auto_reply_probability:
            return None
        
        bot_type = bot_account.get('botType', 'lifestyle')
        display_name = bot_account.get('displayName', 'Bot')
        
        # Generate contextual reply based on comment content
        comment_lower = comment_content.lower()
        
        # Question responses
        if '?' in comment_content:
            question_responses = [
                "Great question! I think it really depends on your perspective.",
                "That's something I've been pondering too. What do you think?",
                "Interesting point! I'd love to hear more about your experience.",
                "Good question! In my experience, it varies from person to person."
            ]
            return random.choice(question_responses)
        
        # Positive comment responses
        if any(word in comment_lower for word in ['great', 'awesome', 'love', 'amazing']):
            positive_responses = [
                "Thank you! Really appreciate the kind words 🙏",
                "So glad you found it helpful! 😊",
                "Thanks! Your support means a lot 💙",
                "Appreciate you! Always great to connect with like-minded people ✨"
            ]
            return random.choice(positive_responses)
        
        # Agreement responses
        if any(word in comment_lower for word in ['agree', 'exactly', 'yes', 'true']):
            agreement_responses = [
                "Right? Glad we're on the same wavelength! 🤝",
                "Exactly! Great minds think alike 😄",
                "Yes! You totally get it 👍",
                "Absolutely! Thanks for sharing your perspective 🙌"
            ]
            return random.choice(agreement_responses)
        
        # Experience sharing responses
        if any(word in comment_lower for word in ['experience', 'tried', 'used', 'worked']):
            experience_responses = [
                "Thanks for sharing your experience! Always valuable to hear different perspectives.",
                "That's really interesting! How did it work out for you?",
                "Love hearing real experiences like this. Thanks for sharing! 🙏",
                "Your experience adds so much value to the conversation. Thank you!"
            ]
            return random.choice(experience_responses)
        
        # Generic friendly responses
        generic_responses = [
            "Thanks for engaging! Love the discussion 💬",
            "Appreciate your thoughts on this! 🤔",
            "Great point! Thanks for adding to the conversation ✨",
            "Thanks for sharing! Always enjoy hearing different viewpoints 🙌"
        ]
        
        return random.choice(generic_responses)
    
    def get_engagement_metrics(self) -> Dict:
        """Get engagement strategy metrics"""
        return {
            'auto_like_probability': self.auto_like_probability,
            'auto_reply_probability': self.auto_reply_probability,
            'available_engagement_types': [e.value for e in EngagementType],
            'total_templates': sum(len(templates) for templates in self.engagement_templates.values())
        }

class EngagementStrategyService:
    def __init__(self):
        """Initialize engagement strategy service"""
        self.strategy = EngagementStrategy()
    
    def enhance_post_with_engagement(self, bot_account: Dict, topic: str, content: str) -> str:
        """Enhance post with engagement hooks"""
        
        bot_type = bot_account.get('botType', 'lifestyle')
        
        if self.strategy.should_add_engagement_hook(bot_type, content):
            engagement_hook = self.strategy.generate_engagement_hook(bot_type, topic, content)
            if engagement_hook:
                print(f"🎯 Added engagement hook for {bot_account.get('displayName')}")
                return content + engagement_hook
        
        return content
    
    def should_auto_like_comment(self, comment_content: str, bot_account: Dict) -> bool:
        """Determine if bot should auto-like a comment"""
        return self.strategy.generate_auto_like_response(comment_content, bot_account)
    
    def generate_comment_reply(self, comment_content: str, bot_account: Dict, post_topic: str) -> Optional[str]:
        """Generate auto-reply to comment"""
        return self.strategy.generate_auto_reply(comment_content, bot_account, post_topic)
    
    def get_engagement_stats(self) -> Dict:
        """Get engagement statistics"""
        return self.strategy.get_engagement_metrics()

# Global instance
engagement_strategy_service = EngagementStrategyService()
