/**
 * Script to create realistic bot accounts with diverse human photos from Unsplash
 * Run: node scripts/create-realistic-bot-accounts.js
 */

const mongoose = require('mongoose');
const User = require('../models/User');
const axios = require('axios');
require('dotenv').config();

// Unsplash API configuration
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
const UNSPLASH_API = 'https://api.unsplash.com';

// Diverse realistic profiles with cultural diversity
const generateRealisticProfiles = () => {
    const profiles = [
        // Tech Professionals
        {
            firstName: 'Sarah', lastName: 'Chen', 
            bio: '💻 Software Engineer at Google | Building the future with code',
            interests: ['technology', 'coding', 'innovation'],
            searchTerm: 'asian woman professional tech'
        },
        {
            firstName: 'Ahmed', lastName: 'Hassan',
            bio: '🚀 AI Researcher | Passionate about machine learning and ethics',
            interests: ['artificial intelligence', 'research', 'ethics'],
            searchTerm: 'middle eastern man professional'
        },
        {
            firstName: 'Maria', lastName: 'Rodriguez',
            bio: '📱 Mobile App Developer | Creating apps that change lives',
            interests: ['mobile development', 'UX design', 'startups'],
            searchTerm: 'latina woman developer'
        },
        
        // Creative Professionals
        {
            firstName: 'Aisha', lastName: 'Ibrahim',
            bio: '🎨 Digital Artist & Designer | Bringing imagination to life',
            interests: ['digital art', 'design', 'creativity'],
            searchTerm: 'african woman artist creative'
        },
        {
            firstName: 'James', lastName: 'Thompson',
            bio: '📸 Professional Photographer | Capturing moments that matter',
            interests: ['photography', 'visual storytelling', 'travel'],
            searchTerm: 'black man photographer'
        },
        {
            firstName: 'Priya', lastName: 'Sharma',
            bio: '✨ Graphic Designer | Visual storyteller with a passion for beauty',
            interests: ['graphic design', 'branding', 'visual arts'],
            searchTerm: 'indian woman designer'
        },
        
        // Travel & Lifestyle
        {
            firstName: 'Omar', lastName: 'Al-Rashid',
            bio: '✈️ Travel Blogger | Exploring the world one adventure at a time',
            interests: ['travel', 'culture', 'adventure'],
            searchTerm: 'arab man travel blogger'
        },
        {
            firstName: 'Elena', lastName: 'Petrov',
            bio: '🌍 Digital Nomad | Working remotely from beautiful places',
            interests: ['remote work', 'travel', 'lifestyle'],
            searchTerm: 'eastern european woman nomad'
        },
        {
            firstName: 'Fatima', lastName: 'Zahra',
            bio: '🧕 Lifestyle Coach | Empowering women to live their best lives',
            interests: ['lifestyle', 'wellness', 'empowerment'],
            searchTerm: 'muslim woman hijab lifestyle'
        },
        
        // Health & Wellness
        {
            firstName: 'David', lastName: 'Kim',
            bio: '🏃‍♂️ Fitness Coach | Helping people achieve their health goals',
            interests: ['fitness', 'health', 'motivation'],
            searchTerm: 'korean man fitness trainer'
        },
        {
            firstName: 'Zara', lastName: 'Ahmed',
            bio: '🧘‍♀️ Yoga Instructor | Finding peace through mindful movement',
            interests: ['yoga', 'mindfulness', 'wellness'],
            searchTerm: 'south asian woman yoga'
        },
        {
            firstName: 'Marcus', lastName: 'Johnson',
            bio: '💪 Personal Trainer | Transforming lives through fitness',
            interests: ['personal training', 'bodybuilding', 'nutrition'],
            searchTerm: 'african american man gym trainer'
        },
        
        // Business & Entrepreneurship
        {
            firstName: 'Leila', lastName: 'Mansouri',
            bio: '👩‍💼 Entrepreneur | Building sustainable businesses for the future',
            interests: ['entrepreneurship', 'sustainability', 'innovation'],
            searchTerm: 'persian woman business professional'
        },
        {
            firstName: 'Carlos', lastName: 'Silva',
            bio: '📈 Marketing Strategist | Helping brands tell their stories',
            interests: ['marketing', 'branding', 'storytelling'],
            searchTerm: 'latino man marketing professional'
        },
        {
            firstName: 'Amina', lastName: 'Kone',
            bio: '💼 Business Consultant | Empowering African startups to scale',
            interests: ['consulting', 'startups', 'africa'],
            searchTerm: 'west african woman business'
        },
        
        // Education & Science
        {
            firstName: 'Hiroshi', lastName: 'Tanaka',
            bio: '🔬 Research Scientist | Advancing renewable energy solutions',
            interests: ['renewable energy', 'research', 'sustainability'],
            searchTerm: 'japanese man scientist researcher'
        },
        {
            firstName: 'Nadia', lastName: 'Volkov',
            bio: '📚 University Professor | Inspiring the next generation of leaders',
            interests: ['education', 'leadership', 'academia'],
            searchTerm: 'russian woman professor academic'
        },
        {
            firstName: 'Kwame', lastName: 'Asante',
            bio: '🎓 Educational Technology Specialist | Democratizing learning',
            interests: ['education technology', 'learning', 'innovation'],
            searchTerm: 'ghanaian man educator'
        },
        
        // Food & Culture
        {
            firstName: 'Yasmin', lastName: 'Al-Zahra',
            bio: '🍽️ Food Blogger | Sharing authentic Middle Eastern cuisine',
            interests: ['cooking', 'food culture', 'tradition'],
            searchTerm: 'arab woman chef cooking'
        },
        {
            firstName: 'Giovanni', lastName: 'Romano',
            bio: '👨‍🍳 Chef & Culinary Artist | Bringing Italian traditions to life',
            interests: ['culinary arts', 'italian cuisine', 'tradition'],
            searchTerm: 'italian man chef'
        },
        {
            firstName: 'Mei', lastName: 'Wong',
            bio: '🥢 Food Photographer | Capturing the beauty of Asian cuisine',
            interests: ['food photography', 'asian culture', 'culinary arts'],
            searchTerm: 'chinese woman food photographer'
        },
        
        // Arts & Entertainment
        {
            firstName: 'Aaliyah', lastName: 'Brown',
            bio: '🎭 Theater Director | Bringing diverse stories to the stage',
            interests: ['theater', 'storytelling', 'diversity'],
            searchTerm: 'african american woman theater director'
        },
        {
            firstName: 'Raj', lastName: 'Patel',
            bio: '🎬 Film Producer | Creating content that bridges cultures',
            interests: ['filmmaking', 'cultural exchange', 'storytelling'],
            searchTerm: 'indian man film producer'
        },
        {
            firstName: 'Isabella', lastName: 'Santos',
            bio: '🎵 Music Producer | Blending traditional and modern sounds',
            interests: ['music production', 'cultural fusion', 'creativity'],
            searchTerm: 'brazilian woman music producer'
        },
        
        // Social Impact
        {
            firstName: 'Khadija', lastName: 'Osman',
            bio: '🌟 Social Activist | Fighting for equality and justice',
            interests: ['social justice', 'activism', 'community'],
            searchTerm: 'somali woman activist'
        },
        {
            firstName: 'Miguel', lastName: 'Hernandez',
            bio: '🤝 Community Organizer | Building stronger neighborhoods',
            interests: ['community organizing', 'social change', 'advocacy'],
            searchTerm: 'mexican man community leader'
        },
        
        // Additional Islamic/Muslim representation
        {
            firstName: 'Yusuf', lastName: 'Abdullah',
            bio: '📖 Islamic Scholar & Writer | Sharing wisdom and knowledge',
            interests: ['islamic studies', 'writing', 'education'],
            searchTerm: 'muslim man scholar beard'
        },
        {
            firstName: 'Halima', lastName: 'Said',
            bio: '🕌 Community Leader | Empowering Muslim women worldwide',
            interests: ['community leadership', 'women empowerment', 'faith'],
            searchTerm: 'muslim woman hijab community leader'
        },
        {
            firstName: 'Ibrahim', lastName: 'Khan',
            bio: '💼 Halal Business Consultant | Ethical business practices',
            interests: ['halal business', 'ethics', 'entrepreneurship'],
            searchTerm: 'pakistani man business islamic'
        },
        {
            firstName: 'Maryam', lastName: 'Nasir',
            bio: '👩‍⚕️ Doctor & Health Advocate | Serving communities with compassion',
            interests: ['healthcare', 'community service', 'medicine'],
            searchTerm: 'muslim woman doctor hijab'
        },
        {
            firstName: 'Hassan', lastName: 'Mohamed',
            bio: '🏗️ Architect | Designing spaces that honor Islamic heritage',
            interests: ['islamic architecture', 'design', 'heritage'],
            searchTerm: 'sudanese man architect'
        }
    ];
    
    return profiles.map((profile, index) => {
        const username = `${profile.firstName.toLowerCase()}_${profile.lastName.toLowerCase()}_${String(index + 1).padStart(2, '0')}`;
        const email = `${username}@hooksdream.ai`;
        
        // Map interests to valid botType enum values
        const mapToBotType = (interests) => {
            const mapping = {
                'technology': 'tech',
                'artificial intelligence': 'tech', 
                'mobile development': 'tech',
                'digital art': 'artist',
                'photography': 'photographer',
                'graphic design': 'artist',
                'travel': 'traveler',
                'remote work': 'lifestyle',
                'lifestyle': 'lifestyle',
                'fitness': 'lifestyle',
                'yoga': 'lifestyle',
                'personal training': 'lifestyle',
                'entrepreneurship': 'tech',
                'marketing': 'tech',
                'consulting': 'tech',
                'renewable energy': 'tech',
                'education': 'lifestyle',
                'education technology': 'tech',
                'cooking': 'lifestyle',
                'food culture': 'lifestyle',
                'culinary arts': 'lifestyle',
                'theater': 'artist',
                'filmmaking': 'artist',
                'music production': 'artist',
                'social justice': 'lifestyle',
                'community organizing': 'lifestyle',
                'islamic studies': 'lifestyle',
                'community leadership': 'lifestyle',
                'halal business': 'tech',
                'healthcare': 'lifestyle',
                'islamic architecture': 'artist'
            };
            
            for (const interest of interests) {
                if (mapping[interest]) {
                    return mapping[interest];
                }
            }
            return 'lifestyle'; // Default fallback
        };

        return {
            ...profile,
            username,
            email,
            displayName: `${profile.firstName} ${profile.lastName}`,
            botType: mapToBotType(profile.interests),
            personality: {
                activityLevel: Math.random() * 0.4 + 0.4, // 0.4-0.8
                socialness: Math.random() * 0.5 + 0.3,    // 0.3-0.8
                creativity: Math.random() * 0.6 + 0.4,    // 0.4-1.0
                engagement: Math.random() * 0.4 + 0.5     // 0.5-0.9
            },
            schedule: {
                preferredHours: generateSmartSchedule(profile.interests[0]),
                interactionRate: Math.random() * 0.3 + 0.2 // 0.2-0.5
            }
        };
    });
};

