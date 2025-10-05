#!/usr/bin/env python3
"""
Debug Gemini API Response Format
"""

import asyncio
from services.gpt_service import GPTService
from services.ai_bot_manager import BotProfile
from datetime import datetime

async def debug_gemini():
    print("🔍 Debugging Gemini API Response...")
    
    service = GPTService()
    
    # Create bot
    bot = BotProfile(
        id="debug_bot",
        name="Debug Bot",
        username="debugbot",
        personality_type="photographer",
        bio="Debug photographer",
        avatar_style="test",
        interests=["photography"],
        posting_style="artistic",
        created_at=datetime.now()
    )
    
    # Test photo
    photo = {"description": "Beautiful sunset"}
    
    print(f"🤖 Bot: {bot.name}")
    print(f"📸 Photo: {photo['description']}")
    print(f"🎯 Topic: sunset")
    
    # Call the method directly to see what happens
    try:
        result = await service._try_gemini_caption(bot, photo, "sunset")
        
        if result:
            print(f"✅ Gemini Success: {result}")
        else:
            print(f"❌ Gemini Failed - using fallback")
            
        # Also test fallback
        fallback = service._generate_enhanced_caption(bot, photo, "sunset")
        print(f"🔄 Fallback: {fallback}")
        
    except Exception as e:
        print(f"❌ Exception: {e}")

if __name__ == "__main__":
    asyncio.run(debug_gemini())
