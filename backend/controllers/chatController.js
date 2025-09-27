const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const { createResponse } = require('../utils/helpers');

// Get all conversations for current user
exports.getConversations = async (req, res) => {
  try {
    const currentUserId = req.userId;
    const { page = 1, limit = 20 } = req.query;
    
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    
    const conversations = await Conversation.find({
      participants: currentUserId,
      isActive: true
    })
    .populate('participants', 'username displayName avatar')
    .populate('lastMessage')
    .sort({ lastActivity: -1 })
    .limit(limitNum)
    .skip((pageNum - 1) * limitNum)
    .lean();
    
    // Format conversations
    const formattedConversations = conversations.map(conv => {
      const otherParticipant = conv.participants.find(p => p._id.toString() !== currentUserId);
      
      return {
        _id: conv._id,
        type: conv.type,
        name: conv.type === 'group' ? conv.name : otherParticipant?.displayName,
        avatar: conv.type === 'group' ? conv.avatar : otherParticipant?.avatar,
        participants: conv.participants,
        lastMessage: conv.lastMessage,
        lastActivity: conv.lastActivity,
        unreadCount: 0 // TODO: Calculate unread count
      };
    });
    
    res.json(createResponse(true, 'Conversations retrieved successfully', formattedConversations));
    
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json(createResponse(false, 'Internal server error', null, null, 500));
  }
};

// Get or create direct conversation
exports.getOrCreateDirectConversation = async (req, res) => {
  try {
    const currentUserId = req.userId;
    const { userId } = req.params;
    
    if (userId === currentUserId) {
      return res.status(400).json(createResponse(false, 'Cannot create conversation with yourself', null, null, 400));
    }
    
    // Check if target user exists
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json(createResponse(false, 'User not found', null, null, 404));
    }
    
    // Find existing conversation
    let conversation = await Conversation.findDirectConversation(currentUserId, userId);
    
    if (!conversation) {
      // Create new conversation
      conversation = await Conversation.create({
        participants: [currentUserId, userId],
        type: 'direct',
        metadata: {
          createdBy: currentUserId
        }
      });
    }
    
    // Populate participants
    await conversation.populate('participants', 'username displayName avatar');
    
    const otherParticipant = conversation.participants.find(p => p._id.toString() !== currentUserId);
    
    const formattedConversation = {
      _id: conversation._id,
      type: conversation.type,
      name: otherParticipant?.displayName,
      avatar: otherParticipant?.avatar,
      participants: conversation.participants,
      lastMessage: conversation.lastMessage,
      lastActivity: conversation.lastActivity
    };
    
    res.json(createResponse(true, 'Conversation retrieved successfully', formattedConversation));
    
  } catch (error) {
    console.error('Get/create conversation error:', error);
    res.status(500).json(createResponse(false, 'Internal server error', null, null, 500));
  }
};

// Get messages in a conversation
exports.getMessages = async (req, res) => {
  try {
    const currentUserId = req.userId;
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    
    // Check if user is participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.isParticipant(currentUserId)) {
      return res.status(403).json(createResponse(false, 'Access denied', null, null, 403));
    }
    
    const messages = await Message.find({
      conversation: conversationId,
      isDeleted: false
    })
    .populate('sender', 'username displayName avatar')
    .populate('replyTo')
    .sort({ createdAt: -1 })
    .limit(limitNum)
    .skip((pageNum - 1) * limitNum)
    .lean();
    
    // Reverse to show oldest first
    messages.reverse();
    
    res.json(createResponse(true, 'Messages retrieved successfully', messages));
    
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json(createResponse(false, 'Internal server error', null, null, 500));
  }
};

