"""
Simple BotProfile class for AI caption generation
Used only temporarily for AI prompts, not for actual bot management
"""

from datetime import datetime
from typing import List, Optional
from dataclasses import dataclass

@dataclass
class BotProfile:
    """Simple bot profile for AI caption generation"""
    id: str
    name: str
    username: str
    personality_type: str  # photographer, traveler, artist, lifestyle, tech, foodie
    bio: str
    avatar_style: str
    interests: List[str]
    posting_style: str
    created_at: datetime
    engagement_score: float = 0.0
    post_count: int = 0
    last_post_at: Optional[datetime] = None
    is_active: bool = True
