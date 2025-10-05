#!/bin/bash

# Test Bot Deployment Script
# Test your deployed bot on Fly.io

BOT_URL="https://hooksdream.fly.dev"

echo "🤖 Testing HooksDream Bot on Fly.io"
echo "=================================="
echo "🔗 Bot URL: $BOT_URL"
echo ""

# Function to test bot status
test_status() {
    echo "📊 Testing bot status..."
    
    response=$(curl -s -w "%{http_code}" -o /tmp/bot_response.json "$BOT_URL/api/bot/status" 2>/dev/null)
    http_code="${response: -3}"
    
    if [ "$http_code" = "200" ]; then
        echo "✅ Bot is running!"
        echo "📋 Status response:"
        cat /tmp/bot_response.json | python -m json.tool 2>/dev/null || cat /tmp/bot_response.json
    else
        echo "❌ Bot not responding (HTTP: $http_code)"
        echo "🔄 Bot might be starting up (Render cold start can take 1-2 minutes)"
    fi
    echo ""
}

# Function to test bot stats
test_stats() {
    echo "📈 Testing bot statistics..."
    
    response=$(curl -s -w "%{http_code}" -o /tmp/bot_stats.json "$BOT_URL/api/bot/stats" 2>/dev/null)
    http_code="${response: -3}"
    
    if [ "$http_code" = "200" ]; then
        echo "✅ Bot stats available!"
        echo "📊 Statistics:"
        cat /tmp/bot_stats.json | python -m json.tool 2>/dev/null || cat /tmp/bot_stats.json
    else
        echo "❌ Bot stats not available (HTTP: $http_code)"
    fi
    echo ""
}

# Function to create manual post
test_create_post() {
    echo "✍️ Testing manual post creation..."
    
    response=$(curl -s -w "%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -d '{"topic": "nature", "count": 1}' \
        -o /tmp/bot_create.json \
        "$BOT_URL/api/bot/create-post" 2>/dev/null)
    http_code="${response: -3}"
    
    if [ "$http_code" = "200" ]; then
        echo "✅ Manual post created successfully!"
        echo "📝 Response:"
        cat /tmp/bot_create.json | python -m json.tool 2>/dev/null || cat /tmp/bot_create.json
    else
        echo "❌ Failed to create post (HTTP: $http_code)"
        if [ -f /tmp/bot_create.json ]; then
            echo "📄 Error response:"
            cat /tmp/bot_create.json
        fi
    fi
    echo ""
}

# Function to check if bot is connecting to backend
test_backend_connection() {
    echo "🔗 Testing backend connection..."
    
    backend_url="https://just-solace-production.up.railway.app"
    response=$(curl -s -w "%{http_code}" -o /tmp/backend_health.json "$backend_url/api/health" 2>/dev/null)
    http_code="${response: -3}"
    
    if [ "$http_code" = "200" ]; then
        echo "✅ Backend is reachable!"
        echo "🔗 Backend URL: $backend_url"
    else
        echo "❌ Backend not reachable (HTTP: $http_code)"
        echo "🔗 Backend URL: $backend_url"
    fi
    echo ""
}

# Function to wait for bot startup
wait_for_bot() {
    echo "⏳ Waiting for bot to start up..."
    echo "🔄 Render services can take 1-2 minutes for cold start"
    
    max_attempts=12
    attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        echo "🔍 Attempt $attempt/$max_attempts..."
        
        response=$(curl -s -w "%{http_code}" -o /dev/null "$BOT_URL/health" 2>/dev/null)
        http_code="${response: -3}"
        
        if [ "$http_code" = "200" ]; then
            echo "✅ Bot is now online!"
            return 0
        fi
        
        echo "⏱️ Still starting... (waiting 10 seconds)"
        sleep 10
        attempt=$((attempt + 1))
    done
    
    echo "❌ Bot did not start within expected time"
    echo "💡 Check Render logs for more details"
    return 1
}

# Function to show menu
show_menu() {
    echo "Choose test option:"
    echo "1) Wait for bot startup"
    echo "2) Test bot status"
    echo "3) Test bot statistics"
    echo "4) Test backend connection"
    echo "5) Create manual post"
    echo "6) Run all tests"
    echo "7) Monitor bot (continuous)"
    echo "8) Exit"
    echo ""
}

# Function to monitor bot continuously
monitor_bot() {
    echo "📊 Monitoring bot continuously (Ctrl+C to stop)..."
    echo ""
    
    while true; do
        echo "$(date): Checking bot status..."
        test_status
        echo "---"
        sleep 30
    done
}

# Function to run all tests
run_all_tests() {
    echo "🧪 Running all bot tests..."
    echo ""
    
    test_backend_connection
    test_status
    test_stats
    
    echo "🤔 Would you like to create a test post? (y/n)"
    read -r create_post
    if [ "$create_post" = "y" ] || [ "$create_post" = "Y" ]; then
        test_create_post
    fi
    
    echo "✅ All tests completed!"
}

# Main menu
while true; do
    show_menu
    read -p "Enter your choice (1-8): " choice
    
    case $choice in
        1)
            wait_for_bot
            ;;
        2)
            test_status
            ;;
        3)
            test_stats
            ;;
        4)
            test_backend_connection
            ;;
        5)
            test_create_post
            ;;
        6)
            run_all_tests
            ;;
        7)
            monitor_bot
            ;;
        8)
            echo "👋 Goodbye!"
            exit 0
            ;;
        *)
            echo "❌ Invalid option. Please choose 1-8."
            ;;
    esac
done
