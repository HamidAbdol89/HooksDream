#!/usr/bin/env python3
"""
Check environment configuration
"""

import os
from config import settings

print("🔍 Environment Check")
print("=" * 30)
print(f"ENVIRONMENT: {settings.ENVIRONMENT}")
print(f"NODE_BACKEND_URL: {settings.NODE_BACKEND_URL}")
print(f"BOT_ENABLED: {settings.BOT_ENABLED}")
print(f"BOT_INTERVAL_MINUTES: {settings.BOT_INTERVAL_MINUTES}")
print(f"BOT_POSTS_PER_RUN: {settings.BOT_POSTS_PER_RUN}")
print(f"PORT: {settings.PORT}")
print(f"UNSPLASH_ACCESS_KEY: {'✅ Set' if settings.UNSPLASH_ACCESS_KEY else '❌ Missing'}")
print(f"PEXELS_API_KEY: {'✅ Set' if settings.PEXELS_API_KEY else '❌ Missing'}")
print(f"GROQ_API_KEY: {'✅ Set' if settings.GROQ_API_KEY else '❌ Missing'}")

print("\n🌍 Environment Variables:")
env_vars = [
    "ENVIRONMENT",
    "NODE_BACKEND_URL", 
    "UNSPLASH_ACCESS_KEY",
    "PEXELS_API_KEY",
    "GROQ_API_KEY",
    "BOT_ENABLED",
    "BOT_INTERVAL_MINUTES",
    "BOT_POSTS_PER_RUN",
    "PORT"
]

for var in env_vars:
    value = os.getenv(var, "NOT SET")
    if "KEY" in var and value != "NOT SET":
        value = "***" + value[-4:]
    print(f"  {var}: {value}")

print("\n📋 Recommendations:")
if settings.ENVIRONMENT == "development":
    print("⚠️  Set ENVIRONMENT=production for deployment")
if settings.NODE_BACKEND_URL == "http://localhost:5000":
    print("⚠️  Update NODE_BACKEND_URL to your deployed backend")
if not settings.UNSPLASH_ACCESS_KEY:
    print("⚠️  Set UNSPLASH_ACCESS_KEY for bot functionality")
if not settings.PEXELS_API_KEY:
    print("⚠️  Set PEXELS_API_KEY for hybrid image service")