// Smart scheduling based on profile type
const generateSmartSchedule = (primaryInterest) => {
    const schedules = {
        'technology': [8, 9, 10, 14, 15, 16, 22],        // Work hours + evening
        'artificial intelligence': [9, 10, 15, 16, 21, 22], // Research hours
        'digital art': [10, 11, 14, 15, 20, 21, 22],     // Creative hours
        'photography': [6, 7, 8, 17, 18, 19, 20],        // Golden hours
        'travel': [9, 10, 11, 15, 16, 17, 21],           // Planning times
        'fitness': [6, 7, 8, 18, 19, 20],                // Workout times
        'yoga': [6, 7, 18, 19, 20],                      // Practice times
        'entrepreneurship': [8, 9, 10, 14, 15, 21],      // Business hours
        'education': [9, 10, 11, 14, 15, 16],            // Academic hours
        'cooking': [11, 12, 17, 18, 19],                 // Meal times
        'music production': [14, 15, 20, 21, 22, 23],    // Creative evening
        'social justice': [9, 10, 15, 16, 20, 21],       // Advocacy hours
        'islamic studies': [5, 6, 12, 13, 18, 19, 21],   // Prayer times + study
        'healthcare': [7, 8, 9, 15, 16, 17]              // Medical hours
    };
    return schedules[primaryInterest] || [9, 12, 15, 18, 21];
};

