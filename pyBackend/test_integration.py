#!/usr/bin/env python3
"""
Test script for Python + Node.js integration
"""

import asyncio
import httpx
from services.unsplash_service import UnsplashService
from services.bot_service import BotService
from config import settings

async def test_unsplash_service():
    """Test Unsplash API integration"""
    print("🧪 Testing Unsplash Service...")
    
    unsplash = UnsplashService()
    
    # Test random photos
    photos = await unsplash.get_random_photos(count=2, query="nature")
    print(f"✅ Fetched {len(photos)} random photos")
    
    if photos:
        photo = photos[0]
        print(f"📸 Sample photo: {photo['description'][:50]}...")
        print(f"👤 By: {photo['user']['name']}")
    
    # Test trending topics
    topics = await unsplash.get_trending_topics()
    print(f"✅ Got {len(topics)} trending topics: {topics}")
    
    return len(photos) > 0

async def test_bot_service():
    """Test bot content generation"""
    print("\n🤖 Testing Bot Service...")
    
    unsplash = UnsplashService()
    bot = BotService(unsplash)
    
    # Test single post creation
    post_data = await bot.create_single_post("technology")
    
    if post_data:
        print("✅ Bot post created successfully!")
        print(f"📝 Content preview: {post_data.get('content', '')[:100]}...")
        return True
    else:
        print("❌ Failed to create bot post")
        return False

async def test_node_backend_connection():
    """Test connection to Node.js backend"""
    print("\n🔗 Testing Node.js Backend Connection...")
    
    try:
        async with httpx.AsyncClient() as client:
            # Test health endpoint
            response = await client.get(f"{settings.NODE_BACKEND_URL}/api/health")
            
            if response.status_code == 200:
                print("✅ Node.js backend is running")
                health_data = response.json()
                print(f"📊 DB Status: {health_data.get('db', 'unknown')}")
                return True
            else:
                print(f"❌ Node.js backend returned status: {response.status_code}")
                return False
                
    except Exception as e:
        print(f"❌ Cannot connect to Node.js backend: {e}")
        print(f"🔧 Make sure Node.js server is running on {settings.NODE_BACKEND_URL}")
        return False

async def test_full_integration():
    """Test full Python → Node.js integration"""
    print("\n🔄 Testing Full Integration...")
    
    # Check if Node.js backend is available
    node_available = await test_node_backend_connection()
    
    if not node_available:
        print("⚠️ Skipping integration test - Node.js backend not available")
        return False
    
    # Create bot service
    unsplash = UnsplashService()
    bot = BotService(unsplash)
    
    # Try to create and send a post
    try:
        print("🚀 Creating automated post...")
        posts = await bot.create_automated_posts()
        
        if posts and len(posts) > 0:
            print(f"✅ Successfully created {len(posts)} posts via integration!")
            for i, post in enumerate(posts, 1):
                print(f"   {i}. {post.get('message', 'Post created')}")
            return True
        else:
            print("❌ No posts were created")
            return False
            
    except Exception as e:
        print(f"❌ Integration test failed: {e}")
        return False

async def main():
    """Run all tests"""
    print("🧪 HooksDream Python Backend Integration Tests")
    print("=" * 50)
    
    results = []
    
    # Test individual services
    results.append(await test_unsplash_service())
    results.append(await test_bot_service())
    
    # Test integration
    results.append(await test_full_integration())
    
    # Summary
    print("\n📊 Test Results Summary:")
    print("=" * 30)
    
    tests = [
        "Unsplash Service",
        "Bot Service", 
        "Full Integration"
    ]
    
    for i, (test_name, result) in enumerate(zip(tests, results)):
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{i+1}. {test_name}: {status}")
    
    total_passed = sum(results)
    print(f"\n🎯 Total: {total_passed}/{len(results)} tests passed")
    
    if total_passed == len(results):
        print("🎉 All tests passed! System is ready for production.")
    else:
        print("⚠️ Some tests failed. Please check the configuration.")

if __name__ == "__main__":
    asyncio.run(main())
