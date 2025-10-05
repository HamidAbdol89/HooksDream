#!/usr/bin/env python3
"""
Test Gemini API directly to debug model availability
"""

import httpx
import asyncio
import json
from config import settings

async def test_gemini_models():
    """Test different Gemini model endpoints"""
    
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        print("❌ No Gemini API key found")
        return
    
    print(f"🔑 Testing with API key: ***{api_key[-4:]}")
    
    # Test different model names
    models_to_test = [
        "gemini-1.5-flash-latest",
        "gemini-1.5-flash", 
        "gemini-1.5-pro",
        "gemini-pro",
        "gemini-1.0-pro"
    ]
    
    base_url = "https://generativelanguage.googleapis.com/v1beta/models"
    
    # Simple test payload
    test_payload = {
        "contents": [{
            "parts": [{
                "text": "Write a short social media caption about sunset"
            }]
        }],
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 100
        }
    }
    
    async with httpx.AsyncClient(timeout=15.0) as client:
        for model in models_to_test:
            print(f"\n🧪 Testing model: {model}")
            
            try:
                url = f"{base_url}/{model}:generateContent?key={api_key}"
                
                response = await client.post(
                    url,
                    json=test_payload,
                    headers={"Content-Type": "application/json"}
                )
                
                print(f"📊 Status: {response.status_code}")
                
                if response.status_code == 200:
                    result = response.json()
                    if 'candidates' in result and len(result['candidates']) > 0:
                        candidate = result['candidates'][0]
                        if 'content' in candidate and 'parts' in candidate['content']:
                            text = candidate['content']['parts'][0].get('text', '')
                            print(f"✅ SUCCESS! Generated: {text.strip()}")
                            print(f"🎯 Working model: {model}")
                            return model
                    else:
                        print(f"⚠️ Empty response: {result}")
                else:
                    error_text = response.text
                    print(f"❌ Error: {error_text}")
                    
            except Exception as e:
                print(f"❌ Exception: {e}")
    
    print(f"\n💡 None of the models worked. Possible issues:")
    print(f"   - API key needs to be enabled for Gemini models")
    print(f"   - Region restrictions")
    print(f"   - Billing account required")
    print(f"   - API key permissions")

async def list_available_models():
    """List all available models"""
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        return
    
    print(f"\n📋 Listing available models...")
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"
            )
            
            if response.status_code == 200:
                result = response.json()
                if 'models' in result:
                    print(f"✅ Available models:")
                    for model in result['models']:
                        name = model.get('name', '').replace('models/', '')
                        display_name = model.get('displayName', '')
                        print(f"   - {name} ({display_name})")
                else:
                    print(f"⚠️ No models found in response")
            else:
                print(f"❌ Error listing models: {response.status_code} - {response.text}")
                
    except Exception as e:
        print(f"❌ Exception listing models: {e}")

if __name__ == "__main__":
    print("🚀 Testing Gemini API Models...")
    
    asyncio.run(list_available_models())
    asyncio.run(test_gemini_models())
    
    print(f"\n📋 If no models work, try:")
    print(f"1. Go to https://makersuite.google.com/app/apikey")
    print(f"2. Create new API key")
    print(f"3. Enable Gemini API in Google Cloud Console")
    print(f"4. Check billing account if required")