// Fetch realistic photo from Unsplash
const fetchRealisticPhoto = async (searchTerm, retries = 3) => {
    try {
        const response = await axios.get(`${UNSPLASH_API}/photos/random`, {
            params: {
                query: searchTerm,
                orientation: 'portrait',
                content_filter: 'high'
            },
            headers: {
                'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
            }
        });
        
        if (response.data && response.data.urls) {
            return {
                avatar: response.data.urls.regular,
                coverImage: response.data.urls.full,
                photoCredit: {
                    photographer: response.data.user.name,
                    photographerUrl: response.data.user.links.html,
                    unsplashUrl: response.data.links.html
                }
            };
        }
        
        throw new Error('No photo data received');
        
    } catch (error) {
        console.log(`⚠️ Error fetching photo for "${searchTerm}": ${error.message}`);
        
        if (retries > 0) {
            console.log(`🔄 Retrying... (${retries} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
            return fetchRealisticPhoto(searchTerm, retries - 1);
        }
        
        // Fallback to default diverse avatars
        const fallbackAvatars = [
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
            'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face',
            'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
            'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop&crop=face'
        ];
        
        return {
            avatar: fallbackAvatars[Math.floor(Math.random() * fallbackAvatars.length)],
            coverImage: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&h=400&fit=crop',
            photoCredit: null
        };
    }
};

const realisticProfiles = generateRealisticProfiles();

async function createRealisticBotAccounts() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');
        console.log('🎭 Creating realistic bot accounts with diverse photos...\n');

        let successCount = 0;
        let skipCount = 0;

        for (const [index, profileData] of realisticProfiles.entries()) {
            try {
                // Check if bot account already exists
                const existingBot = await User.findOne({ 
                    $or: [
                        { username: profileData.username },
                        { email: profileData.email }
                    ]
                });

                if (existingBot) {
                    console.log(`⚠️ Bot account ${profileData.username} already exists`);
                    skipCount++;
                    continue;
                }

                // Fetch realistic photo from Unsplash
                console.log(`📸 Fetching photo for ${profileData.displayName} (${profileData.searchTerm})...`);
                const photoData = await fetchRealisticPhoto(profileData.searchTerm);
                
                // Add small delay to respect Unsplash rate limits
                await new Promise(resolve => setTimeout(resolve, 500));

                // Create new realistic bot account
                const botUser = new User({
                    _id: `realistic_bot_${profileData.username}_${Date.now()}`,
                    googleId: `realistic_google_${profileData.username}_${Date.now()}`,
                    username: profileData.username,
                    email: profileData.email,
                    displayName: profileData.displayName,
                    bio: profileData.bio,
                    avatar: photoData.avatar,
                    coverImage: photoData.coverImage,
                    botType: profileData.botType,
                    personality: profileData.personality,
                    schedule: profileData.schedule,
                    interests: profileData.interests,
                    photoCredit: photoData.photoCredit,
                    isBot: true,
                    isVerified: true,
                    isSetupComplete: true,
                    followerCount: Math.floor(Math.random() * 2000) + 500,  // 500-2500 followers
                    followingCount: Math.floor(Math.random() * 800) + 200,  // 200-1000 following
                    postCount: Math.floor(Math.random() * 50) + 10,         // 10-60 posts
                    createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000), // Random date within last year
                    updatedAt: new Date()
                });

                await botUser.save();
                successCount++;
                
                console.log(`✅ Created realistic bot: ${profileData.displayName} (@${profileData.username})`);
                console.log(`   📸 Photo: ${photoData.photoCredit ? `by ${photoData.photoCredit.photographer}` : 'fallback'}`);
                console.log(`   🎯 Interests: ${profileData.interests.join(', ')}`);
                console.log(`   ⏰ Active hours: ${profileData.schedule.preferredHours.join(', ')}\n`);
                
            } catch (error) {
                console.error(`❌ Error creating bot ${profileData.displayName}:`, error.message);
            }
        }

        console.log('\n🎉 Realistic bot account creation completed!');
        console.log(`📊 Statistics:`);
        console.log(`   ✅ Successfully created: ${successCount} accounts`);
        console.log(`   ⚠️ Skipped (already exist): ${skipCount} accounts`);
        console.log(`   📸 Total with real photos: ${successCount} accounts`);
        console.log(`   🌍 Cultural diversity: Middle Eastern, Asian, African, Latino, European, Islamic representation`);
        
    } catch (error) {
        console.error('❌ Error creating realistic bot accounts:', error);
    } finally {
        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB');
    }
}

// Run the script
if (require.main === module) {
    createRealisticBotAccounts();
}

module.exports = { realisticProfiles, createRealisticBotAccounts };
