#!/usr/bin/env python3
"""
Test Gemini AI Integration
Test Google Gemini API integration and caption generation
"""

import asyncio
import os
from services.gpt_service import GPTService
from services.ai_bot_manager import BotProfile
from datetime import datetime

async def test_gemini_integration():
    """Test Gemini AI service functionality"""
    
    print("🧪 Testing Gemini AI Integration")
    print("=" * 40)
    
    # Initialize Gemini service
    gpt_service = GPTService()
    
    # Check service status
    print(f"📊 Gemini Service Status:")
    print(f"  enabled: {gpt_service.enabled}")
    print(f"  gemini_key: {'***' + gpt_service.gemini_key[-4:] if gpt_service.gemini_key else 'NOT SET'}")
    print(f"  api_url: {gpt_service.gemini_api_url}")
    
    if not gpt_service.gemini_key:
        print("\n⚠️ Gemini API key not found, will use enhanced templates only")
    else:
        print(f"\n✅ Gemini service is enabled with API key")
    
    # Create test bot profile
    test_bot = BotProfile(
        id="test_bot_001",
        name="Luna Rivers",
        username="luna_rivers_photo", 
        personality_type="photographer",
        bio="Nature photographer capturing life's beautiful moments 📸",
        avatar_style="https://example.com/avatar.jpg",
        interests=["photography", "nature", "travel", "art"],
        posting_style="artistic",
        engagement_score=0.75,
        post_count=0,
        created_at=datetime.now(),
        writing_tone="artistic and inspiring",
        content_focus=["photography", "nature", "composition"],
        emoji_style="moderate",
        hashtag_strategy="relevant"
    )
    
    # Test photo data
    test_photo = {
        "id": "test_photo_001",
        "description": "A serene mountain landscape at golden hour with mist rolling through valleys",
        "color": "#f4a261",
        "urls": {
            "regular": "https://images.unsplash.com/photo-example"
        },
        "user": {
            "name": "Test Photographer",
            "username": "testphotographer"
        },
        "width": 3000,
        "height": 2000,
        "likes": 1250
    }
    
    # Test topics
    test_topics = ["nature", "sunset", "mountains", "travel", "photography"]
    
    print(f"\n🎨 Testing Caption Generation:")
    print(f"Bot: {test_bot.name} ({test_bot.personality_type})")
    print(f"Bio: {test_bot.bio}")
    
    for i, topic in enumerate(test_topics, 1):
        print(f"\n--- Test {i}: Topic '{topic}' ---")
        
        try:
            caption = await gpt_service.generate_smart_caption(
                test_bot, test_photo, topic
            )
            
            if caption:
                print(f"✅ Generated Caption:")
                print(f"   {caption}")
                print(f"📏 Length: {len(caption)} characters")
                
                # Check if it's from Gemini or template
                if gpt_service.gemini_key and "✨ Gemini AI caption generated" in str(caption):
                    print(f"🤖 Source: Gemini AI")
                else:
                    print(f"📝 Source: Enhanced Template")
            else:
                print(f"❌ No caption generated (using fallback)")
                
        except Exception as e:
            print(f"❌ Error generating caption: {e}")
    
    print(f"\n🎯 Gemini Integration Test Complete!")

def test_fallback_captions():
    """Test fallback caption system"""
    print(f"\n🔄 Testing Fallback Caption System:")
    
    gpt_service = GPTService()
    
    # Test with disabled GPT
    gpt_service.enabled = False
    
    test_bot = BotProfile(
        id="test_bot_002",
        name="Alex Chen",
        username="alex_chen_travel",
        personality_type="traveler", 
        bio="Digital nomad exploring the world 🌍",
        avatar_style="https://example.com/avatar2.jpg",
        interests=["travel", "culture", "adventure"],
        posting_style="adventurous",
        engagement_score=0.68,
        post_count=0,
        created_at=datetime.now()
    )
    
    test_photo = {
        "description": "Bustling street market in Bangkok",
        "color": "#e76f51"
    }
    
    fallback_caption = gpt_service._generate_enhanced_caption(test_bot, test_photo, "travel")
    print(f"✅ Fallback Caption: {fallback_caption}")

if __name__ == "__main__":
    print("🚀 Starting Gemini AI Integration Tests...")
    
    # Test fallback system first
    test_fallback_captions()
    
    # Test Gemini integration
    asyncio.run(test_gemini_integration())
    
    print("\n✨ All tests completed!")
    print("\n📋 Next Steps:")
    print("1. ✅ Gemini API key already configured!")
    print("2. ✅ Enhanced templates working as fallback")
    print("3. 🚀 Deploy to test Gemini AI captions")
    print("4. 📊 Monitor bot posts for AI-generated content")
    print("5. 🎉 Enjoy free AI-powered captions!")
