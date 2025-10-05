#!/usr/bin/env python3
"""
Debug Bot Interactions
Check why bots are not liking/commenting on posts
"""

import asyncio
import httpx
import sys
import os

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from config import settings
import os
from dotenv import load_dotenv

# Load production environment
load_dotenv('.env.production')

async def debug_bot_interactions():
    """Debug bot interaction issues"""
    print("🔍 Debugging Bot Interactions")
    print("=" * 50)
    
    # Use production URL
    node_backend_url = os.getenv('NODE_BACKEND_URL', 'https://just-solace-production.up.railway.app')
    print(f"🔗 Node.js Backend: {node_backend_url}")
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        
        # 1. Check if Node.js backend is accessible
        print("\n1. 🌐 Testing Node.js Backend Connection...")
        try:
            response = await client.get(f"{node_backend_url}/health")
            if response.status_code == 200:
                print("✅ Node.js backend is accessible")
            else:
                print(f"⚠️ Node.js backend returned: {response.status_code}")
        except Exception as e:
            print(f"❌ Cannot connect to Node.js backend: {e}")
            return
        
        # 2. Check available bot accounts
        print("\n2. 🤖 Checking Bot Accounts...")
        try:
            response = await client.get(f"{node_backend_url}/api/users?isBot=true&limit=10")
            if response.status_code == 200:
                result = response.json()
                bots = result.get('data', [])
                print(f"✅ Found {len(bots)} bot accounts:")
                for bot in bots[:3]:  # Show first 3
                    print(f"   - {bot.get('displayName', 'Unknown')} (@{bot.get('username', 'unknown')})")
            else:
                print(f"⚠️ Bot accounts API returned: {response.status_code}")
                print(f"   Response: {response.text}")
        except Exception as e:
            print(f"❌ Error fetching bot accounts: {e}")
        
        # 3. Check available bot posts
        print("\n3. 📝 Checking Bot Posts...")
        try:
            response = await client.get(f"{node_backend_url}/api/posts?isBot=true&limit=5")
            if response.status_code == 200:
                result = response.json()
                posts = result.get('data', [])
                print(f"✅ Found {len(posts)} bot posts:")
                for post in posts[:2]:  # Show first 2
                    author = post.get('author', {})
                    print(f"   - '{post.get('content', '')[:50]}...' by {author.get('displayName', 'Unknown')}")
            else:
                print(f"⚠️ Bot posts API returned: {response.status_code}")
                print(f"   Response: {response.text}")
        except Exception as e:
            print(f"❌ Error fetching bot posts: {e}")
        
        # 4. Test like API endpoint
        print("\n4. 👍 Testing Like API Endpoint...")
        try:
            # Get a bot post to test with
            response = await client.get(f"{node_backend_url}/api/posts?isBot=true&limit=1")
            if response.status_code == 200:
                result = response.json()
                posts = result.get('data', [])
                if posts:
                    test_post = posts[0]
                    post_id = test_post.get('_id')
                    
                    # Test different like endpoints
                    endpoints_to_test = [
                        f"/api/posts/{post_id}/like",
                        f"/api/posts/{post_id}/likes",
                        f"/api/posts/{post_id}/toggle-like"
                    ]
                    
                    for endpoint in endpoints_to_test:
                        print(f"   Testing: {endpoint}")
                        try:
                            response = await client.post(
                                f"{node_backend_url}{endpoint}",
                                headers={"Content-Type": "application/json"}
                            )
                            print(f"   Status: {response.status_code}")
                            if response.status_code not in [200, 201, 401, 403]:
                                print(f"   Response: {response.text[:100]}")
                        except Exception as e:
                            print(f"   Error: {e}")
                else:
                    print("⚠️ No bot posts available for testing")
            else:
                print("⚠️ Cannot get posts for testing")
        except Exception as e:
            print(f"❌ Error testing like API: {e}")
        
        # 5. Test comment API endpoint
        print("\n5. 💬 Testing Comment API Endpoint...")
        try:
            # Get a bot post to test with
            response = await client.get(f"{node_backend_url}/api/posts?isBot=true&limit=1")
            if response.status_code == 200:
                result = response.json()
                posts = result.get('data', [])
                if posts:
                    test_post = posts[0]
                    post_id = test_post.get('_id')
                    
                    # Test comment endpoint
                    endpoint = f"/api/posts/{post_id}/comments"
                    print(f"   Testing: {endpoint}")
                    try:
                        response = await client.post(
                            f"{node_backend_url}{endpoint}",
                            json={"content": "Test comment from debug script"},
                            headers={"Content-Type": "application/json"}
                        )
                        print(f"   Status: {response.status_code}")
                        if response.status_code not in [200, 201, 401, 403]:
                            print(f"   Response: {response.text[:100]}")
                    except Exception as e:
                        print(f"   Error: {e}")
                else:
                    print("⚠️ No bot posts available for testing")
            else:
                print("⚠️ Cannot get posts for testing")
        except Exception as e:
            print(f"❌ Error testing comment API: {e}")
        
        # 6. Check interaction service configuration
        print("\n6. ⚙️ Bot Interaction Service Configuration...")
        print(f"   BOT_ENABLED: {settings.BOT_ENABLED}")
        print(f"   BOT_INTERVAL_MINUTES: {settings.BOT_INTERVAL_MINUTES}")
        print(f"   NODE_BACKEND_URL: {settings.NODE_BACKEND_URL}")
        
        # 7. Summary and recommendations
        print("\n7. 📋 Summary & Recommendations:")
        print("   - Check if Node.js backend has proper API endpoints")
        print("   - Verify authentication requirements for bot actions")
        print("   - Ensure bot posts exist for interactions")
        print("   - Check if bot interaction scheduler is running")
        print("   - Monitor Python backend logs for interaction attempts")

async def main():
    """Main debug function"""
    print("🚀 Bot Interaction Debug Tool")
    print("=" * 60)
    
    await debug_bot_interactions()
    
    print(f"\n✨ Debug completed!")
    print(f"💡 Next steps:")
    print(f"   1. Fix any API endpoint issues found")
    print(f"   2. Add proper authentication for bot actions")
    print(f"   3. Test bot interactions manually")
    print(f"   4. Monitor bot interaction logs")

if __name__ == "__main__":
    # Run the debug
    asyncio.run(main())
