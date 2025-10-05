#!/usr/bin/env python3
"""
Bot Monitoring Script
Monitor your deployed bot on Fly.io
"""

import requests
import time
import json
from datetime import datetime
import sys

BOT_URL = "https://hooksdream.fly.dev"
BACKEND_URL = "https://just-solace-production.up.railway.app"

def colored_print(message, color="white"):
    """Print colored messages"""
    colors = {
        "red": "\033[91m",
        "green": "\033[92m", 
        "yellow": "\033[93m",
        "blue": "\033[94m",
        "purple": "\033[95m",
        "cyan": "\033[96m",
        "white": "\033[97m",
        "reset": "\033[0m"
    }
    print(f"{colors.get(color, colors['white'])}{message}{colors['reset']}")

def test_bot_health():
    """Test if bot is responding"""
    try:
        response = requests.get(f"{BOT_URL}/health", timeout=10)
        if response.status_code == 200:
            colored_print("✅ Bot health check: OK", "green")
            return True
        else:
            colored_print(f"❌ Bot health check failed: {response.status_code}", "red")
            return False
    except requests.exceptions.RequestException as e:
        colored_print(f"❌ Bot health check error: {e}", "red")
        return False

def test_bot_status():
    """Test bot status endpoint"""
    try:
        response = requests.get(f"{BOT_URL}/api/bot/status", timeout=15)
        if response.status_code == 200:
            data = response.json()
            colored_print("✅ Bot status: Active", "green")
            colored_print(f"📊 Status: {json.dumps(data, indent=2)}", "cyan")
            return True
        else:
            colored_print(f"❌ Bot status failed: {response.status_code}", "red")
            return False
    except requests.exceptions.RequestException as e:
        colored_print(f"❌ Bot status error: {e}", "red")
        return False

def test_bot_stats():
    """Test bot statistics"""
    try:
        response = requests.get(f"{BOT_URL}/api/bot/stats", timeout=15)
        if response.status_code == 200:
            data = response.json()
            colored_print("✅ Bot statistics available", "green")
            colored_print(f"📈 Stats: {json.dumps(data, indent=2)}", "cyan")
            return True
        else:
            colored_print(f"❌ Bot stats failed: {response.status_code}", "red")
            return False
    except requests.exceptions.RequestException as e:
        colored_print(f"❌ Bot stats error: {e}", "red")
        return False

def test_backend_connection():
    """Test if backend is reachable"""
    try:
        response = requests.get(f"{BACKEND_URL}/api/health", timeout=10)
        if response.status_code == 200:
            colored_print("✅ Backend connection: OK", "green")
            colored_print(f"🔗 Backend URL: {BACKEND_URL}", "blue")
            return True
        else:
            colored_print(f"❌ Backend connection failed: {response.status_code}", "red")
            return False
    except requests.exceptions.RequestException as e:
        colored_print(f"❌ Backend connection error: {e}", "red")
        return False

def create_test_post():
    """Create a test post"""
    try:
        payload = {"topic": "nature", "count": 1}
        response = requests.post(
            f"{BOT_URL}/api/bot/create-post",
            json=payload,
            timeout=30
        )
        if response.status_code == 200:
            data = response.json()
            colored_print("✅ Test post created successfully!", "green")
            colored_print(f"📝 Response: {json.dumps(data, indent=2)}", "cyan")
            return True
        else:
            colored_print(f"❌ Test post failed: {response.status_code}", "red")
            try:
                error_data = response.json()
                colored_print(f"📄 Error: {json.dumps(error_data, indent=2)}", "yellow")
            except:
                colored_print(f"📄 Error response: {response.text}", "yellow")
            return False
    except requests.exceptions.RequestException as e:
        colored_print(f"❌ Test post error: {e}", "red")
        return False

