/**
 * Bot Routes
 * API endpoints for Python bot integration
 */

const express = require('express');
const router = express.Router();
const { 
  createBotPost, 
  getBotStats, 
  deleteBotPost, 
  updateBotUser,
  getBotHealthDashboard
} = require('../controllers/botController');

// Create post from Python bot
router.post('/create-post', createBotPost);

// Get bot statistics and analytics
router.get('/stats', getBotStats);

// Delete bot post (admin/maintenance)
router.delete('/posts/:postId', deleteBotPost);

// Update bot user profile
router.put('/users/:username', updateBotUser);

// Get bot health dashboard
router.get('/health-dashboard', getBotHealthDashboard);

module.exports = router;
