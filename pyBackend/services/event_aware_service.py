"""
Event-Aware Content Service
Generates content aware of trending topics, holidays, and current events
"""

import random
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import calendar

class EventAwareService:
    def __init__(self):
        """Initialize event-aware service"""
        self.tech_events = self._initialize_tech_events()
        self.cultural_events = self._initialize_cultural_events()
        self.seasonal_events = self._initialize_seasonal_events()
        self.trending_topics = self._initialize_trending_topics()
    
    def get_current_events(self) -> Dict:
        """Get current relevant events and trending topics"""
        now = datetime.now()
        
        events = {
            'tech_events': self._get_tech_events(now),
            'cultural_events': self._get_cultural_events(now),
            'seasonal_events': self._get_seasonal_events(now),
            'trending_topics': self._get_trending_topics(),
            'day_significance': self._get_day_significance(now)
        }
        
        return events
    
    def enhance_prompt_with_events(self, base_prompt: str, bot_account: Dict) -> str:
        """Enhance prompt with relevant current events"""
        
        events = self.get_current_events()
        bot_type = bot_account.get('botType', 'lifestyle')
        interests = bot_account.get('interests', [])
        
        # Select relevant events for this bot
        relevant_events = self._filter_relevant_events(events, bot_type, interests)
        
        if not relevant_events:
            return base_prompt
        
        # Add event context to prompt
        event_context = "\n\nCURRENT EVENTS CONTEXT:\n"
        
        for event in relevant_events[:2]:  # Max 2 events to avoid overwhelming
            event_context += f"- {event['name']}: {event['description']}\n"
        
        event_context += "\nOPTIONAL: You may naturally reference these events if relevant to your post topic.\n"
        
        return base_prompt + event_context
    
    def _filter_relevant_events(self, events: Dict, bot_type: str, interests: List[str]) -> List[Dict]:
        """Filter events relevant to bot type and interests"""
        
        relevant_events = []
        
        # Tech events for tech bots
        if bot_type == 'tech':
            relevant_events.extend(events['tech_events'])
        
        # Cultural events for all bots (especially Islamic bots)
        if any(interest in ['islamic studies', 'community leadership', 'halal business'] for interest in interests):
            relevant_events.extend([e for e in events['cultural_events'] if 'islamic' in e.get('tags', [])])
        
        # Seasonal events for nature/lifestyle bots
        if bot_type in ['nature', 'lifestyle']:
            relevant_events.extend(events['seasonal_events'])
        
        # Trending topics for all bots (with relevance filtering)
        for topic in events['trending_topics']:
            if self._is_topic_relevant(topic, bot_type, interests):
                relevant_events.append(topic)
        
        # Day significance for all bots
        if events['day_significance']:
            relevant_events.append(events['day_significance'])
        
        return relevant_events
    
    def _is_topic_relevant(self, topic: Dict, bot_type: str, interests: List[str]) -> bool:
        """Check if trending topic is relevant to bot"""
        
        topic_tags = topic.get('tags', [])
        
        # Bot type relevance
        bot_relevance = {
            'tech': ['technology', 'ai', 'startup', 'innovation'],
            'photographer': ['photography', 'art', 'visual', 'creative'],
            'artist': ['art', 'creative', 'design', 'culture'],
            'traveler': ['travel', 'culture', 'adventure', 'world'],
            'lifestyle': ['wellness', 'health', 'lifestyle', 'mindfulness'],
            'nature': ['environment', 'nature', 'conservation', 'wildlife']
        }
        
        relevant_tags = bot_relevance.get(bot_type, [])
        
        # Check overlap
        return any(tag in topic_tags for tag in relevant_tags)
    
    def _get_tech_events(self, date: datetime) -> List[Dict]:
        """Get current tech events"""
        
        # Simulated tech events (in real implementation, could fetch from APIs)
        tech_events = []
        
        # Check for major tech conferences/events by month
        month = date.month
        
        if month == 1:  # January
            tech_events.append({
                'name': 'CES 2024',
                'description': 'Consumer Electronics Show showcasing latest tech innovations',
                'tags': ['technology', 'innovation', 'gadgets'],
                'relevance': 'high'
            })
        
        elif month == 3:  # March
            tech_events.append({
                'name': 'AI Safety Summit',
                'description': 'Global leaders discussing AI safety and regulation',
                'tags': ['ai', 'safety', 'regulation', 'technology'],
                'relevance': 'high'
            })
        
        elif month == 5:  # May
            tech_events.append({
                'name': 'Google I/O',
                'description': 'Google\'s annual developer conference',
                'tags': ['google', 'development', 'ai', 'technology'],
                'relevance': 'high'
            })
        
        elif month == 6:  # June
            tech_events.append({
                'name': 'WWDC',
                'description': 'Apple\'s Worldwide Developers Conference',
                'tags': ['apple', 'development', 'ios', 'technology'],
                'relevance': 'high'
            })
        
        elif month == 10:  # October
            tech_events.append({
                'name': 'Cybersecurity Awareness Month',
                'description': 'Global focus on cybersecurity education and awareness',
                'tags': ['cybersecurity', 'awareness', 'technology'],
                'relevance': 'medium'
            })
        
        return tech_events
    
    def _get_cultural_events(self, date: datetime) -> List[Dict]:
        """Get current cultural and religious events"""
        
        cultural_events = []
        month = date.month
        day = date.day
        
        # Islamic events (approximate dates - would need proper Islamic calendar)
        if month == 4:  # Ramadan period (varies yearly)
            cultural_events.append({
                'name': 'Ramadan',
                'description': 'Holy month of fasting and reflection for Muslims',
                'tags': ['islamic', 'ramadan', 'spiritual', 'community'],
                'relevance': 'high'
            })
        
        elif month == 6:  # Eid al-Fitr (varies yearly)
            cultural_events.append({
                'name': 'Eid al-Fitr',
                'description': 'Celebration marking the end of Ramadan',
                'tags': ['islamic', 'eid', 'celebration', 'community'],
                'relevance': 'high'
            })
        
        elif month == 8:  # Eid al-Adha (varies yearly)
            cultural_events.append({
                'name': 'Eid al-Adha',
                'description': 'Festival of Sacrifice, major Islamic holiday',
                'tags': ['islamic', 'eid', 'sacrifice', 'pilgrimage'],
                'relevance': 'high'
            })
        
        # International days
        if month == 3 and day == 8:
            cultural_events.append({
                'name': 'International Women\'s Day',
                'description': 'Celebrating women\'s achievements and advocating for equality',
                'tags': ['women', 'equality', 'empowerment'],
                'relevance': 'medium'
            })
        
        elif month == 4 and day == 22:
            cultural_events.append({
                'name': 'Earth Day',
                'description': 'Global day of environmental awareness and action',
                'tags': ['environment', 'nature', 'conservation'],
                'relevance': 'high'
            })
        
        return cultural_events
    
    def _get_seasonal_events(self, date: datetime) -> List[Dict]:
        """Get seasonal events and natural phenomena"""
        
        seasonal_events = []
        month = date.month
        
        # Spring
        if month in [3, 4, 5]:
            seasonal_events.append({
                'name': 'Spring Season',
                'description': 'Season of renewal, growth, and new beginnings',
                'tags': ['spring', 'nature', 'growth', 'renewal'],
                'relevance': 'medium'
            })
        
        # Summer
        elif month in [6, 7, 8]:
            seasonal_events.append({
                'name': 'Summer Season',
                'description': 'Season of warmth, energy, and outdoor activities',
                'tags': ['summer', 'energy', 'outdoor', 'travel'],
                'relevance': 'medium'
            })
        
        # Autumn
        elif month in [9, 10, 11]:
            seasonal_events.append({
                'name': 'Autumn Season',
                'description': 'Season of change, reflection, and harvest',
                'tags': ['autumn', 'change', 'reflection', 'harvest'],
                'relevance': 'medium'
            })
        
        # Winter
        elif month in [12, 1, 2]:
            seasonal_events.append({
                'name': 'Winter Season',
                'description': 'Season of introspection, planning, and cozy moments',
                'tags': ['winter', 'introspection', 'planning', 'cozy'],
                'relevance': 'medium'
            })
        
        return seasonal_events
    
    def _get_trending_topics(self) -> List[Dict]:
        """Get current trending topics (simulated - could integrate with Twitter API, Google Trends)"""
        
        # Simulated trending topics
        trending = [
            {
                'name': 'Sustainable Technology',
                'description': 'Growing focus on eco-friendly tech solutions',
                'tags': ['technology', 'sustainability', 'environment'],
                'relevance': 'high'
            },
            {
                'name': 'Remote Work Culture',
                'description': 'Evolution of remote and hybrid work practices',
                'tags': ['work', 'remote', 'lifestyle', 'productivity'],
                'relevance': 'high'
            },
            {
                'name': 'Mental Health Awareness',
                'description': 'Increased focus on mental wellness and self-care',
                'tags': ['mental health', 'wellness', 'self-care'],
                'relevance': 'high'
            },
            {
                'name': 'AI Art and Creativity',
                'description': 'AI tools transforming creative industries',
                'tags': ['ai', 'art', 'creativity', 'technology'],
                'relevance': 'high'
            }
        ]
        
        # Return random selection
        return random.sample(trending, min(2, len(trending)))
    
    def _get_day_significance(self, date: datetime) -> Optional[Dict]:
        """Get significance of current day"""
        
        weekday = date.weekday()
        day_names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        
        # Special day characteristics
        if weekday == 0:  # Monday
            return {
                'name': 'Monday Motivation',
                'description': 'Start of a new week, fresh energy and new goals',
                'tags': ['monday', 'motivation', 'new week', 'goals'],
                'relevance': 'medium'
            }
        elif weekday == 4:  # Friday
            return {
                'name': 'Friday Reflection',
                'description': 'End of work week, time to reflect and plan weekend',
                'tags': ['friday', 'reflection', 'weekend', 'accomplishments'],
                'relevance': 'medium'
            }
        elif weekday == 6:  # Sunday
            return {
                'name': 'Sunday Preparation',
                'description': 'Day of rest and preparation for the upcoming week',
                'tags': ['sunday', 'preparation', 'rest', 'planning'],
                'relevance': 'medium'
            }
        
        return None
    
    def _initialize_tech_events(self) -> Dict:
        """Initialize tech events database"""
        return {}
    
    def _initialize_cultural_events(self) -> Dict:
        """Initialize cultural events database"""
        return {}
    
    def _initialize_seasonal_events(self) -> Dict:
        """Initialize seasonal events database"""
        return {}
    
    def _initialize_trending_topics(self) -> Dict:
        """Initialize trending topics database"""
        return {}

# Global instance
event_aware_service = EventAwareService()
