"""
Mood & Context Randomizer Service
Generates time-aware, mood-based content for natural bot behavior
"""

import random
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from enum import Enum

class MoodType(Enum):
    ENERGETIC = "energetic"
    REFLECTIVE = "reflective"
    CREATIVE = "creative"
    CHILL = "chill"
    FOCUSED = "focused"
    GRATEFUL = "grateful"
    CURIOUS = "curious"
    NOSTALGIC = "nostalgic"

class TimeContext(Enum):
    EARLY_MORNING = "early_morning"  # 5-7 AM
    MORNING = "morning"              # 7-11 AM
    MIDDAY = "midday"               # 11 AM-2 PM
    AFTERNOON = "afternoon"         # 2-6 PM
    EVENING = "evening"             # 6-9 PM
    NIGHT = "night"                 # 9 PM-12 AM
    LATE_NIGHT = "late_night"       # 12-5 AM

class DayContext(Enum):
    MONDAY = "monday"
    TUESDAY = "tuesday"
    WEDNESDAY = "wednesday"
    THURSDAY = "thursday"
    FRIDAY = "friday"
    SATURDAY = "saturday"
    SUNDAY = "sunday"

class MoodContextService:
    def __init__(self):
        """Initialize mood and context service"""
        self.mood_templates = self._initialize_mood_templates()
        self.time_contexts = self._initialize_time_contexts()
        self.day_contexts = self._initialize_day_contexts()
    
    def get_current_context(self) -> Dict:
        """Get current time and day context"""
        now = datetime.now()
        hour = now.hour
        weekday = now.weekday()  # 0 = Monday, 6 = Sunday
        
        # Determine time context
        if 5 <= hour < 7:
            time_context = TimeContext.EARLY_MORNING
        elif 7 <= hour < 11:
            time_context = TimeContext.MORNING
        elif 11 <= hour < 14:
            time_context = TimeContext.MIDDAY
        elif 14 <= hour < 18:
            time_context = TimeContext.AFTERNOON
        elif 18 <= hour < 21:
            time_context = TimeContext.EVENING
        elif 21 <= hour < 24:
            time_context = TimeContext.NIGHT
        else:  # 0-5 AM
            time_context = TimeContext.LATE_NIGHT
        
        # Determine day context
        day_names = [DayContext.MONDAY, DayContext.TUESDAY, DayContext.WEDNESDAY, 
                    DayContext.THURSDAY, DayContext.FRIDAY, DayContext.SATURDAY, DayContext.SUNDAY]
        day_context = day_names[weekday]
        
        return {
            "time_context": time_context,
            "day_context": day_context,
            "hour": hour,
            "weekday": weekday,
            "is_weekend": weekday >= 5,
            "is_workday": weekday < 5
        }
    
    def generate_mood_based_prompt(self, bot_account: Dict, topic: str, context: Dict = None) -> str:
        """Generate mood-based prompt for AI text generation"""
        
        if not context:
            context = self.get_current_context()
        
        bot_type = bot_account.get('botType', 'lifestyle')
        display_name = bot_account.get('displayName', 'AI Creator')
        bio = bot_account.get('bio', '')
        
        # Select mood based on time and day
        mood = self._select_contextual_mood(context, bot_type)
        
        # Get time-specific prompt elements
        time_elements = self._get_time_elements(context)
        
        # Get mood-specific elements
        mood_elements = self._get_mood_elements(mood, bot_type)
        
        # Create enhanced prompt
        prompt = f"""You are {display_name}, a {bot_type} expert. {bio}

CURRENT CONTEXT:
- Time: {time_elements['time_description']}
- Day: {time_elements['day_description']}
- Mood: {mood_elements['mood_description']}

Create a natural, {mood.value} social media post about {topic}.

STYLE GUIDELINES:
{time_elements['style_guide']}
{mood_elements['style_guide']}

POST REQUIREMENTS:
- Write in first person as {display_name}
- Match the {mood.value} mood perfectly
- Include {time_elements['emoji_style']} emojis
- Add 3-4 relevant hashtags
- Keep under 280 characters
- Sound authentic and human
- Reflect the {context['time_context'].value} energy

EXAMPLES:
{mood_elements['examples']}"""
        
        return prompt
    
    def _select_contextual_mood(self, context: Dict, bot_type: str) -> MoodType:
        """Select mood based on time, day, and bot personality"""
        
        time_context = context['time_context']
        is_weekend = context['is_weekend']
        
        # Time-based mood probabilities
        time_moods = {
            TimeContext.EARLY_MORNING: [MoodType.REFLECTIVE, MoodType.GRATEFUL, MoodType.FOCUSED],
            TimeContext.MORNING: [MoodType.ENERGETIC, MoodType.FOCUSED, MoodType.CURIOUS],
            TimeContext.MIDDAY: [MoodType.FOCUSED, MoodType.ENERGETIC, MoodType.CREATIVE],
            TimeContext.AFTERNOON: [MoodType.CREATIVE, MoodType.FOCUSED, MoodType.CURIOUS],
            TimeContext.EVENING: [MoodType.REFLECTIVE, MoodType.CHILL, MoodType.GRATEFUL],
            TimeContext.NIGHT: [MoodType.CHILL, MoodType.REFLECTIVE, MoodType.NOSTALGIC],
            TimeContext.LATE_NIGHT: [MoodType.CREATIVE, MoodType.REFLECTIVE, MoodType.CURIOUS]
        }
        
        # Weekend adjustment
        if is_weekend:
            weekend_moods = [MoodType.CHILL, MoodType.GRATEFUL, MoodType.CREATIVE, MoodType.NOSTALGIC]
            possible_moods = weekend_moods
        else:
            possible_moods = time_moods.get(time_context, [MoodType.FOCUSED])
        
        # Bot type influence
        bot_mood_preferences = {
            'tech': [MoodType.CURIOUS, MoodType.FOCUSED, MoodType.CREATIVE],
            'photographer': [MoodType.CREATIVE, MoodType.REFLECTIVE, MoodType.NOSTALGIC],
            'artist': [MoodType.CREATIVE, MoodType.REFLECTIVE, MoodType.ENERGETIC],
            'traveler': [MoodType.CURIOUS, MoodType.NOSTALGIC, MoodType.ENERGETIC],
            'lifestyle': [MoodType.GRATEFUL, MoodType.REFLECTIVE, MoodType.CHILL],
            'nature': [MoodType.REFLECTIVE, MoodType.GRATEFUL, MoodType.CHILL]
        }
        
        # Combine time and bot preferences
        bot_preferences = bot_mood_preferences.get(bot_type, [MoodType.REFLECTIVE])
        combined_moods = list(set(possible_moods + bot_preferences))
        
        return random.choice(combined_moods)
    
    def _get_time_elements(self, context: Dict) -> Dict:
        """Get time-specific prompt elements"""
        
        time_context = context['time_context']
        day_context = context['day_context']
        is_weekend = context['is_weekend']
        
        time_elements = {
            TimeContext.EARLY_MORNING: {
                'time_description': 'Early morning (5-7 AM)',
                'day_description': 'Start of a new day',
                'style_guide': '- Use calm, peaceful tone\n- Focus on new beginnings\n- Mention morning rituals',
                'emoji_style': 'sunrise/peaceful'
            },
            TimeContext.MORNING: {
                'time_description': 'Morning (7-11 AM)',
                'day_description': 'Active morning hours',
                'style_guide': '- Use energetic, motivated tone\n- Focus on goals and plans\n- Mention morning activities',
                'emoji_style': 'energetic/bright'
            },
            TimeContext.MIDDAY: {
                'time_description': 'Midday (11 AM-2 PM)',
                'day_description': 'Peak productivity hours',
                'style_guide': '- Use focused, productive tone\n- Share work insights\n- Mention current projects',
                'emoji_style': 'focused/work-related'
            },
            TimeContext.AFTERNOON: {
                'time_description': 'Afternoon (2-6 PM)',
                'day_description': 'Creative afternoon hours',
                'style_guide': '- Use creative, collaborative tone\n- Share discoveries\n- Mention afternoon activities',
                'emoji_style': 'creative/collaborative'
            },
            TimeContext.EVENING: {
                'time_description': 'Evening (6-9 PM)',
                'day_description': 'Winding down time',
                'style_guide': '- Use reflective, grateful tone\n- Share day insights\n- Mention evening thoughts',
                'emoji_style': 'sunset/reflective'
            },
            TimeContext.NIGHT: {
                'time_description': 'Night (9 PM-12 AM)',
                'day_description': 'Relaxation time',
                'style_guide': '- Use calm, contemplative tone\n- Share reflections\n- Mention night activities',
                'emoji_style': 'calm/night'
            },
            TimeContext.LATE_NIGHT: {
                'time_description': 'Late night (12-5 AM)',
                'day_description': 'Deep thinking hours',
                'style_guide': '- Use introspective, creative tone\n- Share deep thoughts\n- Mention late-night insights',
                'emoji_style': 'moon/stars/deep'
            }
        }
        
        base_elements = time_elements.get(time_context, time_elements[TimeContext.MORNING])
        
        # Weekend modifications
        if is_weekend:
            base_elements['day_description'] += ' (Weekend vibes)'
            base_elements['style_guide'] += '\n- Add weekend relaxation elements'
        
        return base_elements
    
    def _get_mood_elements(self, mood: MoodType, bot_type: str) -> Dict:
        """Get mood-specific prompt elements"""
        
        mood_elements = {
            MoodType.ENERGETIC: {
                'mood_description': 'High energy, motivated, excited',
                'style_guide': '- Use exclamation points\n- Show enthusiasm\n- Mention action and movement',
                'examples': '- "🚀 Feeling unstoppable today!"\n- "⚡ Energy levels through the roof!"'
            },
            MoodType.REFLECTIVE: {
                'mood_description': 'Thoughtful, contemplative, introspective',
                'style_guide': '- Use deeper thoughts\n- Ask meaningful questions\n- Share insights',
                'examples': '- "💭 Been thinking about..."\n- "🤔 Realized something important today..."'
            },
            MoodType.CREATIVE: {
                'mood_description': 'Inspired, artistic, innovative',
                'style_guide': '- Focus on creativity\n- Mention artistic process\n- Share inspiration',
                'examples': '- "🎨 Inspiration struck at 3am..."\n- "✨ Creating something magical..."'
            },
            MoodType.CHILL: {
                'mood_description': 'Relaxed, peaceful, laid-back',
                'style_guide': '- Use calm tone\n- Mention relaxation\n- Share peaceful moments',
                'examples': '- "🌿 Just vibing today..."\n- "😌 Sometimes you need to slow down..."'
            },
            MoodType.FOCUSED: {
                'mood_description': 'Concentrated, determined, goal-oriented',
                'style_guide': '- Mention work/goals\n- Show determination\n- Share progress',
                'examples': '- "🎯 Deep focus mode activated"\n- "💪 Making progress on..."'
            },
            MoodType.GRATEFUL: {
                'mood_description': 'Thankful, appreciative, positive',
                'style_guide': '- Express gratitude\n- Mention blessings\n- Share positive moments',
                'examples': '- "🙏 Grateful for..."\n- "✨ Blessed to have..."'
            },
            MoodType.CURIOUS: {
                'mood_description': 'Inquisitive, wondering, exploring',
                'style_guide': '- Ask questions\n- Show wonder\n- Mention discoveries',
                'examples': '- "🤔 What if...?"\n- "🔍 Discovered something fascinating..."'
            },
            MoodType.NOSTALGIC: {
                'mood_description': 'Reminiscent, sentimental, remembering',
                'style_guide': '- Reference past experiences\n- Share memories\n- Connect past to present',
                'examples': '- "📸 Remembering when..."\n- "💫 Takes me back to..."'
            }
        }
        
        return mood_elements.get(mood, mood_elements[MoodType.REFLECTIVE])
    
    def _initialize_mood_templates(self) -> Dict:
        """Initialize mood-based templates (for fallback)"""
        # Implementation for template fallbacks
        return {}
    
    def _initialize_time_contexts(self) -> Dict:
        """Initialize time-specific contexts"""
        # Implementation for time contexts
        return {}
    
    def _initialize_day_contexts(self) -> Dict:
        """Initialize day-specific contexts"""
        # Implementation for day contexts
        return {}

# Global instance
mood_context_service = MoodContextService()
