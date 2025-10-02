const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');
const { optionalAuth, authMiddleware } = require('../middleware/auth');

// Unified search - tìm kiếm cả users và posts
router.get('/', optionalAuth, searchController.unifiedSearch);

// Search posts only với advanced filters
router.get('/posts', optionalAuth, searchController.searchPosts);

// Get search suggestions
router.get('/suggestions', optionalAuth, searchController.getSearchSuggestions);

// Get trending hashtags
router.get('/trending', searchController.getTrendingHashtags);

// Get popular searches (public)
router.get('/popular', searchController.getPopularSearches);

// Search history routes (require authentication)
router.get('/history', authMiddleware, searchController.getSearchHistory);
router.delete('/history/:query', authMiddleware, searchController.deleteSearchHistoryItem);
router.delete('/history', authMiddleware, searchController.clearSearchHistory);

module.exports = router;
