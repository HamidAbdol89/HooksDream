"""
AI Service for Smart Caption Generation
Uses Groq API (fast inference) and enhanced templates
"""

import httpx
import asyncio
import random
import json
from typing import Dict, Optional
from config import settings
from services.bot_profile import BotProfile

class GPTService:
    def __init__(self):
        """Initialize AI service with Groq"""
        self.groq_api_url = "https://api.groq.com/openai/v1/chat/completions"
        self.groq_key = getattr(settings, 'GROQ_API_KEY', '')
        
        if self.groq_key:
            print("✅ AI service initialized with Groq API (fast inference)")
        else:
            print("⚠️ No Groq API key found, using enhanced templates only")
    
    async def generate_smart_caption(
        self, 
        bot_profile: BotProfile, 
        photo_data: Dict, 
        topic: str
    ) -> Optional[str]:
        """Generate intelligent caption using Groq AI or enhanced templates"""
        
        try:
            # Try Groq API first (fastest)
            if self.groq_key:
                ai_caption = await self._try_groq_caption(bot_profile, photo_data, topic)
                if ai_caption:
                    return ai_caption
            
            # Fallback to enhanced smart templates
            return self._generate_enhanced_caption(bot_profile, photo_data, topic)
                
        except Exception as e:
            print(f"❌ AI caption generation failed: {e}")
            return self._fallback_caption(bot_profile, topic)
    
    async def _try_groq_caption(self, bot_profile: BotProfile, photo_data: Dict, topic: str) -> Optional[str]:
        """Try Groq API for caption generation (OpenAI-compatible)"""
        try:
            # Create simple prompt for Groq
            prompt = f"Write a {bot_profile.personality_type} style Instagram caption about {topic}. Include emojis and hashtags. Keep it under 280 characters."
            
            # Groq API payload (OpenAI format)
            payload = {
                "model": "llama-3.1-8b-instant",  # Fast Groq model
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "temperature": 0.7,
                "max_tokens": 150,
                "top_p": 0.9
            }
            
            # Call Groq API
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    self.groq_api_url,
                    json=payload,
                    headers={
                        "Authorization": f"Bearer {self.groq_key}",
                        "Content-Type": "application/json"
                    }
                )
                
                if response.status_code == 200:
                    result = response.json()
                    
                    # Extract text from OpenAI-style response
                    if 'choices' in result and len(result['choices']) > 0:
                        choice = result['choices'][0]
                        if 'message' in choice and 'content' in choice['message']:
                            generated_text = choice['message']['content'].strip()
                            
                            if generated_text:
                                caption = self._clean_groq_caption(generated_text)
                                print(f"✨ Groq AI caption generated: {caption[:50]}...")
                                return caption
                else:
                    print(f"⚠️ Groq API error: {response.status_code} - {response.text}")
                
        except Exception as e:
            print(f"⚠️ Groq API unavailable: {e}")
        
        return None
    
    def _clean_groq_caption(self, text: str) -> str:
        """Clean and format Groq-generated caption"""
        
        # Remove common prefixes/suffixes
        text = text.strip()
        
        # Remove quotes if present
        if text.startswith('"') and text.endswith('"'):
            text = text[1:-1]
        
        # Remove "Caption:" prefix if present
        if text.lower().startswith('caption:'):
            text = text[8:].strip()
        
        # Ensure it's not too long (Instagram limit ~2200 chars)
        if len(text) > 300:
            text = text[:300] + "..."
        
        # Ensure it has some hashtags
        if '#' not in text:
            # Add some basic hashtags if none present
            basic_hashtags = " #beautiful #instagood #amazing"
            text += basic_hashtags
        
        return text
    
    def _generate_enhanced_caption(self, bot_profile: BotProfile, photo_data: Dict, topic: str) -> str:
        """Generate enhanced captions using smart templates"""
        
        # Enhanced personality-specific templates
        enhanced_templates = {
            "photographer": [
                f"Captured this {topic} moment and the light was absolutely perfect ✨📸",
                f"When {topic} meets the golden hour magic 🌅 Frame-worthy composition right here",
                f"This {topic} scene spoke to my photographer's soul 💫 Sometimes the shot finds you"
            ],
            "traveler": [
                f"Found myself lost in this amazing {topic} spot 🌍✈️",
                f"Travel diary entry: {topic} that took my breath away 📖💎",
                f"This {topic} place just made it to my favorites list 🗺️❤️"
            ],
            "lifestyle": [
                f"Living for {topic} moments like these 💕✨",
                f"Simple {topic} pleasures bringing the biggest joy 😊🌸",
                f"Grateful for this beautiful {topic} in my life 🙏💫"
            ]
        }
        
        # Get templates for personality
        templates = enhanced_templates.get(bot_profile.personality_type, enhanced_templates["lifestyle"])
        base_caption = random.choice(templates)
        
        # Add contextual hashtags
        hashtags = self._generate_smart_hashtags(topic, bot_profile)
        
        return f"{base_caption} {hashtags}"
    
    def _generate_smart_hashtags(self, topic: str, bot_profile: BotProfile) -> str:
        """Generate smart hashtags based on topic and personality"""
        
        # Topic-based hashtags
        topic_hashtags = {
            "nature": ["#nature", "#outdoors", "#peaceful"],
            "sunset": ["#sunset", "#goldenhour", "#beautiful"],
            "food": ["#foodie", "#delicious", "#yummy"],
            "travel": ["#travel", "#adventure", "#explore"],
            "art": ["#art", "#creative", "#inspiration"],
            "technology": ["#tech", "#innovation", "#future"],
            "lifestyle": ["#lifestyle", "#vibes", "#mood"]
        }
        
        # Get topic hashtags
        base_hashtags = topic_hashtags.get(topic, ["#beautiful", "#amazing"])
        
        # Add personality hashtags
        personality_hashtags = {
            "photographer": ["#photography", "#photooftheday"],
            "traveler": ["#wanderlust", "#journey"],
            "lifestyle": ["#blessed", "#grateful"]
        }
        
        personality_tags = personality_hashtags.get(bot_profile.personality_type, ["#instagood"])
        
        # Combine and limit
        all_hashtags = base_hashtags + personality_tags
        selected_hashtags = random.sample(all_hashtags, min(4, len(all_hashtags)))
        
        return " ".join(selected_hashtags)
    
    def _fallback_caption(self, bot_profile: BotProfile, topic: str) -> str:
        """Generate simple fallback caption"""
        return f"Beautiful {topic} moment ✨ #{topic} #photography #beautiful"
