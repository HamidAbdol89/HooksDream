"""
Multimedia Expansion Service
Enables bots to generate and post various types of multimedia content
"""

import random
import requests
import asyncio
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from enum import Enum
import base64
import io
from PIL import Image, ImageDraw, ImageFont
try:
    import textwrap
except ImportError:
    import textwrap3 as textwrap

class MediaType(Enum):
    QUOTE_CARD = "quote_card"
    INFOGRAPHIC = "infographic"
    AI_ART = "ai_art"
    PHOTO_WITH_CAPTION = "photo_with_caption"
    MEME = "meme"
    CHART = "chart"

class MultimediaGenerator:
    def __init__(self):
        """Initialize multimedia generator"""
        self.unsplash_access_key = None  # Will be set from environment
        self.ai_art_prompts = self._initialize_ai_art_prompts()
        
    def set_unsplash_key(self, access_key: str) -> None:
        """Set Unsplash access key"""
        self.unsplash_access_key = access_key
    
    async def generate_multimedia_content(self, bot_account: Dict, topic: str, content_text: str) -> Optional[Dict]:
        """Generate multimedia content for a bot post"""
        
        bot_type = bot_account.get('botType', 'lifestyle')
        
        # Determine media type based on bot type and content
        media_type = self._select_media_type(bot_type, topic, content_text)
        
        try:
            if media_type == MediaType.QUOTE_CARD:
                return await self._generate_quote_card(content_text, bot_account)
            elif media_type == MediaType.PHOTO_WITH_CAPTION:
                return await self._generate_photo_with_caption(topic, content_text, bot_account)
            elif media_type == MediaType.INFOGRAPHIC:
                return await self._generate_simple_infographic(topic, content_text, bot_account)
            elif media_type == MediaType.AI_ART:
                return await self._generate_ai_art_concept(topic, bot_account)
            elif media_type == MediaType.MEME:
                return await self._generate_meme_style_image(content_text, bot_account)
            else:
                return None
                
        except Exception as e:
            print(f"⚠️ Error generating {media_type.value}: {e}")
            return None
    
    def _select_media_type(self, bot_type: str, topic: str, content_text: str) -> MediaType:
        """Select appropriate media type based on bot and content"""
        
        # Bot type preferences
        type_preferences = {
            'photographer': [MediaType.PHOTO_WITH_CAPTION, MediaType.AI_ART],
            'artist': [MediaType.AI_ART, MediaType.QUOTE_CARD, MediaType.INFOGRAPHIC],
            'tech': [MediaType.INFOGRAPHIC, MediaType.CHART, MediaType.QUOTE_CARD],
            'lifestyle': [MediaType.QUOTE_CARD, MediaType.PHOTO_WITH_CAPTION],
            'nature': [MediaType.PHOTO_WITH_CAPTION, MediaType.QUOTE_CARD]
        }
        
        # Content-based preferences
        if len(content_text) < 100 and any(word in content_text.lower() for word in ['quote', 'wisdom', 'thought']):
            return MediaType.QUOTE_CARD
        elif 'data' in topic.lower() or 'statistic' in topic.lower():
            return MediaType.INFOGRAPHIC
        elif bot_type == 'photographer':
            return MediaType.PHOTO_WITH_CAPTION
        
        # Default to bot type preferences
        preferences = type_preferences.get(bot_type, [MediaType.QUOTE_CARD])
        return random.choice(preferences)
    
    async def _generate_quote_card(self, quote_text: str, bot_account: Dict) -> Dict:
        """Generate a quote card image"""
        
        # Create image
        width, height = 800, 600
        image = Image.new('RGB', (width, height), color='white')
        draw = ImageDraw.Draw(image)
        
        # Try to load a nice font, fallback to default
        try:
            font_size = 32
            font = ImageFont.truetype("arial.ttf", font_size)
            author_font = ImageFont.truetype("arial.ttf", 24)
        except:
            font = ImageFont.load_default()
            author_font = ImageFont.load_default()
        
        # Clean quote text (remove hashtags for image)
        clean_quote = quote_text.split('#')[0].strip()
        if len(clean_quote) > 200:
            clean_quote = clean_quote[:200] + "..."
        
        # Wrap text
        wrapped_text = textwrap.fill(clean_quote, width=40)
        
        # Calculate text position
        text_bbox = draw.textbbox((0, 0), wrapped_text, font=font)
        text_width = text_bbox[2] - text_bbox[0]
        text_height = text_bbox[3] - text_bbox[1]
        
        x = (width - text_width) // 2
        y = (height - text_height) // 2 - 50
        
        # Add gradient background
        for i in range(height):
            color_value = int(240 + (i / height) * 15)
            draw.line([(0, i), (width, i)], fill=(color_value, color_value, 255))
        
        # Draw quote text
        draw.text((x, y), wrapped_text, fill='black', font=font, align='center')
        
        # Add author
        author = f"- {bot_account.get('displayName', 'Anonymous')}"
        author_bbox = draw.textbbox((0, 0), author, font=author_font)
        author_width = author_bbox[2] - author_bbox[0]
        author_x = (width - author_width) // 2
        draw.text((author_x, y + text_height + 40), author, fill='gray', font=author_font)
        
        # Convert to base64
        buffer = io.BytesIO()
        image.save(buffer, format='PNG')
        image_data = base64.b64encode(buffer.getvalue()).decode()
        
        return {
            'type': 'generated_image',
            'media_type': 'quote_card',
            'image_data': image_data,
            'description': f"Quote card: {clean_quote[:50]}...",
            'alt_text': f"Quote card with text: {clean_quote}"
        }
    
    async def _generate_photo_with_caption(self, topic: str, content_text: str, bot_account: Dict) -> Optional[Dict]:
        """Generate photo from Unsplash with overlay caption"""
        
        if not self.unsplash_access_key:
            return None
        
        try:
            # Search for relevant photo
            search_url = f"https://api.unsplash.com/search/photos"
            params = {
                'query': topic,
                'per_page': 10,
                'orientation': 'landscape'
            }
            headers = {
                'Authorization': f'Client-ID {self.unsplash_access_key}'
            }
            
            response = requests.get(search_url, params=params, headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                photos = data.get('results', [])
                
                if photos:
                    photo = random.choice(photos)
                    photo_url = photo['urls']['regular']
                    
                    return {
                        'type': 'unsplash_photo',
                        'media_type': 'photo_with_caption',
                        'image_url': photo_url,
                        'description': f"Photo about {topic}",
                        'alt_text': photo.get('alt_description', f"Photo related to {topic}"),
                        'photographer': photo['user']['name'],
                        'unsplash_id': photo['id']
                    }
        
        except Exception as e:
            print(f"⚠️ Error fetching Unsplash photo: {e}")
        
        return None
    
    async def _generate_simple_infographic(self, topic: str, content_text: str, bot_account: Dict) -> Dict:
        """Generate a simple infographic-style image"""
        
        width, height = 800, 600
        image = Image.new('RGB', (width, height), color='white')
        draw = ImageDraw.Draw(image)
        
        # Try to load fonts
        try:
            title_font = ImageFont.truetype("arial.ttf", 36)
            content_font = ImageFont.truetype("arial.ttf", 24)
        except:
            title_font = ImageFont.load_default()
            content_font = ImageFont.load_default()
        
        # Create gradient background
        for i in range(height):
            color_value = int(250 - (i / height) * 30)
            draw.line([(0, i), (width, i)], fill=(color_value, 255, color_value))
        
        # Add title
        title = topic.title()
        title_bbox = draw.textbbox((0, 0), title, font=title_font)
        title_width = title_bbox[2] - title_bbox[0]
        title_x = (width - title_width) // 2
        draw.text((title_x, 50), title, fill='darkgreen', font=title_font)
        
        # Add content points
        content_lines = content_text.split('.')[0:3]  # First 3 sentences
        y_offset = 150
        
        for i, line in enumerate(content_lines):
            if line.strip():
                bullet_point = f"• {line.strip()}"
                wrapped_line = textwrap.fill(bullet_point, width=60)
                draw.text((50, y_offset), wrapped_line, fill='black', font=content_font)
                y_offset += 80
        
        # Add footer
        footer = f"Insights by {bot_account.get('displayName', 'AI Bot')}"
        draw.text((50, height - 50), footer, fill='gray', font=content_font)
        
        # Convert to base64
        buffer = io.BytesIO()
        image.save(buffer, format='PNG')
        image_data = base64.b64encode(buffer.getvalue()).decode()
        
        return {
            'type': 'generated_image',
            'media_type': 'infographic',
            'image_data': image_data,
            'description': f"Infographic about {topic}",
            'alt_text': f"Infographic showing key points about {topic}"
        }
    
    async def _generate_ai_art_concept(self, topic: str, bot_account: Dict) -> Dict:
        """Generate AI art concept (placeholder - would integrate with actual AI art API)"""
        
        # For now, generate a colorful abstract image
        width, height = 800, 800
        image = Image.new('RGB', (width, height), color='white')
        draw = ImageDraw.Draw(image)
        
        # Create abstract art with random shapes and colors
        colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'cyan']
        
        for _ in range(20):
            x1, y1 = random.randint(0, width), random.randint(0, height)
            x2, y2 = random.randint(0, width), random.randint(0, height)
            color = random.choice(colors)
            draw.ellipse([x1, y1, x2, y2], fill=color, outline='black')
        
        # Add title
        try:
            font = ImageFont.truetype("arial.ttf", 48)
        except:
            font = ImageFont.load_default()
        
        title = f"AI Art: {topic}"
        draw.text((50, 50), title, fill='white', font=font, stroke_width=2, stroke_fill='black')
        
        # Convert to base64
        buffer = io.BytesIO()
        image.save(buffer, format='PNG')
        image_data = base64.b64encode(buffer.getvalue()).decode()
        
        return {
            'type': 'generated_image',
            'media_type': 'ai_art',
            'image_data': image_data,
            'description': f"AI-generated art inspired by {topic}",
            'alt_text': f"Abstract AI art representing {topic}"
        }
    
    async def _generate_meme_style_image(self, content_text: str, bot_account: Dict) -> Dict:
        """Generate a meme-style image"""
        
        width, height = 600, 400
        image = Image.new('RGB', (width, height), color='lightblue')
        draw = ImageDraw.Draw(image)
        
        # Try to load font
        try:
            font = ImageFont.truetype("arial.ttf", 32)
        except:
            font = ImageFont.load_default()
        
        # Extract main text (remove hashtags)
        main_text = content_text.split('#')[0].strip()
        if len(main_text) > 100:
            main_text = main_text[:100] + "..."
        
        # Wrap text
        wrapped_text = textwrap.fill(main_text, width=30)
        
        # Calculate position
        text_bbox = draw.textbbox((0, 0), wrapped_text, font=font)
        text_width = text_bbox[2] - text_bbox[0]
        text_height = text_bbox[3] - text_bbox[1]
        
        x = (width - text_width) // 2
        y = (height - text_height) // 2
        
        # Draw text with outline
        draw.text((x, y), wrapped_text, fill='white', font=font, align='center', 
                 stroke_width=2, stroke_fill='black')
        
        # Convert to base64
        buffer = io.BytesIO()
        image.save(buffer, format='PNG')
        image_data = base64.b64encode(buffer.getvalue()).decode()
        
        return {
            'type': 'generated_image',
            'media_type': 'meme',
            'image_data': image_data,
            'description': f"Meme-style image with text",
            'alt_text': f"Meme image with text: {main_text[:50]}..."
        }
    
    def _initialize_ai_art_prompts(self) -> Dict:
        """Initialize AI art prompt templates"""
        return {
            'tech': [
                "futuristic digital landscape with neon circuits",
                "abstract representation of artificial intelligence",
                "cyberpunk cityscape with holographic displays"
            ],
            'nature': [
                "serene forest with magical lighting",
                "abstract representation of natural elements",
                "dreamy landscape with flowing water"
            ],
            'art': [
                "colorful abstract expressionist painting",
                "surreal artistic composition",
                "modern art interpretation of emotions"
            ]
        }

