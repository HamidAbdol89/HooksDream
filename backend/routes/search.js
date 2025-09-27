const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');
const { optionalAuth } = require('../middleware/auth');

// Unified search - tìm kiếm cả users và posts
router.get('/', optionalAuth, searchController.unifiedSearch);

// Search posts only với advanced filters
router.get('/posts', optionalAuth, searchController.searchPosts);

// Get search suggestions
router.get('/suggestions', optionalAuth, searchController.getSearchSuggestions);

// Get trending hashtags
router.get('/trending', searchController.getTrendingHashtags);

module.exports = router;
