#!/usr/bin/env python3
"""
Direct Gemini API Test - Simple prompt
"""

import asyncio
import httpx
import json
from config import settings

async def test_simple_prompt():
    api_key = settings.GEMINI_API_KEY
    
    print(f"🧪 Testing Gemini với simple prompt...")
    print(f"🔑 API Key: ***{api_key[-4:]}")
    
    # Very simple prompt
    simple_payload = {
        "contents": [{
            "parts": [{
                "text": "Write a short caption about sunset"
            }]
        }],
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 50
        }
    }
    
    models_to_test = [
        "gemini-flash-latest",
        "gemini-2.5-flash", 
        "gemini-pro-latest"
    ]
    
    for model in models_to_test:
        print(f"\n🔍 Testing {model}...")
        
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
            
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    url,
                    json=simple_payload,
                    headers={"Content-Type": "application/json"}
                )
                
                print(f"📊 Status: {response.status_code}")
                
                if response.status_code == 200:
                    result = response.json()
                    print(f"📝 Full Response: {json.dumps(result, indent=2)}")
                    
                    # Try to extract text
                    if 'candidates' in result and len(result['candidates']) > 0:
                        candidate = result['candidates'][0]
                        
                        # Check for text in different locations
                        text_found = False
                        
                        if 'content' in candidate:
                            content = candidate['content']
                            if 'parts' in content and len(content['parts']) > 0:
                                for part in content['parts']:
                                    if 'text' in part:
                                        print(f"✅ SUCCESS! Text: {part['text']}")
                                        text_found = True
                                        return True
                        
                        if not text_found:
                            print(f"❌ No text found in response")
                            print(f"🔍 Candidate structure: {candidate}")
                    
                else:
                    print(f"❌ Error: {response.text}")
                    
        except Exception as e:
            print(f"❌ Exception: {e}")
    
    return False

if __name__ == "__main__":
    success = asyncio.run(test_simple_prompt())
    
    if success:
        print(f"\n🎉 Gemini API hoạt động! Có thể integrate vào bot system.")
    else:
        print(f"\n⚠️ Gemini API có vấn đề. Sử dụng Enhanced Templates.")
        print(f"💡 Enhanced Templates đã cho quality rất tốt - có thể deploy ngay!")
