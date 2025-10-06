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
  getBotHealthDashboard,
  createPremiumBotUser,
  uploadBotAvatar,
  deletePremiumBotUser,
  deleteAllBots,
  getPremiumBotStatus
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

// Premium bot management
router.post('/create-user', createPremiumBotUser);
router.post('/upload-avatar', uploadBotAvatar);
router.delete('/delete-user/:username', deletePremiumBotUser);
router.delete('/delete-all-bots', deleteAllBots);
router.get('/premium-status', getPremiumBotStatus);

module.exports = router;
