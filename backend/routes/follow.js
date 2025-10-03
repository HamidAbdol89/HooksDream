const express = require('express');
const router = express.Router();
const followController = require('../controllers/followController');
const { authMiddleware } = require('../middleware/auth');

// Follow/Unfollow a user (toggle)
router.post('/:userId', authMiddleware, followController.followUser);

// Get followers of a user
router.get('/:userId/followers', authMiddleware, followController.getFollowers);

// Get following of a user
router.get('/:userId/following', authMiddleware, followController.getFollowing);

// Check if user is following another user
router.get('/:userId/status', authMiddleware, followController.checkFollowStatus);

module.exports = router;
