#!/usr/bin/env python3
"""
Quick test script to verify bot_account fix
"""

import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.smart_content_generator import SmartContentGenerator
from services.unsplash_service import UnsplashService

async def test_bot_account_fix():
    """Test that bot_account is properly included in post_data"""
    
    print("🧪 Testing bot_account fix...")
    
    # Mock bot account
    test_bot_account = {
        "_id": "test_bot_123",
        "username": "test_bot",
        "displayName": "Test Bot",
        "bio": "Test bot for verification",
        "botType": "tech",
        "interests": ["testing", "verification"],
        "avatar": "https://example.com/avatar.jpg"
    }
    
    # Initialize services
    unsplash_service = UnsplashService()
    content_generator = SmartContentGenerator(unsplash_service)
    
    try:
        # Test text-only post generation
        print("📝 Testing text-only post generation...")
        text_post = await content_generator._generate_text_only_post(test_bot_account, "testing")
        
        if text_post:
            # Check if bot_account is present
            if "bot_account" in text_post:
                print("✅ bot_account found in text-only post data")
                print(f"   Bot: {text_post['bot_account'].get('displayName')}")
                print(f"   Content: {text_post['content'][:50]}...")
            else:
                print("❌ bot_account missing in text-only post data")
                print(f"   Keys: {list(text_post.keys())}")
        else:
            print("❌ Failed to generate text-only post")
        
        # Test image post generation (if Unsplash API is working)
        print("\n📸 Testing image post generation...")
        try:
            image_post = await content_generator._generate_post_for_bot_account(test_bot_account, "testing", 1)
            
            if image_post:
                if "bot_account" in image_post:
                    print("✅ bot_account found in image post data")
                    print(f"   Bot: {image_post['bot_account'].get('displayName')}")
                    print(f"   Images: {len(image_post.get('images', []))}")
                else:
                    print("❌ bot_account missing in image post data")
                    print(f"   Keys: {list(image_post.keys())}")
            else:
                print("⚠️ Image post generation failed (likely due to Unsplash rate limit)")
        except Exception as e:
            print(f"⚠️ Image post test failed: {e}")
        
        print("\n🎯 Test Summary:")
        print("- Text-only posts should now include bot_account")
        print("- Image posts should now include bot_account")
        print("- This should fix the 'No bot account data in post_data' error")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_bot_account_fix())