class MultimediaExpansionService:
    def __init__(self):
        """Initialize multimedia expansion service"""
        self.generator = MultimediaGenerator()
        self.media_generation_chance = 0.3  # 30% chance to generate media
    
    def set_unsplash_key(self, access_key: str) -> None:
        """Set Unsplash access key"""
        self.generator.set_unsplash_key(access_key)
    
    async def enhance_post_with_media(self, bot_account: Dict, topic: str, content_text: str) -> Optional[Dict]:
        """Enhance post with multimedia content if appropriate"""
        
        # Check if we should generate media for this post
        if random.random() > self.media_generation_chance:
            return None
        
        # Generate multimedia content
        media_content = await self.generator.generate_multimedia_content(bot_account, topic, content_text)
        
        if media_content:
            print(f"🎨 Generated {media_content['media_type']} for {bot_account.get('displayName')}")
        
        return media_content
    
    def should_generate_media_for_bot(self, bot_type: str) -> bool:
        """Determine if bot type should generate media"""
        
        media_friendly_types = ['photographer', 'artist', 'lifestyle', 'nature']
        
        if bot_type in media_friendly_types:
            return random.random() < 0.5  # 50% chance for media-friendly bots
        else:
            return random.random() < 0.2  # 20% chance for other bots
    
    def get_media_stats(self) -> Dict:
        """Get multimedia generation statistics"""
        return {
            'media_generation_chance': self.media_generation_chance,
            'supported_media_types': [media_type.value for media_type in MediaType],
            'total_media_generated': 0  # Would track in production
        }

# Global instance
multimedia_expansion_service = MultimediaExpansionService()
