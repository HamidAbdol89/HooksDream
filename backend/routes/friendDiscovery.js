// backend/routes/friendDiscovery.js - Enhanced Friend Discovery Routes
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const {
  getRecommendedUsers,
  getNearbyUsers,
  getNewUsers,
  getTrendingUsers
} = require('../controllers/friendDiscoveryController');

/**
 * Enhanced Friend Discovery Routes
 * Provides ML-like recommendation endpoints for social discovery
 */

// @route   GET /api/discovery/recommended
// @desc    Get ML-based recommended users
// @access  Private
router.get('/recommended', authMiddleware, getRecommendedUsers);

// @route   GET /api/discovery/nearby
// @desc    Get nearby users based on location
// @access  Private
router.get('/nearby', authMiddleware, getNearbyUsers);

// @route   GET /api/discovery/new
// @desc    Get recently joined users
// @access  Private
router.get('/new', authMiddleware, getNewUsers);

// @route   GET /api/discovery/trending
// @desc    Get trending users with high engagement
// @access  Private
router.get('/trending', authMiddleware, getTrendingUsers);

module.exports = router;
