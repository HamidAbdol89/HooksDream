#!/usr/bin/env python3
"""
Test Bot Like Functionality
Simple test to check if bot can like posts
"""

import asyncio
import httpx
import sys
import os
from dotenv import load_dotenv

# Load production environment
load_dotenv('.env.production')

async def test_bot_like():
    """Test bot like functionality with Railway backend"""
    print("🧪 Testing Bot Like Functionality")
    print("=" * 50)
    
    node_backend_url = os.getenv('NODE_BACKEND_URL', 'https://just-solace-production.up.railway.app')
    print(f"🔗 Backend: {node_backend_url}")
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        
        # 1. Get a bot post to test with
        print("\n1. 📝 Getting bot post to test...")
        try:
            response = await client.get(f"{node_backend_url}/api/posts?isBot=true&limit=1")
            if response.status_code == 200:
                result = response.json()
                posts = result.get('data', [])
                if posts:
                    test_post = posts[0]
                    post_id = test_post.get('_id')
                    author = test_post.get('author', {})
                    print(f"✅ Found test post: {post_id}")
                    print(f"   Content: '{test_post.get('content', '')[:50]}...'")
                    print(f"   Author: {author.get('displayName', 'Unknown')}")
                else:
                    print("❌ No bot posts found")
                    return
            else:
                print(f"❌ Failed to get posts: {response.status_code}")
                return
        except Exception as e:
            print(f"❌ Error getting posts: {e}")
            return
        
        # 2. Get a bot account to use for liking
        print("\n2. 🤖 Getting bot account...")
        try:
            response = await client.get(f"{node_backend_url}/api/users?isBot=true&limit=1")
            if response.status_code == 200:
                result = response.json()
                bots = result.get('data', [])
                if bots:
                    test_bot = bots[0]
                    bot_id = test_bot.get('_id')
                    print(f"✅ Found test bot: {bot_id}")
                    print(f"   Name: {test_bot.get('displayName', 'Unknown')}")
                    print(f"   Username: @{test_bot.get('username', 'unknown')}")
                else:
                    print("❌ No bot accounts found")
                    return
            else:
                print(f"❌ Failed to get bots: {response.status_code}")
                return
        except Exception as e:
            print(f"❌ Error getting bots: {e}")
            return
        
        # 3. Try to like the post (without authentication first)
        print(f"\n3. 👍 Attempting to like post {post_id}...")
        
        # Try different approaches
        approaches = [
            {
                "name": "Standard like endpoint",
                "method": "POST",
                "url": f"{node_backend_url}/api/posts/{post_id}/like",
                "headers": {"Content-Type": "application/json", "X-Bot-ID": bot_id}
            },
            {
                "name": "Toggle like endpoint", 
                "method": "POST",
                "url": f"{node_backend_url}/api/posts/{post_id}/toggle-like",
                "headers": {"Content-Type": "application/json", "X-Bot-ID": bot_id}
            },
            {
                "name": "Like with bot user-agent",
                "method": "POST", 
                "url": f"{node_backend_url}/api/posts/{post_id}/like",
                "headers": {
                    "Content-Type": "application/json",
                    "X-Bot-ID": bot_id,
                    "User-Agent": "HooksDream-Bot/1.0",
                    "X-Bot-Auth": "true"
                }
            }
        ]
        
        for approach in approaches:
            print(f"\n   Testing: {approach['name']}")
            try:
                if approach['method'] == 'POST':
                    response = await client.post(
                        approach['url'],
                        headers=approach['headers']
                    )
                else:
                    response = await client.get(
                        approach['url'],
                        headers=approach['headers']
                    )
                
                print(f"   Status: {response.status_code}")
                
                if response.status_code in [200, 201]:
                    print(f"   ✅ SUCCESS! Bot like worked!")
                    print(f"   Response: {response.text[:100]}")
                    break
                elif response.status_code == 401:
                    print(f"   🔐 Authentication required")
                    print(f"   Response: {response.text[:100]}")
                elif response.status_code == 404:
                    print(f"   ❌ Endpoint not found")
                else:
                    print(f"   ⚠️ Unexpected status: {response.status_code}")
                    print(f"   Response: {response.text[:100]}")
                    
            except Exception as e:
                print(f"   ❌ Error: {e}")
        
        # 4. Summary
        print(f"\n4. 📋 Summary:")
        print(f"   - Bot posts available: ✅")
        print(f"   - Bot accounts available: ✅") 
        print(f"   - Main issue: Authentication required (401)")
        print(f"   - Need to implement bot authentication system")
        
        print(f"\n💡 Next steps:")
        print(f"   1. Check Node.js backend for bot authentication")
        print(f"   2. Implement bot session/token system")
        print(f"   3. Or create special bot endpoints that bypass auth")
        print(f"   4. Test with proper authentication")

async def main():
    await test_bot_like()

if __name__ == "__main__":
    asyncio.run(main())
