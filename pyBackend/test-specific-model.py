#!/usr/bin/env python3
"""
Test specific Gemini model
"""

import asyncio
import httpx
import json
from config import settings

async def test_specific_model():
    api_key = settings.GEMINI_API_KEY
    model = "gemini-2.5-flash"
    
    print(f"🧪 Testing model: {model}")
    print(f"🔑 API Key: ***{api_key[-4:]}")
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    
    payload = {
        "contents": [{
            "parts": [{
                "text": "Write a short Instagram caption about sunset photography in photographer style"
            }]
        }],
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 100
        }
    }
    
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                url,
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            
            print(f"📊 Status: {response.status_code}")
            print(f"📝 Response: {response.text}")
            
            if response.status_code == 200:
                result = response.json()
                if 'candidates' in result and len(result['candidates']) > 0:
                    candidate = result['candidates'][0]
                    if 'content' in candidate and 'parts' in candidate['content']:
                        text = candidate['content']['parts'][0].get('text', '')
                        print(f"✅ SUCCESS! Generated: {text.strip()}")
                        return True
            
            return False
            
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False

if __name__ == "__main__":
    asyncio.run(test_specific_model())
