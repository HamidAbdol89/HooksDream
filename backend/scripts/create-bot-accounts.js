/**
 * Script to create dedicated bot accounts for automated posting
 * Run: node scripts/create-bot-accounts.js
 */

const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

// Generate 50 diverse bot accounts
const generateBotAccounts = () => {
    const botTypes = ['photographer', 'traveler', 'tech', 'lifestyle', 'nature', 'artist'];
    const personalities = {
        photographer: {
            names: ['Lens Master', 'Photo Wizard', 'Capture Pro', 'Frame Artist', 'Light Hunter', 'Pixel Perfect', 'Shutter Speed', 'Focus Point'],
            bios: [
                '📸 Professional AI photographer | Capturing life\'s beautiful moments',
                '🎯 Focus on perfection | AI-powered photography content',
                '✨ Light and shadow artist | Creating visual stories daily',
                '📷 Digital eye for beauty | Curated photography collection',
                '🌟 Moment curator | AI-driven visual storytelling',
                '🎨 Visual poet | Transforming scenes into art',
                '📸 Frame by frame perfection | AI photography specialist',
                '🔍 Detail obsessed | Professional photography AI'
            ]
        },
        traveler: {
            names: ['Globe Walker', 'Journey AI', 'Wanderlust Bot', 'Explorer Pro', 'Travel Guide', 'Adventure Seeker', 'World Rover', 'Nomad AI'],
            bios: [
                '✈️ AI Travel Expert | Discovering hidden gems worldwide',
                '🌍 Global explorer | Sharing amazing destinations daily',
                '🗺️ Adventure curator | AI-powered travel inspiration',
                '🎒 Digital nomad | Exploring the world through AI eyes',
                '🌟 Destination specialist | Travel content creator',
                '🚀 Journey architect | Planning perfect adventures',
                '🏔️ Adventure AI | Mountain to ocean explorer',
                '🌅 Sunrise chaser | Capturing travel moments'
            ]
        },
        tech: {
            names: ['Code Master', 'Tech Guru', 'Innovation AI', 'Digital Pioneer', 'Future Bot', 'Cyber Sage', 'Tech Wizard', 'AI Innovator'],
            bios: [
                '💻 Tech innovation curator | Future-focused insights',
                '🚀 Digital transformation expert | AI technology trends',
                '⚡ Innovation catalyst | Cutting-edge tech content',
                '🔮 Future predictor | Technology advancement tracker',
                '💡 Tech visionary | Breakthrough discoveries daily',
                '🌐 Digital ecosystem explorer | Tech trend analyst',
                '🤖 AI advancement tracker | Technology evolution',
                '⚙️ System optimizer | Tech efficiency expert'
            ]
        },
        lifestyle: {
            names: ['Life Coach AI', 'Wellness Guide', 'Mindful Bot', 'Balance Keeper', 'Zen Master', 'Harmony AI', 'Bliss Curator', 'Peace Finder'],
            bios: [
                '🌸 Lifestyle inspiration | Daily wellness & positivity',
                '✨ Mindful living advocate | AI-curated life tips',
                '🧘 Balance and harmony | Wellness content creator',
                '💫 Positive vibes only | Lifestyle transformation guide',
                '🌺 Self-care specialist | Mental wellness advocate',
                '🌟 Life optimization | Happiness and health focus',
                '💖 Wellness warrior | Inspiring healthy lifestyles',
                '🌈 Joy curator | Spreading positivity daily'
            ]
        },
        nature: {
            names: ['Eco Guardian', 'Green AI', 'Earth Lover', 'Wild Curator', 'Forest Friend', 'Ocean Keeper', 'Sky Watcher', 'Nature Guide'],
            bios: [
                '🌿 Environmental advocate | Nature conservation through AI',
                '🌍 Earth protector | Sharing nature\'s beauty daily',
                '🦋 Wildlife enthusiast | Biodiversity awareness creator',
                '🌳 Forest guardian | Environmental education specialist',
                '🌊 Ocean lover | Marine life conservation advocate',
                '🌺 Flora specialist | Plant kingdom explorer',
                '🦅 Wildlife photographer | Nature documentary creator',
                '🍃 Eco-friendly lifestyle | Sustainable living guide'
            ]
        },
        artist: {
            names: ['Creative Soul', 'Art Visionary', 'Design Master', 'Color Wizard', 'Brush AI', 'Canvas Creator', 'Palette Pro', 'Art Curator'],
            bios: [
                '🎨 Digital artist | Creating beauty through AI creativity',
                '🖼️ Art curator | Masterpiece collection specialist',
                '✨ Creative inspiration | Artistic vision daily',
                '🎭 Visual storyteller | Art meets technology',
                '🌈 Color theorist | Palette perfection specialist',
                '🖌️ Brush stroke master | Traditional meets digital',
                '💫 Creative catalyst | Inspiring artistic minds',
                '🎪 Art experience creator | Gallery of wonders'
            ]
        }
    };

    const botAccounts = [];
    let accountIndex = 1;

    // Create 8-9 bots per type to reach 50 total
    botTypes.forEach((type, typeIndex) => {
        const count = typeIndex < 2 ? 9 : 8; // First 2 types get 9 bots, others get 8
        const typeData = personalities[type];
        
        for (let i = 0; i < count; i++) {
            const nameIndex = i % typeData.names.length;
            const bioIndex = i % typeData.bios.length;
            const username = `${type}_ai_${String(accountIndex).padStart(2, '0')}`;
            
            botAccounts.push({
                username: username,
                displayName: `${typeData.names[nameIndex]} ${accountIndex}`,
                email: `${username}@hooksdream.com`,
                bio: typeData.bios[bioIndex],
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}&backgroundColor=${getRandomColor()}`,
                isBot: true,
                botType: type,
                // Add personality traits for smart interactions
                personality: {
                    activityLevel: Math.random() * 0.5 + 0.3, // 0.3-0.8
                    socialness: Math.random() * 0.6 + 0.2,   // 0.2-0.8
                    creativity: Math.random() * 0.7 + 0.3,   // 0.3-1.0
                    engagement: Math.random() * 0.5 + 0.4    // 0.4-0.9
                },
                // Posting schedule preferences
                schedule: {
                    preferredHours: generatePreferredHours(type),
                    postsPerDay: Math.floor(Math.random() * 3) + 1, // 1-3 posts per day
                    interactionRate: Math.random() * 0.3 + 0.1      // 0.1-0.4 interaction rate
                }
            });
            
            accountIndex++;
        }
    });

    return botAccounts;
};

// Helper functions
const getRandomColor = () => {
    const colors = ['b6e3f4', 'c0aede', 'd1d4f9', 'ffd5dc', 'ffdfbf', 'e6f3ff', 'f0f8e6', 'fff0f5'];
    return colors[Math.floor(Math.random() * colors.length)];
};

const generatePreferredHours = (type) => {
    // Different bot types prefer different posting hours
    const schedules = {
        photographer: [6, 7, 8, 17, 18, 19, 20], // Golden hours
        traveler: [9, 10, 11, 15, 16, 17, 21],   // Travel planning times
        tech: [8, 9, 10, 14, 15, 16, 22],        // Work hours + evening
        lifestyle: [7, 8, 12, 13, 18, 19, 20],   // Meal times + evening
        nature: [5, 6, 7, 16, 17, 18, 19],       // Dawn and dusk
        artist: [10, 11, 14, 15, 20, 21, 22]     // Creative hours
    };
    return schedules[type] || [9, 12, 15, 18, 21];
};

const botAccounts = generateBotAccounts();

async function createBotAccounts() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        for (const botData of botAccounts) {
            // Check if bot account already exists
            const existingBot = await User.findOne({ 
                $or: [
                    { username: botData.username },
                    { email: botData.email }
                ]
            });

            if (existingBot) {
                console.log(`⚠️ Bot account ${botData.username} already exists`);
                continue;
            }

            // Create new bot account
            const botUser = new User({
                _id: `bot_${botData.username}_${Date.now()}`, // Required custom _id
                googleId: `bot_google_${botData.username}_${Date.now()}`, // Required googleId for bots
                ...botData,
                isBot: true, // Mark as bot account
                isVerified: true, // Mark as verified
                isSetupComplete: true, // Setup complete
                followerCount: Math.floor(Math.random() * 1000) + 100, // Random followers 100-1100
                followingCount: Math.floor(Math.random() * 200) + 50,   // Random following 50-250
                postCount: 0, // Will be updated as bot posts
                createdAt: new Date(),
                updatedAt: new Date()
            });

            await botUser.save();
            console.log(`✅ Created bot account: ${botData.displayName} (@${botData.username})`);
        }

        console.log('\n🎉 All bot accounts created successfully!');
        console.log(`📊 Total bot accounts: ${botAccounts.length}`);
        
    } catch (error) {
        console.error('❌ Error creating bot accounts:', error);
    } finally {
        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB');
    }
}

// Run the script
if (require.main === module) {
    createBotAccounts();
}

module.exports = { botAccounts, createBotAccounts };
