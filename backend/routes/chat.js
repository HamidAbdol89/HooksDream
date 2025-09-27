const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

// Import controllers
const chatController = require('../controllers/chatController');
const { authMiddleware } = require('../middleware/auth');

// Rate limiting cho chat
const chatLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 60, // 60 messages per minute
    message: { success: false, message: 'Too many messages, please slow down.' }
});

const conversationLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 20, // 20 conversation requests per 5 minutes
    message: { success: false, message: 'Too many conversation requests, please try again later.' }
});

// All chat routes require authentication
router.use(authMiddleware);

// Conversation routes
router.get('/conversations', conversationLimiter, chatController.getConversations);
router.get('/conversations/:conversationId', chatController.getConversation);
router.get('/conversations/direct/:userId', conversationLimiter, chatController.getOrCreateDirectConversation);

// Message routes
router.get('/conversations/:conversationId/messages', chatController.getMessages);
router.post('/conversations/:conversationId/messages', chatLimiter, chatController.sendMessage);
router.post('/conversations/:conversationId/messages/image', chatLimiter, chatController.sendImageMessage);
router.put('/conversations/:conversationId/read', chatController.markAsRead);

// Message actions
router.delete('/messages/:messageId', chatController.deleteMessage);
router.post('/messages/:messageId/reactions', chatController.addReaction);

// User status
router.get('/users/:userId/status', chatController.getUserStatus);

module.exports = router;
