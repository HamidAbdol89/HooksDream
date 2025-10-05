"""
Free AI Service for Smart Caption Generation
Uses Google Gemini API (free tier) and enhanced templates
"""

import httpx
import asyncio
import random
import json
from typing import Dict, List, Optional
from config import settings
from services.ai_bot_manager import BotProfile

class GPTService:
    def __init__(self):
        """Initialize Free AI service with Gemini"""
        self.enabled = True  # Always enabled with free alternatives
        self.gemini_api_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent"
        self.gemini_key = getattr(settings, 'GEMINI_API_KEY', '')
        
        if self.gemini_key:
            print("✅ Free AI service initialized with Google Gemini API")
        else:
            print("⚠️ Gemini API key not found, using enhanced templates only")
    
    async def generate_smart_caption(
        self, 
        bot_profile: BotProfile, 
        photo_data: Dict, 
        topic: str
    ) -> Optional[str]:
        """Generate intelligent caption using Free AI or enhanced templates"""
        
        try:
            # Try Gemini AI first
            if self.gemini_key:
                ai_caption = await self._try_gemini_caption(bot_profile, photo_data, topic)
                if ai_caption:
                    return ai_caption
            
            # Fallback to enhanced smart templates
            return self._generate_enhanced_caption(bot_profile, photo_data, topic)
                
        except Exception as e:
            print(f"❌ AI caption generation failed: {e}")
            return self._fallback_caption(bot_profile, topic)
    
    async def _try_gemini_caption(self, bot_profile: BotProfile, photo_data: Dict, topic: str) -> Optional[str]:
        """Try Google Gemini API for caption generation"""
        try:
            # Create personality-specific prompt for Gemini
            prompt = self._create_gemini_prompt(bot_profile, photo_data, topic)
            
            # Gemini API request payload
            payload = {
                "contents": [{
                    "parts": [{
                        "text": prompt
                    }]
                }],
                "generationConfig": {
                    "temperature": 0.7,
                    "topK": 40,
                    "topP": 0.95,
                    "maxOutputTokens": 100,
                    "stopSequences": []
                }
            }
            
            # Call Gemini API
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.post(
                    f"{self.gemini_api_url}?key={self.gemini_key}",
                    json=payload,
                    headers={"Content-Type": "application/json"}
                )
                
                if response.status_code == 200:
                    result = response.json()
                    
                    # Extract generated text from Gemini response
                    if 'candidates' in result and len(result['candidates']) > 0:
                        candidate = result['candidates'][0]
                        
                        # Handle different response formats
                        generated_text = None
                        
                        # Try new format first
                        if 'content' in candidate:
                            content = candidate['content']
                            if 'parts' in content and len(content['parts']) > 0:
                                generated_text = content['parts'][0].get('text', '')
                            elif 'text' in content:
                                generated_text = content['text']
                        
                        # Try direct text field
                        elif 'text' in candidate:
                            generated_text = candidate['text']
                        
                        if generated_text and generated_text.strip():
                            caption = self._clean_gemini_caption(generated_text.strip())
                            print(f"✨ Gemini AI caption generated: {caption[:50]}...")
                            return caption
                        else:
                            print(f"⚠️ Gemini response has no text content: {candidate}")
                    else:
                        print(f"⚠️ Gemini response has no candidates: {result}")
                else:
                    print(f"⚠️ Gemini API error: {response.status_code} - {response.text}")
                
        except Exception as e:
            print(f"⚠️ Gemini API unavailable: {e}")
        
        return None
    
    def _create_gemini_prompt(self, bot_profile: BotProfile, photo_data: Dict, topic: str) -> str:
        """Create optimized prompt for Gemini API"""
        
        photo_description = photo_data.get('description', f'A beautiful {topic} image')
        
        # Personality-specific instructions
        personality_styles = {
            "photographer": "artistic, technical, focused on composition and lighting",
            "traveler": "adventurous, wanderlust-filled, inspiring exploration", 
            "artist": "creative, expressive, emotionally resonant",
            "lifestyle": "relatable, positive, mindful and grateful",
            "tech": "innovative, forward-thinking, tech-savvy",
            "foodie": "appetizing, sensory, food-loving"
        }
        
        style = personality_styles.get(bot_profile.personality_type, "friendly and engaging")
        
        prompt = f"Write a {style} Instagram caption about {topic}. Include emojis and hashtags."
        
        return prompt
    
    def _clean_gemini_caption(self, text: str) -> str:
        """Clean and format Gemini-generated caption"""
        
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
        """Generate enhanced captions using smart templates and context"""
        
        # Enhanced personality-specific templates with more variety
        enhanced_templates = {
            "photographer": [
                f"Captured this {topic} moment and the light was absolutely perfect ✨📸",
                f"When {topic} meets the golden hour magic 🌅 Frame-worthy composition right here",
                f"This {topic} scene spoke to my photographer's soul 💫 Sometimes the shot finds you",
                f"Light, shadow, and {topic} creating poetry in motion 🎭📷",
                f"Another {topic} adventure through my lens 🌟 The beauty never gets old"
            ],
            "traveler": [
                f"Found myself lost in this amazing {topic} spot 🌍✈️",
                f"Travel diary entry: {topic} that took my breath away 📖💎",
                f"This {topic} place just made it to my favorites list 🗺️❤️",
                f"Wanderlust level maximum after seeing this {topic} beauty 🧳🌟",
                f"Another day, another incredible {topic} discovery! 🌍✨"
            ],
            "artist": [
                f"When {topic} becomes pure artistic inspiration 🎨💡",
                f"Creative energy flowing from this {topic} masterpiece ✨🖼️",
                f"Art is everywhere - even in this beautiful {topic} scene 🎭💫",
                f"Visual poetry captured: {topic} edition 📸🎨",
                f"This {topic} view just sparked my next creative project 💡✨"
            ],
            "lifestyle": [
                f"Living for {topic} moments like these 💕✨",
                f"Simple {topic} pleasures bringing the biggest joy 😊🌸",
                f"Grateful for this beautiful {topic} in my life 🙏💫",
                f"Good vibes only when surrounded by {topic} like this 🌸☀️",
                f"Life is beautiful when you notice {topic} details like these 💕"
            ],
            "tech": [
                f"When {topic} meets innovation - the future looks bright 🚀💻",
                f"Digital world, analog {topic} feelings 🔮⚡",
                f"Tech aesthetics: {topic} edition looking absolutely stunning 💻✨",
                f"Progress and {topic} beauty working in perfect harmony 🌐🚀",
                f"Innovation inspired by {topic} - nature's perfect algorithm 💡⚡"
            ],
            "foodie": [
                f"This {topic} pairs perfectly with good food and great vibes 🍜☀️",
                f"Culinary inspiration strikes when you see {topic} like this 👨‍🍳✨",
                f"Food tastes better with a side of beautiful {topic} 😋📸",
                f"Flavor meets beauty: {topic} edition 🌶️💫",
                f"Cooking up memories with this stunning {topic} backdrop 🍽️✨"
            ]
        }
        
        # Get templates for personality
        templates = enhanced_templates.get(bot_profile.personality_type, enhanced_templates["lifestyle"])
        base_caption = random.choice(templates)
        
        # Add contextual hashtags based on topic and personality
        hashtags = self._generate_smart_hashtags(topic, bot_profile)
        
        return f"{base_caption} {hashtags}"
    
    def _generate_smart_hashtags(self, topic: str, bot_profile: BotProfile) -> str:
        """Generate smart hashtags based on topic and personality"""
        
        # Topic-based hashtags
        topic_hashtags = {
            "nature": ["#nature", "#outdoors", "#peaceful", "#green", "#fresh"],
            "sunset": ["#sunset", "#goldenhour", "#sky", "#beautiful", "#evening"],
            "food": ["#foodie", "#delicious", "#yummy", "#tasty", "#foodporn"],
            "travel": ["#travel", "#adventure", "#explore", "#wanderlust", "#journey"],
            "art": ["#art", "#creative", "#inspiration", "#artistic", "#design"],
            "technology": ["#tech", "#innovation", "#future", "#digital", "#modern"],
            "lifestyle": ["#lifestyle", "#vibes", "#mood", "#blessed", "#grateful"]
        }
        
        # Personality hashtags
        personality_hashtags = {
            "photographer": ["#photography", "#photooftheday", "#capture", "#lens", "#shot"],
            "traveler": ["#travelgram", "#wanderer", "#nomad", "#globe", "#adventure"],
            "artist": ["#artistlife", "#creativity", "#inspiration", "#visual", "#aesthetic"],
            "lifestyle": ["#goodvibes", "#mindful", "#wellness", "#balance", "#peace"],
            "tech": ["#techlife", "#innovation", "#startup", "#digital", "#future"],
            "foodie": ["#foodlover", "#chef", "#cooking", "#recipe", "#flavor"]
        }
        
        # Combine hashtags
        hashtags = []
        
        # Add topic hashtags
        for key, tags in topic_hashtags.items():
            if key in topic.lower():
                hashtags.extend(random.sample(tags, min(3, len(tags))))
                break
        
        # Add personality hashtags
        if bot_profile.personality_type in personality_hashtags:
            hashtags.extend(random.sample(
                personality_hashtags[bot_profile.personality_type], 
                min(2, len(personality_hashtags[bot_profile.personality_type]))
            ))
        
        # Add popular general hashtags
        popular_tags = ["#instagood", "#beautiful", "#amazing", "#love", "#life", "#happy"]
        hashtags.extend(random.sample(popular_tags, 2))
        
        # Remove duplicates and limit
        unique_hashtags = list(dict.fromkeys(hashtags))
        selected_hashtags = unique_hashtags[:random.randint(5, 8)]
        
        return " ".join(selected_hashtags)
    
    def _create_caption_prompt(self, bot_profile: BotProfile, photo_data: Dict, topic: str) -> str:
        """Create personality-specific prompt for GPT"""
        
        # Get photo details
        photo_description = photo_data.get('description', 'A beautiful image')
        photo_color = photo_data.get('color', '#000000')
        
        # Personality-specific writing styles
        writing_styles = {
            'photographer': {
                'tone': 'artistic and technical',
                'focus': 'composition, lighting, and visual storytelling',
                'style': 'Use photography terms, mention camera settings occasionally, inspire other photographers'
            },
            'traveler': {
                'tone': 'adventurous and wanderlust-filled',
                'focus': 'exploration, culture, and discovery',
                'style': 'Share travel tips, mention locations, inspire wanderlust, use travel emojis'
            },
            'artist': {
                'tone': 'creative and expressive',
                'focus': 'artistic vision, creativity, and inspiration',
                'style': 'Use artistic language, mention techniques, inspire creativity, philosophical touches'
            },
            'lifestyle': {
                'tone': 'positive and relatable',
                'focus': 'daily life, wellness, and positivity',
                'style': 'Casual and friendly, mention daily routines, wellness tips, motivational'
            },
            'tech': {
                'tone': 'innovative and forward-thinking',
                'focus': 'technology, innovation, and future trends',
                'style': 'Mention tech aspects, innovation, digital trends, professional yet accessible'
            },
            'foodie': {
                'tone': 'passionate and mouth-watering',
                'focus': 'flavors, cooking, and culinary experiences',
                'style': 'Describe tastes and textures, cooking tips, food culture, use food emojis'
            }
        }
        
        personality_style = writing_styles.get(bot_profile.personality_type, writing_styles['lifestyle'])
        
        prompt = f"""You are {bot_profile.name}, a {bot_profile.personality_type} content creator.

Your personality:
- Bio: {bot_profile.bio}
- Tone: {personality_style['tone']}
- Focus: {personality_style['focus']}
- Style: {personality_style['style']}

Create an engaging Instagram caption for this image:
- Topic: {topic}
- Description: {photo_description}
- Dominant color: {photo_color}

Requirements:
1. Write in your unique personality voice
2. 1-3 sentences maximum (concise but impactful)
3. Include 3-5 relevant hashtags
4. Add appropriate emojis (2-4 max)
5. Make it engaging and authentic
6. NO quotes around the caption
7. End with a question or call-to-action occasionally

Example style for {bot_profile.personality_type}:
{self._get_example_caption(bot_profile.personality_type)}

Generate caption:"""

        return prompt
    
    def _get_example_caption(self, personality_type: str) -> str:
        """Get example captions for each personality type"""
        examples = {
            'photographer': "Golden hour magic captured in a single frame ✨ The way light dances through the mist reminds me why I chase these moments 📸 #goldenhour #photography #lightchaser #naturephotography #wanderlust",
            
            'traveler': "Lost in the beauty of this hidden gem 🌍 Sometimes the best adventures happen when you take the path less traveled ✈️ #wanderlust #travel #adventure #explore #hiddenplaces",
            
            'artist': "When colors speak louder than words 🎨 There's something magical about how nature creates the perfect palette without trying ✨ #artinspiration #creativity #colorpalette #natureart #mindful",
            
            'lifestyle': "Finding peace in simple moments like these ☀️ Reminder to slow down and appreciate the beauty around us 💫 #mindfulness #peaceful #gratitude #simplicity #goodvibes",
            
            'tech': "Nature's algorithm for perfect composition never fails to amaze me 🌅 The intersection of natural beauty and mathematical precision ⚡ #innovation #naturemeettech #digitalart #futureforward #inspiration",
            
            'foodie': "This view pairs perfectly with morning coffee and fresh pastries ☕ Nothing beats breakfast with a side of natural beauty 🥐 #morningvibes #foodie #coffeetime #breakfast #peaceful"
        }
        
        return examples.get(personality_type, examples['lifestyle'])
    
    async def _call_openai_async(self, prompt: str) -> Optional[str]:
        """Make async call to OpenAI API"""
        try:
            # Run OpenAI call in thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None,
                lambda: openai.ChatCompletion.create(
                    model=settings.OPENAI_MODEL,
                    messages=[
                        {
                            "role": "system", 
                            "content": "You are a creative social media content creator. Generate engaging, authentic captions that match the given personality."
                        },
                        {
                            "role": "user", 
                            "content": prompt
                        }
                    ],
                    max_tokens=150,
                    temperature=0.8,  # Creative but not too random
                    presence_penalty=0.1,
                    frequency_penalty=0.1
                )
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            print(f"❌ OpenAI API error: {e}")
            return None
    
    def _clean_caption(self, caption: str) -> str:
        """Clean and format the generated caption"""
        # Remove quotes if present
        caption = caption.strip('"\'')
        
        # Ensure proper spacing
        caption = caption.replace('\n\n', '\n').strip()
        
        # Limit length (Instagram caption limit)
        if len(caption) > 2200:
            caption = caption[:2200] + "..."
        
        return caption
    
    def _fallback_caption(self, bot_profile: BotProfile, topic: str) -> str:
        """Fallback caption when GPT is unavailable"""
        fallback_templates = {
            'photographer': f"Capturing the essence of {topic} through my lens 📸 #photography #{topic} #artistic #moment",
            'traveler': f"Discovering the beauty of {topic} on my journey 🌍 #travel #{topic} #wanderlust #adventure",
            'artist': f"Finding inspiration in {topic} and its endless possibilities 🎨 #art #{topic} #creative #inspiration",
            'lifestyle': f"Embracing the simple beauty of {topic} in everyday life ✨ #lifestyle #{topic} #mindful #peaceful",
            'tech': f"The intersection of {topic} and innovation never ceases to amaze 💡 #tech #{topic} #innovation #future",
            'foodie': f"When {topic} meets culinary inspiration 🍽️ #foodie #{topic} #delicious #culinary"
        }
        
        return fallback_templates.get(
            bot_profile.personality_type, 
            f"Beautiful {topic} moment ✨ #{topic} #beautiful #moment #inspiration"
        )
    
    async def generate_comment_reply(
        self, 
        bot_profile: BotProfile, 
        original_comment: str, 
        post_context: str
    ) -> Optional[str]:
        """Generate intelligent reply to user comments"""
        if not self.enabled:
            return self._fallback_reply(original_comment)
        
        try:
            prompt = f"""You are {bot_profile.name}, a {bot_profile.personality_type} content creator.

Your personality: {bot_profile.bio}

Someone commented on your post about {post_context}:
"{original_comment}"

Generate a friendly, authentic reply that:
1. Matches your personality
2. Is 1-2 sentences max
3. Acknowledges their comment
4. Continues the conversation naturally
5. Uses 1-2 emojis max
6. NO quotes around the reply

Reply:"""

            response = await self._call_openai_async(prompt)
            return self._clean_caption(response) if response else self._fallback_reply(original_comment)
            
        except Exception as e:
            print(f"❌ GPT comment reply failed: {e}")
            return self._fallback_reply(original_comment)
    
    def _fallback_reply(self, comment: str) -> str:
        """Simple fallback replies"""
        replies = [
            "Thank you so much! 😊",
            "Really appreciate your kind words! ✨",
            "So glad you enjoyed this! 🙏",
            "Thanks for the love! 💫",
            "Your support means everything! 🌟"
        ]
        
        import random
        return random.choice(replies)
    
    def get_service_status(self) -> Dict:
        """Get GPT service status"""
        return {
            "gpt_enabled": self.enabled,
            "model": settings.OPENAI_MODEL if self.enabled else None,
            "api_key_configured": bool(settings.OPENAI_API_KEY),
            "status": "active" if self.enabled else "disabled"
        }
