#!/bin/bash

# Python AI Bot Deployment Script
# Deploy only the Python bot to connect with existing backend

set -e

echo "🤖 Python AI Bot Deployment"
echo "============================"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "📝 Please copy .env.example to .env and fill in your values"
    echo "🔗 Make sure NODE_BACKEND_URL points to your existing backend"
    exit 1
fi

# Load environment variables
source .env

# Function to deploy to Railway (Recommended for bots)
deploy_railway() {
    echo "🚂 Deploying Python Bot to Railway..."
    
    # Install Railway CLI if not present
    if ! command -v railway &> /dev/null; then
        echo "📦 Installing Railway CLI..."
        npm install -g @railway/cli
    fi
    
    # Login to Railway
    railway login
    
    # Create new project for bot
    railway link
    
    # Set production environment variables
    railway variables set ENVIRONMENT="production"
    railway variables set NODE_BACKEND_URL="$NODE_BACKEND_URL"
    railway variables set UNSPLASH_ACCESS_KEY="$UNSPLASH_ACCESS_KEY"
    railway variables set BOT_ENABLED="$BOT_ENABLED"
    railway variables set BOT_INTERVAL_MINUTES="$BOT_INTERVAL_MINUTES"
    railway variables set BOT_POSTS_PER_RUN="$BOT_POSTS_PER_RUN"
    railway variables set PORT="8001"
    
    # Deploy
    railway up
    
    echo "✅ Python Bot deployed to Railway!"
    echo "🤖 Bot will start posting automatically to your existing backend"
    echo "🌍 Environment: production"
}

# Function to deploy to Fly.io
deploy_flyio() {
    echo "🚀 Deploying Python Bot to Fly.io..."
    echo "📋 Steps for Fly.io deployment:"
    echo "1. Install flyctl: curl -L https://fly.io/install.sh | sh"
    echo "2. Login: flyctl auth login"
    echo "3. Launch app: flyctl launch"
    echo "4. Set environment variables:"
    echo "   flyctl secrets set NODE_BACKEND_URL=$NODE_BACKEND_URL"
    echo "   flyctl secrets set UNSPLASH_ACCESS_KEY=$UNSPLASH_ACCESS_KEY"
    echo "   flyctl secrets set PEXELS_API_KEY=$PEXELS_API_KEY"
    echo "   flyctl secrets set BOT_ENABLED=true"
    echo "   flyctl secrets set BOT_INTERVAL_MINUTES=30"
    echo "   flyctl secrets set BOT_POSTS_PER_RUN=3"
    echo "5. Deploy: flyctl deploy"
    echo ""
    echo "✅ Your bot will be available at: https://your-app-name.fly.dev"
}

# Function to deploy to Render (legacy)
deploy_render() {
    echo "🎨 Deploying Python Bot to Render..."
    echo "📋 Manual steps for Render:"
    echo "1. Go to render.com and create new Web Service"
    echo "2. Connect this repository"
    echo "3. Set Build Command: pip install -r requirements.txt"
    echo "4. Set Start Command: python run.py"
    echo "5. Set environment variables:"
    echo "   - NODE_BACKEND_URL: $NODE_BACKEND_URL"
    echo "   - UNSPLASH_ACCESS_KEY: $UNSPLASH_ACCESS_KEY"
    echo "   - PEXELS_API_KEY: $PEXELS_API_KEY"
    echo "   - BOT_ENABLED: true"
    echo "   - BOT_INTERVAL_MINUTES: 30"
    echo "   - BOT_POSTS_PER_RUN: 3"
}

# Function to deploy to Heroku
deploy_heroku() {
    echo "🟣 Deploying Python Bot to Heroku..."
    
    # Check if Heroku CLI is installed
    if ! command -v heroku &> /dev/null; then
        echo "❌ Heroku CLI not found!"
        echo "📦 Please install Heroku CLI: https://devcenter.heroku.com/articles/heroku-cli"
        exit 1
    fi
    
    # Login to Heroku
    heroku login
    
    # Create app for bot
    heroku create hooksdream-ai-bot
    
    # Set environment variables
    heroku config:set NODE_BACKEND_URL="$NODE_BACKEND_URL"
    heroku config:set UNSPLASH_ACCESS_KEY="$UNSPLASH_ACCESS_KEY"
    heroku config:set PEXELS_API_KEY="$PEXELS_API_KEY"
    heroku config:set BOT_ENABLED="$BOT_ENABLED"
    heroku config:set BOT_INTERVAL_MINUTES="$BOT_INTERVAL_MINUTES"
    heroku config:set BOT_POSTS_PER_RUN="$BOT_POSTS_PER_RUN"
    
    echo "✅ Heroku app created!"
    echo "📤 Deploy with: git push heroku main"
}

# Function to run locally with Docker
run_local() {
    echo "🏠 Running Python Bot locally with Docker..."
    
    # Build and start bot service
    docker-compose up --build -d
    
    echo "✅ Python Bot started!"
    echo "🤖 Bot API: http://localhost:8001"
    echo "📊 Bot Status: http://localhost:8001/api/bot/status"
    echo "🔗 Connecting to: $NODE_BACKEND_URL"
    
    # Show logs
    docker-compose logs -f python-bot
}

# Function to stop local bot
stop_local() {
    echo "🛑 Stopping Python Bot..."
    docker-compose down
    echo "✅ Bot stopped!"
}

# Function to test bot connection
test_connection() {
    echo "🔍 Testing connection to existing backend..."
    
    if curl -f "$NODE_BACKEND_URL/api/health" > /dev/null 2>&1; then
        echo "✅ Backend connection successful!"
        echo "🔗 Connected to: $NODE_BACKEND_URL"
    else
        echo "❌ Cannot connect to backend: $NODE_BACKEND_URL"
        echo "🔧 Please check your NODE_BACKEND_URL in .env file"
        exit 1
    fi
}

# Function to show menu
show_menu() {
    echo ""
    echo "Choose deployment option:"
    echo "1) Test connection to existing backend"
    echo "2) Run bot locally with Docker"
    echo "3) Deploy to Fly.io (Recommended)"
    echo "4) Deploy to Railway"
    echo "5) Deploy to Render (Legacy)"
    echo "6) Deploy to Heroku"
    echo "7) Stop local bot"
    echo "8) Exit"
    echo ""
}

# Main menu
while true; do
    show_menu
    read -p "Enter your choice (1-8): " choice
    
    case $choice in
        1)
            test_connection
            ;;
        2)
            run_local
            break
            ;;
        3)
            deploy_flyio
            break
            ;;
        4)
            deploy_railway
            break
            ;;
        5)
            deploy_render
            break
            ;;
        6)
            deploy_heroku
            break
            ;;
        7)
            stop_local
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
