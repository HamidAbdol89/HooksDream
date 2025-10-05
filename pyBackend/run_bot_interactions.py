#!/usr/bin/env python3
"""
Run Bot Interactions Immediately
Test bot like/comment functionality right now
"""

import asyncio
import sys
import os
from dotenv import load_dotenv

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Load production environment
load_dotenv('.env.production')

from services.bot_interaction_service import BotInteractionService

async def run_bot_interactions():
    """Run bot interactions immediately for testing"""
    print("🚀 Running Bot Interactions Test")
    print("=" * 50)
    
    # Initialize bot interaction service
    node_backend_url = os.getenv('NODE_BACKEND_URL', 'https://just-solace-production.up.railway.app')
    bot_interaction_service = BotInteractionService(node_backend_url)
    print(f"💬 Bot interaction service initialized with {node_backend_url}")
    
    # Run one cycle of interactions immediately
    print("\n🎯 Running interaction cycle...")
    try:
        await bot_interaction_service.perform_smart_interactions()
        print("✅ Interaction cycle completed!")
    except Exception as e:
        print(f"❌ Error running interactions: {e}")
    
    print("\n📊 Check your backend to see bot likes/comments!")
    print("🔗 Node.js Backend:", node_backend_url)
    print("🔗 Python Backend: https://hooks-dream-bot.vercel.app")

async def main():
    """Main function"""
    print("🤖 Bot Interaction Test Tool")
    print("=" * 60)
    
    await run_bot_interactions()
    
    print(f"\n✨ Test completed!")
    print(f"💡 If successful, bots should now be liking and commenting!")
    print(f"🔄 To run continuously, start the main Python backend")

if __name__ == "__main__":
    # Run the test
    asyncio.run(main())
