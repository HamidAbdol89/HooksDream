/**
 * Script to create realistic posts for bot accounts with relevant images from Unsplash
 * Run: node scripts/create-realistic-bot-posts.js
 */

const mongoose = require('mongoose');
const User = require('../models/User');
const Post = require('../models/Post');
const axios = require('axios');
require('dotenv').config();

// Unsplash API configuration
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
const UNSPLASH_API = 'https://api.unsplash.com';

// Content templates based on bot type and interests
const generateContentTemplates = () => {
    return {
        tech: {
            captions: [
                "🚀 Excited to share my latest project! The future of technology is here and it's incredible.",
                "💻 Just finished debugging a complex algorithm. There's nothing more satisfying than clean, efficient code!",
                "⚡ AI is transforming how we work and live. Here's what I'm building to make a difference.",
                "🔮 The intersection of technology and humanity fascinates me. Building solutions that matter.",
                "💡 Innovation happens when we dare to think differently. What's your next big idea?",
                "🌐 Working on something that could change how we connect with each other online.",
                "🤖 Machine learning isn't just about algorithms - it's about understanding human needs.",
                "⚙️ Behind every great app is countless hours of passionate development. Worth every moment!"
            ],
            searchTerms: [
                'coding programming laptop',
                'technology innovation office',
                'artificial intelligence computer',
                'software development workspace',
                'tech startup office',
                'data science analytics',
                'mobile app development',
                'cybersecurity technology'
            ]
        },
        
        photographer: {
            captions: [
                "📸 Golden hour magic never gets old. Every sunset tells a different story.",
                "🌅 Caught this perfect moment just as the light was fading. Photography is about patience.",
                "✨ Sometimes the best shots happen when you least expect them. Always be ready!",
                "🎯 Composition is everything. It's not just what you capture, but how you frame it.",
                "📷 Behind every great photo is a story waiting to be told. What story do you see here?",
                "🌟 Light and shadow dancing together - this is why I love what I do.",
                "🔍 The details matter. Sometimes the smallest elements make the biggest impact.",
                "🎨 Photography is painting with light. Today's canvas was absolutely perfect."
            ],
            searchTerms: [
                'photography camera professional',
                'golden hour landscape',
                'portrait photography studio',
                'street photography urban',
                'nature photography wildlife',
                'wedding photography couple',
                'architectural photography building',
                'macro photography close up'
            ]
        },
        
        artist: {
            captions: [
                "🎨 Art is the language of the soul. Today I'm speaking in colors and textures.",
                "✨ Every brushstroke tells a story. What story are you telling with your creativity?",
                "🌈 Color theory in action! The way hues interact can evoke such powerful emotions.",
                "🖼️ Finished this piece after weeks of work. Art teaches patience and persistence.",
                "💫 Inspiration struck at 3am. Sometimes creativity doesn't follow a schedule.",
                "🎭 Art isn't just what you see - it's what you make others feel.",
                "🖌️ The creative process is messy, beautiful, and absolutely worth it.",
                "🌟 Every artist was first an amateur. Keep creating, keep growing!"
            ],
            searchTerms: [
                'artist painting studio creative',
                'digital art design workspace',
                'sculpture art gallery',
                'graphic design creative process',
                'illustration drawing tablet',
                'art supplies brushes paint',
                'creative workspace inspiration',
                'contemporary art exhibition'
            ]
        },
        
        traveler: {
            captions: [
                "✈️ New destination, new adventures! The world is full of incredible places to explore.",
                "🌍 Travel isn't just about the places you visit - it's about the person you become.",
                "🗺️ Got lost today and found the most amazing hidden gem. Sometimes the best adventures are unplanned.",
                "🎒 Packing light but dreaming big. Next stop: somewhere I've never been before!",
                "🌅 Watching the sunrise from a new continent. These are the moments that make it all worth it.",
                "🏔️ Every mountain climbed, every ocean crossed, adds a new chapter to my story.",
                "🚂 The journey is just as important as the destination. Embracing every moment.",
                "📍 Collecting memories, not things. This view will stay with me forever."
            ],
            searchTerms: [
                'travel adventure backpack',
                'airplane window view flight',
                'mountain hiking adventure',
                'beach tropical vacation',
                'city skyline urban travel',
                'cultural heritage architecture',
                'food travel local cuisine',
                'road trip adventure car'
            ]
        },
        
        lifestyle: {
            captions: [
                "🌱 Living mindfully means appreciating the small moments that make life beautiful.",
                "☕ Morning rituals set the tone for the entire day. How do you start yours?",
                "🧘‍♀️ Finding balance in a busy world isn't easy, but it's so worth the effort.",
                "💪 Wellness isn't a destination - it's a daily choice to prioritize yourself.",
                "🌸 Self-care isn't selfish. You can't pour from an empty cup.",
                "✨ Gratitude transforms ordinary days into extraordinary ones.",
                "🏃‍♀️ Movement is medicine. Every step forward is progress worth celebrating.",
                "🌿 Simple pleasures: good food, great company, and moments of peace."
            ],
            searchTerms: [
                'wellness lifestyle healthy living',
                'yoga meditation mindfulness',
                'healthy food nutrition',
                'fitness workout exercise',
                'self care relaxation',
                'morning routine coffee',
                'work life balance',
                'mindful living peaceful'
            ]
        },
        
        nature: {
            captions: [
                "🌿 Nature has a way of healing the soul. Every forest walk is therapy.",
                "🦋 Witnessed this incredible moment in the wild today. Nature never ceases to amaze me.",
                "🌊 The ocean's rhythm reminds us to go with the flow and trust the process.",
                "🏔️ Mountains teach us that the most beautiful views come after the hardest climbs.",
                "🌺 In nature, nothing is perfect and everything is perfect. Pure wisdom.",
                "🦅 Wildlife photography requires patience, but the rewards are immeasurable.",
                "🌳 Every tree has a story. Every leaf holds secrets. Nature is the greatest teacher.",
                "⭐ Under the stars, our problems seem smaller and our dreams feel bigger."
            ],
            searchTerms: [
                'nature forest wildlife',
                'ocean waves seascape',
                'mountain landscape hiking',
                'flowers botanical garden',
                'birds wildlife photography',
                'sunset nature peaceful',
                'river stream natural',
                'conservation environment'
            ]
        }
    };
};

