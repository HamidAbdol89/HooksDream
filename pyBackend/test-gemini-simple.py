#!/usr/bin/env python3
"""
Simple Gemini API Test
"""

import asyncio
from services.gpt_service import GPTService
from services.ai_bot_manager import BotProfile
from datetime import datetime

async def test_gemini():
    print("🧪 Testing Gemini API...")
    
    service = GPTService()
    
    # Create simple bot
    bot = BotProfile(
        id="test_1",
        name="Test Bot",
        username="testbot",
        personality_type="photographer",
        bio="Test photographer",
        avatar_style="test",
        interests=["photography"],
        posting_style="artistic",
        created_at=datetime.now()
    )
    
    # Test photo
    photo = {"description": "Beautiful sunset over mountains"}
    
    # Generate caption
    result = await service.generate_smart_caption(bot, photo, "sunset")
    
    print(f"✅ Generated Caption: {result}")
    print(f"📏 Length: {len(result)} characters")

if __name__ == "__main__":
    asyncio.run(test_gemini())
