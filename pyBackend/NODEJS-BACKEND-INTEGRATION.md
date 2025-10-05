# Node.js Backend Integration for Python Bot System

## Required API Endpoints

### 1. Get Random User for Bot Posting

**Endpoint:** `GET /api/users/random-for-bot`

**Purpose:** Get a random real user for bot to create posts as

**Response:**
```json
{
  "_id": "user_id_here",
  "username": "johndoe",
  "displayName": "John Doe",
  "email": "john@example.com",
  "avatar": "avatar_url",
  "isActive": true
}
```

**Implementation in Node.js:**
```javascript
// In your user routes file
router.get('/random-for-bot', async (req, res) => {
  try {
    // Get random active user from database
    const randomUser = await User.aggregate([
      { $match: { isActive: true } },
      { $sample: { size: 1 } }
    ]);
    
    if (randomUser.length === 0) {
      return res.status(404).json({ error: 'No users found' });
    }
    
    res.json(randomUser[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 2. Create Post with Bot Metadata

**Endpoint:** `POST /api/posts`

**Purpose:** Create post using existing posts endpoint but with bot metadata

**Request Body:**
```json
{
  "content": "AI generated caption with hashtags",
  "images": ["https://image1.jpg", "https://image2.jpg"],
  "userId": "real_user_id_here",
  "bot_metadata": {
    "generated_by": "python_bot",
    "topic": "nature",
    "post_type": "single_image",
    "photo_data": {}
  }
}
```

**Implementation:** Use existing POST /api/posts endpoint, just add bot_metadata to post document.

## Benefits of This Approach

✅ **Uses Real Users:** Posts created by actual users in database
✅ **No Fake Data:** No fake bot users cluttering database  
✅ **Authentic Feed:** Posts appear as normal user posts
✅ **Existing System:** Leverages existing post creation logic
✅ **Metadata Tracking:** Can track which posts are bot-generated

## Migration Steps

1. Add `/api/users/random-for-bot` endpoint to Node.js backend
2. Modify existing `/api/posts` endpoint to accept bot_metadata (optional field)
3. Deploy Node.js backend changes
4. Deploy Python bot with new integration
5. Test bot posting with real users

## Security Considerations

- Only select active, verified users for bot posting
- Add rate limiting to prevent spam
- Consider user consent for bot posting (optional)
- Track bot-generated content for analytics