// Islamic/Muslim specific content
const generateIslamicContent = () => {
    return {
        captions: [
            "🕌 Alhamdulillah for another blessed day. Grateful for all of Allah's blessings.",
            "📖 Seeking knowledge is a duty upon every Muslim. Always learning, always growing.",
            "🤲 In every difficulty, there is ease. Trust in Allah's perfect timing.",
            "☪️ The best of people are those who benefit others. How can we serve today?",
            "🌙 Ramadan Mubarak! May this holy month bring peace and reflection to all.",
            "💫 SubhanAllah! The beauty of creation reminds us of the Creator's magnificence.",
            "🕋 May Allah guide us all on the straight path. Ameen.",
            "🌟 Islamic values of compassion, justice, and community guide everything I do."
        ],
        searchTerms: [
            'islamic architecture mosque',
            'muslim community prayer',
            'halal food cooking',
            'islamic calligraphy art',
            'muslim family values',
            'islamic education learning',
            'charity community service',
            'peaceful islamic lifestyle'
        ]
    };
};

// Fetch relevant image from Unsplash
const fetchRelevantImage = async (searchTerm, retries = 3) => {
    try {
        const response = await axios.get(`${UNSPLASH_API}/photos/random`, {
            params: {
                query: searchTerm,
                orientation: 'landscape',
                content_filter: 'high'
            },
            headers: {
                'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
            }
        });
        
        if (response.data && response.data.urls) {
            return {
                url: response.data.urls.regular,
                photographer: response.data.user.name,
                photographerUrl: response.data.user.links.html,
                unsplashUrl: response.data.links.html,
                description: response.data.description || response.data.alt_description || ''
            };
        }
        
        throw new Error('No image data received');
        
    } catch (error) {
        console.log(`⚠️ Error fetching image for "${searchTerm}": ${error.message}`);
        
        if (retries > 0) {
            console.log(`🔄 Retrying... (${retries} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            return fetchRelevantImage(searchTerm, retries - 1);
        }
        
        // Fallback images by category
        const fallbackImages = {
            'tech': 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800',
            'photography': 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800',
            'artist': 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800',
            'travel': 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800',
            'lifestyle': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
            'nature': 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800'
        };
        
        return {
            url: fallbackImages['nature'], // Default fallback
            photographer: 'Unsplash',
            photographerUrl: 'https://unsplash.com',
            unsplashUrl: 'https://unsplash.com',
            description: 'Beautiful nature scene'
        };
    }
};

// Generate hashtags based on content and bot type
const generateHashtags = (botType, interests, caption) => {
    const hashtagMap = {
        tech: ['#technology', '#innovation', '#coding', '#AI', '#startup', '#developer', '#future', '#digital'],
        photographer: ['#photography', '#photooftheday', '#capture', '#moment', '#art', '#visual', '#creative', '#lens'],
        artist: ['#art', '#creative', '#design', '#inspiration', '#artistic', '#creativity', '#artwork', '#expression'],
        traveler: ['#travel', '#adventure', '#explore', '#wanderlust', '#journey', '#discover', '#world', '#nomad'],
        lifestyle: ['#lifestyle', '#wellness', '#mindful', '#balance', '#selfcare', '#healthy', '#motivation', '#life'],
        nature: ['#nature', '#wildlife', '#conservation', '#earth', '#natural', '#environment', '#peaceful', '#outdoors']
    };
    
    const baseHashtags = hashtagMap[botType] || ['#inspiration', '#life', '#beautiful'];
    const selectedHashtags = baseHashtags.slice(0, Math.floor(Math.random() * 3) + 3); // 3-5 hashtags
    
    // Add interest-based hashtags
    interests.forEach(interest => {
        const hashtag = `#${interest.replace(/\s+/g, '').toLowerCase()}`;
        if (selectedHashtags.length < 8 && !selectedHashtags.includes(hashtag)) {
            selectedHashtags.push(hashtag);
        }
    });
    
    return selectedHashtags.join(' ');
};

async function createRealisticBotPosts() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');
        console.log('📝 Creating realistic posts for bot accounts...\n');

        // Get all realistic bot accounts
        const botAccounts = await User.find({ 
            isBot: true,
            username: { $regex: /^[a-z]+_[a-z]+_\d+$/ } // Match realistic bot username pattern
        }).limit(30);

        if (botAccounts.length === 0) {
            console.log('⚠️ No realistic bot accounts found. Run create-realistic-bot-accounts.js first.');
            return;
        }

        console.log(`🤖 Found ${botAccounts.length} realistic bot accounts`);
        
        const contentTemplates = generateContentTemplates();
        const islamicContent = generateIslamicContent();
        
        let successCount = 0;
        let errorCount = 0;

        for (const bot of botAccounts) {
            try {
                // Determine number of posts for this bot (1-3 posts)
                const numPosts = Math.floor(Math.random() * 3) + 1;
                
                console.log(`\n📝 Creating ${numPosts} post(s) for ${bot.displayName} (@${bot.username})`);
                
                for (let i = 0; i < numPosts; i++) {
                    // Get content template based on bot type
                    let templates = contentTemplates[bot.botType] || contentTemplates.lifestyle;
                    let searchTerms = templates.searchTerms;
                    let captions = templates.captions;
                    
                    // Special handling for Islamic/Muslim bots
                    if (bot.interests && (
                        bot.interests.includes('islamic studies') || 
                        bot.interests.includes('community leadership') ||
                        bot.interests.includes('halal business') ||
                        bot.bio.toLowerCase().includes('muslim') ||
                        bot.bio.toLowerCase().includes('islamic') ||
                        bot.bio.toLowerCase().includes('halal')
                    )) {
                        // Mix Islamic content with professional content
                        if (Math.random() < 0.4) { // 40% chance for Islamic content
                            captions = [...captions, ...islamicContent.captions];
                            searchTerms = [...searchTerms, ...islamicContent.searchTerms];
                        }
                    }
                    
                    // Select random caption and search term
                    const caption = captions[Math.floor(Math.random() * captions.length)];
                    const searchTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];
                    
                    console.log(`   📸 Fetching image for: "${searchTerm}"`);
                    
                    // Fetch relevant image
                    const imageData = await fetchRelevantImage(searchTerm);
                    
                    // Generate hashtags
                    const hashtags = generateHashtags(bot.botType, bot.interests || [], caption);
                    
                    // Create full post content
                    const fullContent = `${caption}\n\n${hashtags}`;
                    
                    // Create post
                    const post = new Post({
                        userId: bot._id,
                        content: fullContent,
                        images: [imageData.url],
                        visibility: 'public',
                        isBot: true,
                        botMetadata: {
                            generated_by: 'realistic_bot_script',
                            bot_type: bot.botType,
                            search_term: searchTerm,
                            image_credit: {
                                photographer: imageData.photographer,
                                source: 'Unsplash',
                                url: imageData.unsplashUrl
                            }
                        },
                        likeCount: Math.floor(Math.random() * 50) + 5, // 5-55 likes
                        commentCount: Math.floor(Math.random() * 10) + 1, // 1-11 comments
                        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random time within last week
                        updatedAt: new Date()
                    });
                    
                    await post.save();
                    
                    // Update bot's post count
                    await User.findByIdAndUpdate(bot._id, { 
                        $inc: { postCount: 1 } 
                    });
                    
                    console.log(`   ✅ Created post: "${caption.substring(0, 50)}..."`);
                    console.log(`   📸 Image by: ${imageData.photographer}`);
                    
                    successCount++;
                    
                    // Small delay to respect Unsplash rate limits
                    await new Promise(resolve => setTimeout(resolve, 800));
                }
                
            } catch (error) {
                console.error(`❌ Error creating posts for ${bot.displayName}:`, error.message);
                errorCount++;
            }
        }

        console.log('\n🎉 Realistic bot posts creation completed!');
        console.log(`📊 Statistics:`);
        console.log(`   ✅ Successfully created: ${successCount} posts`);
        console.log(`   ❌ Errors: ${errorCount} posts`);
        console.log(`   🤖 Bots with posts: ${botAccounts.length} accounts`);
        console.log(`   📸 All images from Unsplash with proper attribution`);
        console.log(`   🌍 Diverse content: Tech, Art, Travel, Lifestyle, Nature, Islamic themes`);
        
    } catch (error) {
        console.error('❌ Error creating realistic bot posts:', error);
    } finally {
        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB');
    }
}

// Run the script
if (require.main === module) {
    createRealisticBotPosts();
}

module.exports = { createRealisticBotPosts };
