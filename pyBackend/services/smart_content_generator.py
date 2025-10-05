"""
Smart Content Generator - AI-Powered Posts for Real Users
Simplified version that generates content for real users only
"""

import random
import asyncio
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from services.unsplash_service import UnsplashService
from services.bot_profile import BotProfile  # Simple bot profile for AI captions
from services.gpt_service import GPTService
from services.image_tracker import global_image_tracker
from services.mood_context_service import mood_context_service
from services.event_aware_service import event_aware_service
from services.bot_memory_service import bot_memory_service

class SmartContentGenerator:
    
    def __init__(self, unsplash_service: UnsplashService):
        self.unsplash_service = unsplash_service
        self.gpt_service = GPTService()
        
    async def generate_smart_post_for_bot_account(self, bot_account: Dict) -> Optional[Dict]:
        """Generate smart post content for bot account based on their expertise"""
        # Select topic based on bot's expertise and interests
        topic = self._select_smart_topic_for_bot(bot_account)
        
        # Decide post type: 70% with images, 30% text-only for natural variety
        post_type_chance = random.random()
        
        if post_type_chance < 0.3:  # 30% chance for text-only posts
            print(f"📝 Generating text-only post for {bot_account.get('displayName')}")
            return await self._generate_text_only_post(bot_account, topic)
        else:  # 70% chance for image posts
            # Determine number of images based on bot type
            bot_type = bot_account.get('botType', 'lifestyle')
            if bot_type == 'photographer':
                num_images = random.randint(1, 4)  # Photographers post more images
            elif bot_type == 'artist':
                num_images = random.randint(1, 3)  # Artists showcase their work
            else:
                num_images = random.randint(1, 2)  # Others post fewer images
            
            print(f"📸 Generating image post for {bot_account.get('displayName')}")
            return await self._generate_post_for_bot_account(bot_account, topic, num_images)
    
    async def _generate_post_for_bot_account(self, bot_account: Dict, topic: str, num_images: int) -> Dict:
        try:
            # Get unique images from Unsplash with randomization
            photos = await self._get_unique_images(topic, num_images, bot_account)
            
            if not photos:
                return None
            
            # Create bot profile using bot account data
            bot_profile = BotProfile(
                id=bot_account.get('_id', 'temp'),
                name=bot_account.get('displayName', 'Bot'),
                username=bot_account.get('username', 'bot'),
                personality_type=bot_account.get('botType', 'lifestyle'),  # Use bot's personality
                bio=bot_account.get('bio', 'AI Content Creator'),
                interests=[topic],
                posting_style="creative",
                created_at=datetime.now()
            )
            
            # Generate AI caption using bot profile and expertise
            caption = await self.gpt_service.generate_professional_caption(
                bot_account, 
                topic, 
                photos[0] if photos else None
            )
            
            # Return post data
            return {
                "content": caption or f" Beautiful {topic} moment ✨ #{topic} #photography",
                "bot_account": bot_account,
                "topic": topic,
                "post_type": f"bot_account_{num_images}_images"
            }
            
        except Exception as e:
            print(f"❌ Error generating post for bot account {bot_account.get('displayName', 'Unknown')}: {str(e)}")
            print(f"   Topic: {topic}, Images requested: {num_images}")
            return None
    
    async def _generate_text_only_post(self, bot_account: Dict, topic: str) -> Dict:
        """Generate text-only post using AI with advanced context awareness"""
        try:
            bot_id = bot_account.get('_id', 'unknown')
            
            # Get current context (time, mood, events)
            context = mood_context_service.get_current_context()
            
            # Check memory for thought continuation
            memory = bot_memory_service.get_bot_memory(bot_id)
            
            # Generate enhanced prompt with all context layers
            base_prompt = mood_context_service.generate_mood_based_prompt(bot_account, topic, context)
            event_enhanced_prompt = event_aware_service.enhance_prompt_with_events(base_prompt, bot_account)
            final_prompt = bot_memory_service.enhance_prompt_with_memory(bot_id, topic, event_enhanced_prompt)
            
            # Generate AI-powered text content with enhanced context
            text_content = await self.gpt_service.generate_enhanced_text_post(
                bot_account, topic, final_prompt, context
            )
            
            if not text_content:
                # Fallback to template-based text with context
                text_content = self._generate_context_aware_template(bot_account, topic, context)
            
            # Check for repetition before finalizing
            if not bot_memory_service.should_allow_post(bot_id, text_content):
                print(f"🔄 Content too similar to recent posts, regenerating...")
                # Try template fallback
                text_content = self._generate_context_aware_template(bot_account, topic, context)
            
            # Create post data with enhanced metadata
            post_data = {
                "content": text_content,
                "images": [],  # No images for text-only posts
                "bot_account": bot_account,
                "topic": topic,
                "post_type": "text_only",
                "mood": context.get('mood', 'balanced'),
                "time_context": context['time_context'].value,
                "day_context": context['day_context'].value,
                "events_referenced": event_aware_service.get_current_events()
            }
            
            # Add to bot memory
            bot_memory_service.add_post_to_memory(bot_id, post_data)
            
            return post_data
            
        except Exception as e:
            print(f"❌ Error generating text-only post for {bot_account.get('displayName', 'Unknown')}: {str(e)}")
            return None
    
    def _generate_template_text_post(self, bot_account: Dict, topic: str) -> str:
        """Generate template-based text post as fallback"""
        bot_type = bot_account.get('botType', 'lifestyle')
        display_name = bot_account.get('displayName', 'AI Creator')
        interests = bot_account.get('interests', [])
        
        # Natural text templates by bot type
        text_templates = {
            'tech': [
                f"💭 Been thinking about {topic} lately... The possibilities are endless when you combine creativity with technology!",
                f"🚀 Quick thought: {topic} is reshaping our industry faster than we imagined. What's your take on this?",
                f"💡 Working late tonight on some {topic} concepts. Sometimes the best ideas come when the world is quiet.",
                f"🤔 Question for my fellow tech enthusiasts: How do you see {topic} evolving in the next 5 years?",
                f"⚡ Just had an 'aha!' moment about {topic}. It's amazing how one insight can change everything.",
                f"🔮 Prediction: {topic} will be the game-changer we've all been waiting for. Mark my words!"
            ],
            'photographer': [
                f"📸 Today's mood: chasing the perfect {topic} shot. Sometimes the best photos happen when you're not even trying.",
                f"🌅 Woke up thinking about {topic} photography. There's something magical about capturing fleeting moments.",
                f"✨ Hot take: {topic} isn't just about technique - it's about feeling the moment and letting it guide you.",
                f"📷 Been experimenting with {topic} compositions. Every frame teaches you something new about seeing.",
                f"🎯 Photography tip: When shooting {topic}, patience is your best friend. Wait for the magic to happen.",
                f"💫 That moment when {topic} and perfect light align... Pure photographer's bliss!"
            ],
            'artist': [
                f"🎨 Inspiration struck at 3am: {topic} but with a twist. Sometimes creativity doesn't follow a schedule.",
                f"✨ Been sketching {topic} concepts all morning. Art is how we make sense of the beautiful chaos around us.",
                f"🌈 Color theory meets {topic}... The combinations are endless when you let your imagination run wild.",
                f"🖌️ Working on a new {topic} piece. Every brushstroke is a conversation between intention and spontaneity.",
                f"💭 Art thought: {topic} represents so much more than what meets the eye. What do you see?",
                f"🎭 Creative block? Never heard of it. {topic} just gave me 10 new ideas to explore!"
            ],
            'traveler': [
                f"✈️ Missing those {topic} adventures... Nothing beats the feeling of discovering something completely unexpected.",
                f"🌍 Travel memory: That time {topic} led me to the most incredible hidden spot. Serendipity is the best guide.",
                f"🗺️ Planning my next {topic} expedition. The world is full of stories waiting to be discovered.",
                f"🎒 Travel wisdom: {topic} experiences teach you more about yourself than any classroom ever could.",
                f"🌅 Sunrise thoughts: Every {topic} journey changes you in ways you never expected. That's the magic of travel.",
                f"📍 Been dreaming about {topic} destinations lately. Where should I explore next?"
            ],
            'lifestyle': [
                f"🌱 Morning reflection: {topic} reminds me to slow down and appreciate the simple moments.",
                f"☕ Coffee thoughts: How {topic} became part of my daily mindfulness practice. Small changes, big impact.",
                f"✨ Grateful for {topic} moments like these. Life's beauty is often found in the ordinary.",
                f"💫 Weekend vibes: {topic} and complete presence. Sometimes the best plans are no plans at all.",
                f"🧘‍♀️ Mindful moment: {topic} taught me that wellness isn't a destination, it's a daily choice.",
                f"🌸 Self-care reminder: {topic} is not selfish - you can't pour from an empty cup."
            ],
            'nature': [
                f"🌿 Nature observation: {topic} in its natural habitat is pure poetry in motion.",
                f"🦋 Witnessed something incredible today - {topic} reminding me why conservation matters so much.",
                f"🌊 Ocean thoughts: {topic} and the rhythm of waves have a way of putting everything in perspective.",
                f"🏔️ Mountain wisdom: {topic} teaches us that the most beautiful views come after the hardest climbs.",
                f"🌳 Forest bathing with {topic} vibes. Nature is the ultimate therapist and teacher.",
                f"⭐ Under the stars thinking about {topic}... The universe has a way of making our problems feel smaller."
            ]
        }
        
        # Get templates for bot type
        templates = text_templates.get(bot_type, text_templates['lifestyle'])
        base_text = random.choice(templates)
        
        # Add relevant hashtags for text posts
        hashtags = self._generate_text_post_hashtags(bot_type, topic, interests)
        
        return f"{base_text}\n\n{hashtags}"
    
    def _generate_context_aware_template(self, bot_account: Dict, topic: str, context: Dict) -> str:
        """Generate context-aware template with time/mood/event awareness"""
        
        bot_type = bot_account.get('botType', 'lifestyle')
        display_name = bot_account.get('displayName', 'AI Creator')
        time_context = context['time_context'].value
        is_weekend = context['is_weekend']
        
        # Time-aware templates
        time_templates = {
            'early_morning': [
                f"🌅 Early morning thoughts about {topic}... There's something peaceful about starting the day with clarity.",
                f"☕ 5am reflections: {topic} hits different when the world is still quiet.",
                f"🌄 Dawn inspiration about {topic}. The best ideas come when your mind is fresh."
            ],
            'morning': [
                f"🌞 Good morning! Starting the day thinking about {topic}. Ready to make things happen!",
                f"☕ Morning energy is real! {topic} is exactly what I needed to focus on today.",
                f"🚀 Monday motivation: {topic} is going to be a game-changer this week!"
            ],
            'evening': [
                f"🌅 Evening reflection: {topic} taught me something important today.",
                f"🍷 Winding down with thoughts about {topic}. Grateful for today's insights.",
                f"🌙 Tonight I'm thinking about {topic} and how it connects to everything else."
            ],
            'late_night': [
                f"🌙 2am thoughts: {topic} is keeping me up, but in the best way possible.",
                f"⭐ Late night creativity hitting different. {topic} just sparked something amazing.",
                f"🌌 Can't sleep because {topic} opened up a whole new perspective."
            ]
        }
        
        # Weekend vs weekday adjustment
        if is_weekend:
            weekend_templates = [
                f"🌿 Weekend vibes: {topic} feels more relaxed and inspiring today.",
                f"😌 Saturday thoughts about {topic}. Love having time to really think deeply.",
                f"🏖️ Sunday reflection: {topic} hits different when you're not rushing."
            ]
            time_templates[time_context].extend(weekend_templates)
        
        # Get appropriate templates
        templates = time_templates.get(time_context, time_templates['morning'])
        base_text = random.choice(templates)
        
        # Add context-aware hashtags
        hashtags = self._generate_context_hashtags(bot_type, topic, context)
        
        return f"{base_text}\n\n{hashtags}"
    
    def _generate_context_hashtags(self, bot_type: str, topic: str, context: Dict) -> str:
        """Generate hashtags based on context"""
        
        base_tags = self._generate_text_post_hashtags(bot_type, topic, [])
        
        # Add time-based hashtags
        time_context = context['time_context'].value
        time_hashtags = {
            'early_morning': ['#EarlyBird', '#MorningThoughts'],
            'morning': ['#MondayMotivation', '#MorningEnergy'],
            'evening': ['#EveningReflection', '#Grateful'],
            'late_night': ['#LateNightThoughts', '#Insomnia']
        }
        
        # Add weekend hashtags
        if context['is_weekend']:
            time_hashtags[time_context] = time_hashtags.get(time_context, []) + ['#WeekendVibes', '#ChillMode']
        
        # Combine hashtags
        context_tags = time_hashtags.get(time_context, [])
        if context_tags:
            selected_context_tags = random.sample(context_tags, min(2, len(context_tags)))
            base_tags += ' ' + ' '.join(selected_context_tags)
        
        return base_tags
    
    def _generate_text_post_hashtags(self, bot_type: str, topic: str, interests: list) -> str:
        """Generate hashtags for text-only posts"""
        # Lighter hashtag usage for text posts (3-5 hashtags)
        type_hashtags = {
            'tech': ['#TechThoughts', '#Innovation', '#FutureTech'],
            'photographer': ['#PhotographyLife', '#CreativeVision', '#LensLove'],
            'artist': ['#ArtisticJourney', '#CreativeProcess', '#ArtLife'],
            'traveler': ['#TravelThoughts', '#Wanderlust', '#ExploreMore'],
            'lifestyle': ['#MindfulLiving', '#LifeReflections', '#WellnessJourney'],
            'nature': ['#NatureLovers', '#EcoThoughts', '#WildlifeWisdom']
        }
        
        base_tags = type_hashtags.get(bot_type, ['#Thoughts', '#Life'])
        
        # Add topic hashtag
        topic_tag = f"#{topic.replace(' ', '').title()}"
        if topic_tag not in base_tags:
            base_tags.append(topic_tag)
        
        # Select 3-4 hashtags for text posts (less cluttered)
        selected_tags = base_tags[:random.randint(3, 4)]
        
        return ' '.join(selected_tags)
    
    def _select_smart_topic_for_bot(self, bot_account: Dict) -> str:
        """Select topic based on bot's expertise and interests"""
        bot_type = bot_account.get('botType', 'lifestyle')
        interests = bot_account.get('interests', [])
        
        # Topic mapping based on bot type and interests
        topic_mapping = {
            'tech': [
                'technology', 'artificial intelligence', 'coding', 'innovation', 
                'software development', 'startup', 'digital transformation', 'cybersecurity'
            ],
            'photographer': [
                'photography', 'golden hour', 'portrait', 'landscape', 
                'street photography', 'nature photography', 'architectural photography'
            ],
            'artist': [
                'digital art', 'creative design', 'illustration', 'graphic design',
                'contemporary art', 'artistic inspiration', 'creative process'
            ],
            'traveler': [
                'travel destination', 'adventure', 'cultural heritage', 'backpacking',
                'world exploration', 'local cuisine', 'hidden gems'
            ],
            'lifestyle': [
                'wellness', 'mindful living', 'healthy lifestyle', 'work life balance',
                'self care', 'fitness motivation', 'morning routine'
            ],
            'nature': [
                'wildlife', 'conservation', 'forest', 'ocean waves', 
                'mountain landscape', 'environmental protection', 'natural beauty'
            ]
        }
        
        # Get topics for bot type
        available_topics = topic_mapping.get(bot_type, topic_mapping['lifestyle'])
        
        # Add interest-based topics
        if interests:
            for interest in interests:
                if interest in ['islamic studies', 'community leadership', 'halal business']:
                    available_topics.extend(['islamic architecture', 'community service', 'peaceful lifestyle'])
                elif interest in ['healthcare', 'medicine']:
                    available_topics.extend(['medical technology', 'health awareness', 'wellness'])
                elif interest in ['education', 'teaching']:
                    available_topics.extend(['learning', 'knowledge sharing', 'educational technology'])
        
        return random.choice(available_topics)
    
    async def _get_unique_images(self, topic: str, num_images: int, bot_account: Dict) -> List[Dict]:
        """Get unique, non-duplicate images from Unsplash"""
        photos = []
        
        try:
            # Strategy 1: Advanced search with multiple randomization layers
            
            # Layer 1: Random page from deeper pages (avoid popular results)
            random_page = random.randint(3, 15)  # Pages 3-15 for more unique content
            
            # Layer 2: Random order parameter
            order_options = ['latest', 'oldest', 'popular']
            random_order = random.choice(order_options)
            
            # Layer 3: Use original topic (seed was causing no results)
            print(f"🔍 Searching: '{topic}' | Page: {random_page} | Order: {random_order}")
            
            search_result = await self.unsplash_service.search_photos(
                topic, 
                per_page=min(30, num_images * 5),  # Get even more photos
                page=random_page
            )
            
            # If no results from deep pages, try shallower pages
            if not search_result or not search_result.get('results'):
                print(f"🔄 No results from page {random_page}, trying page 1-3...")
                random_page = random.randint(1, 3)
                search_result = await self.unsplash_service.search_photos(
                    topic, 
                    per_page=min(30, num_images * 5),
                    page=random_page
                )
            
            if search_result and search_result.get('results'):
                available_photos = search_result['results']
                
                # EXTREME RANDOMIZATION: Shuffle and skip random amount
                random.shuffle(available_photos)  # Shuffle the entire list
                skip_amount = random.randint(0, max(0, len(available_photos) // 3))  # Skip 0-33% of photos
                available_photos = available_photos[skip_amount:]  # Skip some photos
                
                print(f"📊 Found {len(available_photos)} photos, skipped {skip_amount} for uniqueness")
                
                # Select unique photos with global tracking
                unique_photos = []
                for photo in available_photos:
                    photo_id = photo.get('id')
                    photo_url = photo.get('urls', {}).get('regular', '')
                    
                    if not global_image_tracker.is_image_used(photo_id, photo_url):
                        unique_photos.append(photo)
                        # Mark as used immediately
                        global_image_tracker.mark_image_used(photo_id, photo_url)
                        
                        if len(unique_photos) >= num_images:
                            break
                
                photos = unique_photos
            
            # Strategy 2: If not enough photos, try MULTIPLE search strategies
            if len(photos) < num_images:
                remaining_needed = num_images - len(photos)
                print(f"🔄 Need {remaining_needed} more photos, trying variations...")
                
                # Sub-strategy 2A: Topic variations with different pages
                topic_variations = self._get_topic_variations(topic, bot_account)
                
                for variation in topic_variations:
                    if len(photos) >= num_images:
                        break
                    
                    # Try multiple pages for each variation
                    for page_num in [random.randint(1, 5), random.randint(6, 10)]:
                        if len(photos) >= num_images:
                            break
                            
                        print(f"🔍 Trying variation: '{variation}' page {page_num}")
                        search_result = await self.unsplash_service.search_photos(
                            variation, 
                            per_page=20,
                            page=page_num
                        )
                        
                        if search_result and search_result.get('results'):
                            for photo in search_result['results']:
                                if len(photos) >= num_images:
                                    break
                                    
                                photo_id = photo.get('id')
                                photo_url = photo.get('urls', {}).get('regular', '')
                                
                                if not global_image_tracker.is_image_used(photo_id, photo_url):
                                    photos.append(photo)
                                    global_image_tracker.mark_image_used(photo_id, photo_url)
                
                # Sub-strategy 2B: Random photos with variations
                if len(photos) < num_images:
                    remaining_needed = num_images - len(photos)
                    
                    for variation in topic_variations[:3]:  # Try top 3 variations
                        if len(photos) >= num_images:
                            break
                            
                        random_photos = await self.unsplash_service.get_random_photos(
                            count=remaining_needed * 2,  # Get more than needed
                            query=variation
                        )
                    
                    if random_photos:
                        # Add unique photos (avoid duplicates by ID and global tracking)
                        existing_ids = {p.get('id') for p in photos}
                        for photo in random_photos:
                            photo_id = photo.get('id')
                            photo_url = photo.get('urls', {}).get('regular', '')
                            
                            # Check both local and global uniqueness
                            if (photo_id not in existing_ids and 
                                len(photos) < num_images and
                                not global_image_tracker.is_image_used(photo_id, photo_url)):
                                
                                photos.append(photo)
                                existing_ids.add(photo_id)
                                # Mark as used globally
                                global_image_tracker.mark_image_used(photo_id, photo_url)
            
            # Strategy 3: EXTREME FALLBACK - Multiple random approaches
            if len(photos) < num_images:
                remaining_needed = num_images - len(photos)
                print(f"🚨 Still need {remaining_needed} photos, using extreme fallback...")
                
                # Approach 3A: Completely random photos (no query)
                fallback_photos = await self.unsplash_service.get_random_photos(count=remaining_needed * 3)
                
                if fallback_photos:
                    existing_ids = {p.get('id') for p in photos}
                    for photo in fallback_photos:
                        photo_id = photo.get('id')
                        photo_url = photo.get('urls', {}).get('regular', '')
                        
                        if (photo_id not in existing_ids and 
                            len(photos) < num_images and
                            not global_image_tracker.is_image_used(photo_id, photo_url)):
                            
                            photos.append(photo)
                            global_image_tracker.mark_image_used(photo_id, photo_url)
                
                # Approach 3B: If still not enough, try generic terms
                if len(photos) < num_images:
                    generic_terms = ['beautiful', 'nature', 'abstract', 'minimal', 'colorful', 'peaceful']
                    
                    for term in generic_terms:
                        if len(photos) >= num_images:
                            break
                            
                        # Try random pages for generic terms
                        random_page = random.randint(1, 20)
                        search_result = await self.unsplash_service.search_photos(
                            term, 
                            per_page=10,
                            page=random_page
                        )
                        
                        if search_result and search_result.get('results'):
                            for photo in search_result['results']:
                                if len(photos) >= num_images:
                                    break
                                    
                                photo_id = photo.get('id')
                                photo_url = photo.get('urls', {}).get('regular', '')
                                
                                if not global_image_tracker.is_image_used(photo_id, photo_url):
                                    photos.append(photo)
                                    global_image_tracker.mark_image_used(photo_id, photo_url)
            
            # Log statistics
            stats = global_image_tracker.get_stats()
            print(f"📸 Retrieved {len(photos)} unique images for topic '{topic}'")
            print(f"📊 Global tracker: {stats['tracked_images']} images tracked")
            return photos
            
        except Exception as e:
            print(f"❌ Error getting unique images: {e}")
            return []
    
    def _get_topic_variations(self, topic: str, bot_account: Dict) -> List[str]:
        """Generate topic variations for more diverse image results"""
        bot_type = bot_account.get('botType', 'lifestyle')
        
        # Base variations
        variations = [topic]
        
        # Add bot-type specific variations
        if bot_type == 'tech':
            variations.extend([
                f"{topic} technology",
                f"modern {topic}",
                f"{topic} innovation",
                f"digital {topic}"
            ])
        elif bot_type == 'photographer':
            variations.extend([
                f"{topic} photography",
                f"beautiful {topic}",
                f"{topic} aesthetic",
                f"professional {topic}"
            ])
        elif bot_type == 'artist':
            variations.extend([
                f"{topic} art",
                f"creative {topic}",
                f"{topic} design",
                f"artistic {topic}"
            ])
        elif bot_type == 'traveler':
            variations.extend([
                f"{topic} travel",
                f"{topic} destination",
                f"explore {topic}",
                f"{topic} adventure"
            ])
        elif bot_type == 'lifestyle':
            variations.extend([
                f"{topic} lifestyle",
                f"healthy {topic}",
                f"{topic} wellness",
                f"mindful {topic}"
            ])
        elif bot_type == 'nature':
            variations.extend([
                f"{topic} nature",
                f"wild {topic}",
                f"{topic} environment",
                f"natural {topic}"
            ])
        
        # Add time-based variations for more uniqueness
        import datetime
        hour = datetime.datetime.now().hour
        if 6 <= hour <= 10:
            variations.append(f"morning {topic}")
        elif 11 <= hour <= 14:
            variations.append(f"midday {topic}")
        elif 15 <= hour <= 18:
            variations.append(f"afternoon {topic}")
        else:
            variations.append(f"evening {topic}")
        
        # Shuffle and return unique variations
        unique_variations = list(set(variations))
        random.shuffle(unique_variations)
        return unique_variations[:5]  # Limit to 5 variations