def wait_for_startup():
    """Wait for bot to start up"""
    colored_print("⏳ Waiting for bot to start up...", "yellow")
    colored_print("🔄 Render services can take 1-2 minutes for cold start", "blue")
    
    max_attempts = 12
    for attempt in range(1, max_attempts + 1):
        colored_print(f"🔍 Attempt {attempt}/{max_attempts}...", "blue")
        
        if test_bot_health():
            colored_print("🎉 Bot is now online!", "green")
            return True
        
        if attempt < max_attempts:
            colored_print("⏱️ Still starting... (waiting 10 seconds)", "yellow")
            time.sleep(10)
    
    colored_print("❌ Bot did not start within expected time", "red")
    colored_print("💡 Check Render logs for more details", "yellow")
    return False

def monitor_continuously():
    """Monitor bot continuously"""
    colored_print("📊 Monitoring bot continuously (Ctrl+C to stop)...", "purple")
    
    try:
        while True:
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            colored_print(f"\n--- {timestamp} ---", "purple")
            
            # Test bot health
            bot_healthy = test_bot_health()
            
            # Test backend connection
            backend_healthy = test_backend_connection()
            
            # If both are healthy, get stats
            if bot_healthy and backend_healthy:
                test_bot_stats()
            
            colored_print("⏱️ Next check in 30 seconds...", "blue")
            time.sleep(30)
            
    except KeyboardInterrupt:
        colored_print("\n👋 Monitoring stopped by user", "yellow")

def run_all_tests():
    """Run all tests"""
    colored_print("🧪 Running comprehensive bot tests...\n", "purple")
    
    tests = [
        ("Backend Connection", test_backend_connection),
        ("Bot Health", test_bot_health),
        ("Bot Status", test_bot_status),
        ("Bot Statistics", test_bot_stats)
    ]
    
    results = {}
    for test_name, test_func in tests:
        colored_print(f"🔍 Testing: {test_name}", "blue")
        results[test_name] = test_func()
        print()
    
    # Summary
    colored_print("📋 Test Summary:", "purple")
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        color = "green" if result else "red"
        colored_print(f"  {test_name}: {status}", color)
    
    # Ask for manual post test
    try:
        user_input = input("\n🤔 Would you like to create a test post? (y/n): ")
        if user_input.lower() in ['y', 'yes']:
            colored_print("\n✍️ Creating test post...", "blue")
            create_test_post()
    except KeyboardInterrupt:
        colored_print("\n👋 Test cancelled by user", "yellow")

def main():
    """Main function"""
    colored_print("🤖 HooksDream Bot Monitor", "purple")
    colored_print("=" * 30, "purple")
    colored_print(f"🔗 Bot URL: {BOT_URL}", "blue")
    colored_print(f"🔗 Backend URL: {BACKEND_URL}", "blue")
    print()
    
    while True:
        colored_print("Choose an option:", "white")
        colored_print("1) Wait for bot startup", "white")
        colored_print("2) Test bot health", "white")
        colored_print("3) Test bot status", "white")
        colored_print("4) Test bot statistics", "white")
        colored_print("5) Test backend connection", "white")
        colored_print("6) Create test post", "white")
        colored_print("7) Run all tests", "white")
        colored_print("8) Monitor continuously", "white")
        colored_print("9) Exit", "white")
        
        try:
            choice = input("\nEnter your choice (1-9): ").strip()
            print()
            
            if choice == "1":
                wait_for_startup()
            elif choice == "2":
                test_bot_health()
            elif choice == "3":
                test_bot_status()
            elif choice == "4":
                test_bot_stats()
            elif choice == "5":
                test_backend_connection()
            elif choice == "6":
                create_test_post()
            elif choice == "7":
                run_all_tests()
            elif choice == "8":
                monitor_continuously()
            elif choice == "9":
                colored_print("👋 Goodbye!", "green")
                sys.exit(0)
            else:
                colored_print("❌ Invalid option. Please choose 1-9.", "red")
                
        except KeyboardInterrupt:
            colored_print("\n👋 Goodbye!", "green")
            sys.exit(0)
        except Exception as e:
            colored_print(f"❌ Error: {e}", "red")
        
        print()

if __name__ == "__main__":
    main()
