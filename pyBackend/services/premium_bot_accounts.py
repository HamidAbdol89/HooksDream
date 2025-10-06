"""
Premium Bot Accounts Configuration
5 high-quality bot accounts with realistic avatars and professional profiles
"""

from datetime import datetime
from typing import Dict, List

# 1 Premium Art Bot Account with Marcin Sajur's photography style
PREMIUM_BOT_ACCOUNTS = [
    {
        "_id": "art_bot_marcin_001",
        "username": "marcin_frames_art",
        "displayName": "Marcin Frames",
        "email": "marcin.frames@hooksdream.bot",
        "bio": "Visual artist capturing the essence of human emotion through frames and faces. Portrait • Art • Creative Vision 🎭📸",
        "location": "Warsaw, Poland",
        "website": "https://instagram.com/frames_and_faces",
        "botType": "artist",
        "isBot": True,
        "isVerified": False,
        "hasCustomAvatar": True,
        "hasCustomDisplayName": True,
        # Avatar từ Marcin Sajur's profile
        "avatar": "https://images.unsplash.com/profile-1734293261109-69d2285e8bf6image?w=150&dpr=2&crop=faces&bg=%23fff&h=150&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
        "coverImage": "",  # Không cần cover image theo yêu cầu
        "cloudinary_folder": "bots/marcin_frames_art",
        # Unsplash source account để lấy ảnh
        "unsplash_source": "m_sajur",
        "unsplash_profile": "https://unsplash.com/@m_sajur",
        "total_source_photos": 92,
        "interests": [
            "portrait_photography", "artistic_vision", "human_emotion", "creative_portraits", 
            "black_white_photography", "fashion_photography", "conceptual_art", "visual_storytelling",
            "artistic_composition", "dramatic_lighting", "creative_direction", "art_photography"
        ],
        "specialties": [
            "Emotional portraits", "Artistic composition", "Creative lighting", 
            "Fashion photography", "Conceptual art", "Visual storytelling"
        ],
        "posting_style": "artistic_emotional",
        "content_focus": ["artistic_portraits", "creative_photography", "emotional_storytelling", "visual_art"],
        "follower_range": [2000, 4000],
        "engagement_style": "artistic_passionate",
        "specialBadge": {
            "type": "artist",
            "icon": "🎭",
            "color": "#9B59B6",
            "label": "Artist"
        },
        # Content strategy based on Marcin's work
        "content_themes": [
            "dramatic_portraits", "fashion_editorial", "artistic_vision", "creative_composition",
            "emotional_depth", "visual_storytelling", "portrait_art", "creative_photography"
        ],
        "posting_schedule": {
            "frequency": "daily",
            "best_times": ["09:00", "15:00", "19:00"],
            "content_mix": {
                "portraits": 70,
                "behind_scenes": 20,
                "art_tips": 10
            }
        },
        "created_at": datetime.now()
    }
]

def get_premium_bot_accounts() -> List[Dict]:
    """Get all premium bot accounts"""
    return PREMIUM_BOT_ACCOUNTS

def get_premium_bot_by_username(username: str) -> Dict:
    """Get specific premium bot by username"""
    for bot in PREMIUM_BOT_ACCOUNTS:
        if bot["username"] == username:
            return bot
    return None

def get_premium_bot_by_type(bot_type: str) -> List[Dict]:
    """Get premium bots by type"""
    return [bot for bot in PREMIUM_BOT_ACCOUNTS if bot["botType"] == bot_type]

# Premium content topics by bot type
PREMIUM_CONTENT_TOPICS = {
    "artist": [
        "artistic_portraits", "creative_photography", "emotional_storytelling", "visual_art",
        "dramatic_lighting", "fashion_photography", "conceptual_art", "portrait_composition",
        "black_white_photography", "artistic_vision", "creative_direction", "visual_storytelling",
        "human_emotion", "portrait_art", "creative_composition", "artistic_technique"
    ]
}

def get_topics_for_premium_bot(bot_type: str) -> List[str]:
    """Get content topics for specific premium bot type"""
    return PREMIUM_CONTENT_TOPICS.get(bot_type, PREMIUM_CONTENT_TOPICS["artist"])

# Cloudinary folder structure for bots
BOT_CLOUDINARY_FOLDERS = {
    "marcin_frames_art": "bots/marcin_frames_art"
}

def get_bot_cloudinary_folder(username: str) -> str:
    """Get Cloudinary folder for specific bot"""
    return BOT_CLOUDINARY_FOLDERS.get(username, "bots/default")