// Send a message
exports.sendMessage = async (req, res) => {
  try {
    const currentUserId = req.userId;
    const { conversationId } = req.params;
    const { text, image, replyTo } = req.body;
    
    // Validate input
    if (!text && !image) {
      return res.status(400).json(createResponse(false, 'Message content is required', null, null, 400));
    }
    
    // Check if user is participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.isParticipant(currentUserId)) {
      return res.status(403).json(createResponse(false, 'Access denied', null, null, 403));
    }
    
    // Create message
    const messageData = {
      conversation: conversationId,
      sender: currentUserId,
      content: {},
      type: 'text'
    };
    
    if (text) {
      messageData.content.text = text;
    }
    
    if (image) {
      messageData.content.image = image;
      messageData.type = 'image';
    }
    
    if (replyTo) {
      messageData.replyTo = replyTo;
    }
    
    const message = await Message.create(messageData);
    
    // Populate sender info
    await message.populate('sender', 'username displayName avatar');
    
    // Emit socket event to conversation participants
    if (global.socketServer) {
      conversation.participants.forEach(participantId => {
        if (participantId.toString() !== currentUserId) {
          global.socketServer.emitToUser(participantId.toString(), 'message:new', {
            conversationId,
            message: message.toObject()
          });
        }
      });
    }
    
    res.json(createResponse(true, 'Message sent successfully', message));
    
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json(createResponse(false, 'Internal server error', null, null, 500));
  }
};

// Mark messages as read
exports.markAsRead = async (req, res) => {
  try {
    const currentUserId = req.userId;
    const { conversationId } = req.params;
    const { messageIds } = req.body;
    
    // Check if user is participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.isParticipant(currentUserId)) {
      return res.status(403).json(createResponse(false, 'Access denied', null, null, 403));
    }
    
    // Mark messages as read
    await Message.updateMany(
      {
        _id: { $in: messageIds },
        conversation: conversationId,
        'readBy.user': { $ne: currentUserId }
      },
      {
        $push: {
          readBy: {
            user: currentUserId,
            readAt: new Date()
          }
        }
      }
    );
    
    // Emit socket event
    if (global.socketServer) {
      conversation.participants.forEach(participantId => {
        if (participantId.toString() !== currentUserId) {
          global.socketServer.emitToUser(participantId.toString(), 'messages:read', {
            conversationId,
            readBy: currentUserId,
            messageIds
          });
        }
      });
    }
    
    res.json(createResponse(true, 'Messages marked as read'));
    
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json(createResponse(false, 'Internal server error', null, null, 500));
  }
};

// Delete a message
exports.deleteMessage = async (req, res) => {
  try {
    const currentUserId = req.userId;
    const { messageId } = req.params;
    
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json(createResponse(false, 'Message not found', null, null, 404));
    }
    
    // Check if user is sender
    if (message.sender.toString() !== currentUserId) {
      return res.status(403).json(createResponse(false, 'Access denied', null, null, 403));
    }
    
    // Soft delete
    message.isDeleted = true;
    message.deletedAt = new Date();
    message.deletedBy = currentUserId;
    await message.save();
    
    // Emit socket event
    if (global.socketServer) {
      const conversation = await Conversation.findById(message.conversation);
      conversation.participants.forEach(participantId => {
        global.socketServer.emitToUser(participantId.toString(), 'message:deleted', {
          conversationId: message.conversation,
          messageId: message._id
        });
      });
    }
    
    res.json(createResponse(true, 'Message deleted successfully'));
    
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json(createResponse(false, 'Internal server error', null, null, 500));
  }
};

// Add reaction to message
exports.addReaction = async (req, res) => {
  try {
    const currentUserId = req.userId;
    const { messageId } = req.params;
    const { emoji } = req.body;
    
    if (!emoji) {
      return res.status(400).json(createResponse(false, 'Emoji is required', null, null, 400));
    }
    
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json(createResponse(false, 'Message not found', null, null, 404));
    }
    
    await message.addReaction(currentUserId, emoji);
    
    // Emit socket event
    if (global.socketServer) {
      const conversation = await Conversation.findById(message.conversation);
      conversation.participants.forEach(participantId => {
        global.socketServer.emitToUser(participantId.toString(), 'message:reaction', {
          conversationId: message.conversation,
          messageId: message._id,
          reaction: { user: currentUserId, emoji }
        });
      });
    }
    
    res.json(createResponse(true, 'Reaction added successfully'));
    
  } catch (error) {
    console.error('Add reaction error:', error);
    res.status(500).json(createResponse(false, 'Internal server error', null, null, 500));
  }
};

module.exports = exports;
