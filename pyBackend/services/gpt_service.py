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
    
    async def generate_professional_caption(self, bot_account: Dict, topic: str, photo_data: Optional[Dict] = None) -> str:
        """Generate professional caption based on bot's expertise"""
        
        try:
            # Try Groq API first (fastest)
            if self.groq_key:
                ai_caption = await self._try_groq_caption(bot_account, topic, photo_data)
                if ai_caption:
                    return ai_caption
            
            # Fallback to enhanced smart templates
            return self._generate_professional_template_caption(bot_account, topic)
            
        except Exception as e:
            print(f"⚠️ Error generating caption: {e}")
            return self._fallback_caption(bot_account, topic)
    
    async def _try_groq_caption(self, bot_account: Dict, topic: str, photo_data: Optional[Dict] = None) -> Optional[str]:
        """Try Groq API for caption generation (OpenAI-compatible)"""
        try:
            # Create professional prompt based on bot's expertise
            bot_type = bot_account.get('botType', 'lifestyle')
            display_name = bot_account.get('displayName', 'AI Creator')
            bio = bot_account.get('bio', '')
            interests = bot_account.get('interests', [])
            
            # Create context-aware prompt
            prompt = f"""You are {display_name}, a {bot_type} expert. {bio}
            
Create an Instagram caption about {topic} in your professional style.
Interests: {', '.join(interests) if interests else 'general'}

Requirements:
- Write in first person as {display_name}
- Show your {bot_type} expertise
- Include relevant emojis
- Add 3-5 relevant hashtags
- Keep under 280 characters
- Be authentic and engaging"""
            
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
    
    def _generate_professional_template_caption(self, bot_account: Dict, topic: str) -> str:
        """Generate professional caption using templates based on bot expertise"""
        
        bot_type = bot_account.get('botType', 'lifestyle')
        display_name = bot_account.get('displayName', 'AI Creator')
        interests = bot_account.get('interests', [])
        
        # Professional templates by bot type
        templates = {
            'tech': [
                f"🚀 Excited to share insights about {topic}! Innovation never stops amazing me.",
                f"💻 Working on {topic} projects that could change everything. The future is now!",
                f"⚡ {topic} is revolutionizing how we think about technology. What's your take?"
            ],
            'photographer': [
                f"📸 Captured this incredible {topic} moment. Light and composition came together perfectly!",
                f"🌅 {topic} photography session today. Every frame tells a story worth sharing.",
                f"✨ When {topic} meets the golden hour magic. This is why I love what I do!"
            ],
            'artist': [
                f"🎨 Creating art inspired by {topic}. Every brushstroke carries emotion and meaning.",
                f"✨ {topic} sparked my creativity today. Art is how we make sense of the world.",
                f"🌈 Exploring {topic} through colors and textures. Art speaks what words cannot."
            ],
            'traveler': [
                f"✈️ Discovering {topic} in this amazing destination. Travel opens minds and hearts!",
                f"🌍 {topic} adventure today! Every journey teaches us something new about ourselves.",
                f"🗺️ Found this incredible {topic} spot off the beaten path. Hidden gems everywhere!"
            ],
            'lifestyle': [
                f"🌱 Embracing {topic} as part of mindful living. Small changes, big impact!",
                f"✨ {topic} moments like these remind me what truly matters in life.",
                f"💫 Finding balance through {topic}. Wellness is a journey, not a destination."
            ],
            'nature': [
                f"🌿 Witnessed incredible {topic} in the wild today. Nature never ceases to amaze!",
                f"🦋 {topic} conservation is so important. Every small action makes a difference.",
                f"🌊 {topic} reminds us of our connection to the natural world. Protect what we love!"
            ]
        }
        
        # Get templates for bot type
        bot_templates = templates.get(bot_type, templates['lifestyle'])
        base_caption = random.choice(bot_templates)
        
        # Add relevant hashtags
        hashtags = self._generate_professional_hashtags(bot_type, topic, interests)
        
        return f"{base_caption}\n\n{hashtags}"
    
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
    
    def _generate_professional_hashtags(self, bot_type: str, topic: str, interests: list) -> str:
        """Generate professional hashtags based on bot expertise"""
        
        # Base hashtags by bot type
        type_hashtags = {
            'tech': ['#technology', '#innovation', '#coding', '#AI', '#startup', '#developer'],
            'photographer': ['#photography', '#photooftheday', '#capture', '#moment', '#art', '#visual'],
            'artist': ['#art', '#creative', '#design', '#inspiration', '#artistic', '#creativity'],
            'traveler': ['#travel', '#adventure', '#explore', '#wanderlust', '#journey', '#discover'],
            'lifestyle': ['#lifestyle', '#wellness', '#mindful', '#balance', '#selfcare', '#healthy'],
            'nature': ['#nature', '#wildlife', '#conservation', '#earth', '#natural', '#environment']
        }
        
        # Get base hashtags
        base_tags = type_hashtags.get(bot_type, ['#inspiration', '#life'])
        
        # Add topic-specific hashtags
        topic_tag = f"#{topic.replace(' ', '').lower()}"
        if topic_tag not in base_tags:
            base_tags.append(topic_tag)
        
        # Add interest-based hashtags
        for interest in interests[:2]:  # Limit to 2 interests
            interest_tag = f"#{interest.replace(' ', '').lower()}"
            if interest_tag not in base_tags and len(base_tags) < 8:
                base_tags.append(interest_tag)
        
        # Select 5-7 hashtags
        selected_tags = base_tags[:random.randint(5, 7)]
        
        return ' '.join(selected_tags)
    
    async def generate_enhanced_text_post(self, bot_account: Dict, topic: str, enhanced_prompt: str, context: Dict) -> Optional[str]:
        """Generate AI-powered text-only post with enhanced context"""
        
        try:
            if self.groq_key:
                ai_text = await self._try_groq_enhanced_text_post(enhanced_prompt, context)
                if ai_text:
                    return ai_text
            
            # Fallback handled by smart_content_generator
            return None
            
        except Exception as e:
            print(f"⚠️ Error generating enhanced text post: {e}")
            return None
    
    async def generate_text_only_post(self, bot_account: Dict, topic: str) -> Optional[str]:
        """Generate AI-powered text-only post using Groq (legacy method)"""
        
        try:
            if self.groq_key:
                ai_text = await self._try_groq_text_post(bot_account, topic)
                if ai_text:
                    return ai_text
            
            # Fallback handled by smart_content_generator
            return None
            
        except Exception as e:
            print(f"⚠️ Error generating text post: {e}")
            return None
    
    async def _try_groq_text_post(self, bot_account: Dict, topic: str) -> Optional[str]:
        """Generate text-only post using Groq AI"""
        try:
            bot_type = bot_account.get('botType', 'lifestyle')
            display_name = bot_account.get('displayName', 'AI Creator')
            bio = bot_account.get('bio', '')
            interests = bot_account.get('interests', [])
            
            # Create context-aware prompt for text posts
            prompt = f"""You are {display_name}, a {bot_type} expert. {bio}

Create a natural, engaging social media text post about {topic}.

Your personality: {bot_type} professional
Your interests: {', '.join(interests) if interests else 'general'}

Requirements:
- Write in first person as {display_name}
- Be authentic and conversational
- Share a personal thought, insight, or experience
- Include relevant emojis naturally
- Add 3-4 relevant hashtags at the end
- Keep under 280 characters
- Sound human and relatable
- NO images mentioned (text-only post)

Examples of good text posts:
- Personal reflections
- Professional insights
- Questions to followers
- Behind-the-scenes thoughts
- Tips or advice
- Current mood/feelings"""
            
            payload = {
                "model": "llama-3.1-8b-instant",
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "temperature": 0.8,  # Higher creativity for text posts
                "max_tokens": 200,
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
                    
                    if 'choices' in result and len(result['choices']) > 0:
                        choice = result['choices'][0]
                        if 'message' in choice and 'content' in choice['message']:
                            generated_text = choice['message']['content'].strip()
                            
                            if generated_text:
                                text_post = self._clean_text_post(generated_text)
                                print(f"✨ Groq AI text post generated: {text_post[:50]}...")
                                return text_post
                else:
                    print(f"⚠️ Groq API error: {response.status_code} - {response.text}")
                
        except Exception as e:
            print(f"⚠️ Groq text generation unavailable: {e}")
        
        return None
    
    async def _try_groq_enhanced_text_post(self, enhanced_prompt: str, context: Dict) -> Optional[str]:
        """Generate enhanced text post using Groq AI with full context"""
        try:
            # Use the enhanced prompt directly (already contains all context)
            payload = {
                "model": "llama-3.1-8b-instant",
                "messages": [
                    {
                        "role": "user",
                        "content": enhanced_prompt
                    }
                ],
                "temperature": 0.85,  # Higher creativity for context-aware posts
                "max_tokens": 250,    # Slightly more tokens for richer content
                "top_p": 0.9
            }
            
            # Call Groq API
            async with httpx.AsyncClient(timeout=12.0) as client:
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
                    
                    if 'choices' in result and len(result['choices']) > 0:
                        choice = result['choices'][0]
                        if 'message' in choice and 'content' in choice['message']:
                            generated_text = choice['message']['content'].strip()
                            
                            if generated_text:
                                text_post = self._clean_enhanced_text_post(generated_text, context)
                                print(f"✨ Enhanced Groq AI text post generated: {text_post[:50]}...")
                                return text_post
                else:
                    print(f"⚠️ Groq API error: {response.status_code} - {response.text}")
                
        except Exception as e:
            print(f"⚠️ Enhanced Groq text generation unavailable: {e}")
        
        return None
    
    def _clean_enhanced_text_post(self, text: str, context: Dict) -> str:
        """Clean and format enhanced Groq-generated text post"""
        
        # Standard cleaning
        text = self._clean_text_post(text)
        
        # Add context-aware enhancements if missing
        time_context = context.get('time_context')
        if time_context and not any(emoji in text for emoji in ['🌅', '☕', '🌙', '⭐', '🌞']):
            # Add time-appropriate emoji if missing
            time_emojis = {
                'early_morning': '🌅',
                'morning': '☕',
                'evening': '🌅',
                'late_night': '🌙'
            }
            
            if hasattr(time_context, 'value'):
                emoji = time_emojis.get(time_context.value, '')
                if emoji and not text.startswith(emoji):
                    text = f"{emoji} {text}"
        
        return text
    
    def _clean_text_post(self, text: str) -> str:
        """Clean and format Groq-generated text post"""
        
        # Remove common prefixes/suffixes
        text = text.strip()
        
        # Remove quotes if present
        if text.startswith('"') and text.endswith('"'):
            text = text[1:-1]
        
        # Remove "Post:" prefix if present
        if text.lower().startswith('post:'):
            text = text[5:].strip()
        
        # Ensure reasonable length
        if len(text) > 350:
            text = text[:350] + "..."
        
        # Ensure it has some hashtags
        if '#' not in text:
            text += " #inspiration #life #thoughts"
        
        return text
    
    def _fallback_caption(self, bot_account: Dict, topic: str) -> str:
        """Generate simple fallback caption"""
        display_name = bot_account.get('displayName', 'AI Creator')
        return f"Beautiful {topic} moment ✨ Sharing some inspiration today! #{topic} #beautiful #inspiration"
    
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
