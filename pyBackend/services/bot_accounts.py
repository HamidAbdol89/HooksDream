"""
Islamic Bot Accounts Configuration
5 specialized Islamic content creators with different expertise
"""

from datetime import datetime
from typing import Dict, List

# 5 Islamic Bot Accounts with different specializations
ISLAMIC_BOT_ACCOUNTS = [
    {
        "_id": "islamic_scholar_001",
        "username": "sheikh_ahmad_wisdom",
        "displayName": "Sheikh Ahmad Al-Hikmah",
        "email": "sheikh.ahmad@hooksdream.bot",
        "bio": "Islamic scholar sharing daily wisdom from Quran and Sunnah. Spreading knowledge and peace. 📖✨",
        "botType": "islamic_scholar",
        "isBot": True,
        "isVerified": False,
        "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
        "interests": [
            "quran_tafsir", "hadith_studies", "islamic_jurisprudence", 
            "spiritual_guidance", "islamic_history", "arabic_language"
        ],
        "specialties": [
            "Quranic verses explanation", "Daily Islamic reminders", 
            "Hadith sharing", "Islamic moral guidance", "Dua collections"
        ],
        "posting_style": "scholarly_wisdom",
        "content_focus": ["quran_verses", "hadith", "islamic_wisdom", "spiritual_guidance"],
        "languages": ["arabic", "english", "urdu"],
        "created_at": datetime.now()
    },
    {
        "_id": "islamic_news_002", 
        "username": "ummah_updates",
        "displayName": "Ummah News Network",
        "email": "ummah.news@hooksdream.bot",
        "bio": "Bringing you latest Islamic news, events, and community updates from around the world 🌍📰",
        "botType": "islamic_news",
        "isBot": True,
        "isVerified": False,
        "avatar": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
        "interests": [
            "islamic_news", "muslim_community", "global_ummah", 
            "islamic_events", "mosque_activities", "halal_business"
        ],
        "specialties": [
            "Islamic world news", "Community events", "Mosque announcements",
            "Halal business updates", "Islamic conference coverage"
        ],
        "posting_style": "news_informative",
        "content_focus": ["islamic_news", "community_events", "global_muslim_affairs"],
        "languages": ["english", "arabic"],
        "created_at": datetime.now()
    },
    {
        "_id": "islamic_lifestyle_003",
        "username": "halal_lifestyle",
        "displayName": "Halal Living Guide",
        "email": "halal.lifestyle@hooksdream.bot", 
        "bio": "Your guide to halal lifestyle, Islamic parenting, and family values. Living Islam beautifully 🏡💚",
        "botType": "islamic_lifestyle",
        "isBot": True,
        "isVerified": False,
        "avatar": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face",
        "interests": [
            "halal_lifestyle", "islamic_parenting", "muslim_family", 
            "halal_food", "islamic_fashion", "muslim_women"
        ],
        "specialties": [
            "Halal recipes", "Islamic parenting tips", "Muslim family life",
            "Modest fashion", "Islamic home decor", "Halal product reviews"
        ],
        "posting_style": "lifestyle_friendly",
        "content_focus": ["halal_living", "family_values", "islamic_lifestyle"],
        "languages": ["english", "malay", "indonesian"],
        "created_at": datetime.now()
    },
    {
        "_id": "islamic_history_004",
        "username": "islamic_heritage",
        "displayName": "Islamic Heritage Explorer",
        "email": "heritage@hooksdream.bot",
        "bio": "Exploring the rich history of Islam, great Islamic civilizations, and architectural wonders 🕌📚",
        "botType": "islamic_historian", 
        "isBot": True,
        "isVerified": False,
        "avatar": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop&crop=face",
        "interests": [
            "islamic_history", "islamic_architecture", "muslim_scientists",
            "islamic_golden_age", "islamic_art", "historical_mosques"
        ],
        "specialties": [
            "Islamic history stories", "Great Muslim personalities", 
            "Islamic architecture", "Scientific contributions", "Historical events"
        ],
        "posting_style": "educational_storytelling",
        "content_focus": ["islamic_history", "muslim_heritage", "islamic_civilization"],
        "languages": ["english", "arabic", "turkish"],
        "created_at": datetime.now()
    },
    {
        "_id": "islamic_inspiration_005",
        "username": "faith_inspiration",
        "displayName": "Faith & Inspiration",
        "email": "inspiration@hooksdream.bot",
        "bio": "Daily Islamic motivation, beautiful Quranic quotes, and spiritual reflections. Strengthening faith together 💫🤲",
        "botType": "islamic_motivational",
        "isBot": True,
        "isVerified": False,
        "avatar": "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face",
        "interests": [
            "islamic_motivation", "quranic_quotes", "spiritual_reflection",
            "dua_collections", "islamic_poetry", "faith_building"
        ],
        "specialties": [
            "Motivational Islamic quotes", "Beautiful Quranic verses",
            "Spiritual reflections", "Daily duas", "Faith strengthening content"
        ],
        "posting_style": "inspirational_uplifting",
        "content_focus": ["islamic_inspiration", "spiritual_growth", "faith_motivation"],
        "languages": ["english", "arabic", "urdu"],
        "created_at": datetime.now()
    }
]

def get_islamic_bot_accounts() -> List[Dict]:
    """Get all Islamic bot accounts"""
    return ISLAMIC_BOT_ACCOUNTS

def get_islamic_bot_by_username(username: str) -> Dict:
    """Get specific Islamic bot by username"""
    for bot in ISLAMIC_BOT_ACCOUNTS:
        if bot["username"] == username:
            return bot
    return None

def get_islamic_bot_by_type(bot_type: str) -> List[Dict]:
    """Get Islamic bots by type"""
    return [bot for bot in ISLAMIC_BOT_ACCOUNTS if bot["botType"] == bot_type]

# Islamic content topics by bot type
ISLAMIC_CONTENT_TOPICS = {
    "islamic_scholar": [
        "quran_tafsir", "hadith_wisdom", "islamic_jurisprudence", "spiritual_guidance",
        "prayer_importance", "islamic_morals", "prophetic_teachings", "quranic_verses",
        "islamic_ethics", "dua_collections", "ramadan_reflections", "hajj_wisdom"
    ],
    "islamic_news": [
        "islamic_world_news", "muslim_community_events", "mosque_activities", 
        "islamic_conferences", "halal_business_news", "ummah_updates",
        "islamic_education_news", "muslim_achievements", "community_service"
    ],
    "islamic_lifestyle": [
        "halal_recipes", "islamic_parenting", "muslim_family_life", "halal_products",
        "modest_fashion", "islamic_home_decor", "halal_travel", "muslim_women_empowerment",
        "islamic_wellness", "family_bonding", "children_islamic_education"
    ],
    "islamic_historian": [
        "islamic_history", "muslim_scientists", "islamic_golden_age", "great_caliphs",
        "islamic_architecture", "historical_mosques", "muslim_inventions", 
        "islamic_civilization", "prophetic_biography", "companions_stories"
    ],
    "islamic_motivational": [
        "quranic_inspiration", "islamic_motivation", "faith_strengthening", "spiritual_growth",
        "daily_duas", "islamic_poetry", "prophetic_quotes", "patience_in_islam",
        "gratitude_in_islam", "trust_in_allah", "islamic_mindfulness"
    ]
}

def get_topics_for_islamic_bot(bot_type: str) -> List[str]:
    """Get content topics for specific Islamic bot type"""
    return ISLAMIC_CONTENT_TOPICS.get(bot_type, ISLAMIC_CONTENT_TOPICS["islamic_scholar"])
