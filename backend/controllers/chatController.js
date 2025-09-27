const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const { createResponse } = require('../utils/helpers');
const { upload } = require('../utils/cloudinary');

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
    
    // Get all conversation IDs for bulk unread count query
    const conversationIds = conversations.map(conv => conv._id);
    
    // Professional aggregation để tính unread count chính xác
    const unreadCounts = await Message.aggregate([
      {
        $match: {
          conversation: { $in: conversationIds },
          isDeleted: false,
          sender: { $ne: currentUserId } // Chỉ tin nhắn từ người khác
        }
      },
      {
        $addFields: {
          isReadByCurrentUser: {
            $in: [currentUserId, '$readBy.user']
          }
        }
      },
      {
        $match: {
          isReadByCurrentUser: false // Chưa được current user đọc
        }
      },
      {
        $group: {
          _id: '$conversation',
          count: { $sum: 1 },
          lastUnreadMessage: { $last: '$$ROOT' }
        }
      }
    ]);
    
    // Create a map for quick lookup
    const unreadCountMap = {};
    unreadCounts.forEach(item => {
      unreadCountMap[item._id.toString()] = item.count;
    });
    
    // Format conversations with unread counts
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
        unreadCount: unreadCountMap[conv._id.toString()] || 0
      };
    });
    
    res.json(createResponse(true, 'Conversations retrieved successfully', formattedConversations));
    
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json(createResponse(false, 'Internal server error', null, null, 500));
  }
};

// Get single conversation
exports.getConversation = async (req, res) => {
  try {
    const currentUserId = req.userId;
    const { conversationId } = req.params;
    
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: currentUserId,
      isActive: true
    })
    .populate('participants', 'username displayName avatar')
    .populate('lastMessage')
    .lean();
    
    if (!conversation) {
      return res.status(404).json(createResponse(false, 'Conversation not found', null, null, 404));
    }
    
    res.json(createResponse(true, 'Conversation retrieved successfully', conversation));
    
  } catch (error) {
    console.error('Get conversation error:', error);
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
      conversation: conversationId
    })
    .populate('sender', 'username displayName avatar')
    .populate('replyTo')
    .sort({ createdAt: -1 })
    .limit(limitNum)
    .skip((pageNum - 1) * limitNum)
    .lean();

    // Add message status for each message
    const messagesWithStatus = messages.map(message => {
      // Handle recalled messages
      if (message.isDeleted) {
        return {
          ...message,
          content: {
            text: 'Tin nhắn đã được thu hồi',
            isRecalled: true
          },
          type: 'system',
          messageStatus: {
            status: 'recalled',
            timestamp: message.deletedAt || new Date().toISOString(),
            readBy: []
          }
        };
      }

      // Determine status based on readBy array
      let status = 'sent';
      if (message.readBy && message.readBy.length > 0) {
        // Check if current user has read it (for messages sent by others)
        if (message.sender._id.toString() !== currentUserId) {
          const currentUserRead = message.readBy.find(r => r.user.toString() === currentUserId);
          status = currentUserRead ? 'read' : 'delivered';
        } else {
          // For messages sent by current user, check if others have read
          const othersRead = message.readBy.some(r => r.user.toString() !== currentUserId);
          status = othersRead ? 'read' : 'delivered';
        }
      }

      return {
        ...message,
        messageStatus: {
          status,
          timestamp: new Date().toISOString(),
          readBy: message.readBy ? message.readBy.map(r => r.user.toString()) : []
        }
      };
    });
    
    // Reverse to show oldest first
    messagesWithStatus.reverse();
    
    res.json(createResponse(true, 'Messages retrieved successfully', messagesWithStatus));
    
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
    
    // Update conversation lastActivity and lastMessage
    await Conversation.findByIdAndUpdate(conversationId, {
      lastActivity: new Date(),
      lastMessage: message._id
    });
    
    // Populate sender info
    await message.populate('sender', 'username displayName avatar');
    
    // Add message status to response
    const messageWithStatus = {
      ...message.toObject(),
      messageStatus: {
        status: 'sent',
        timestamp: new Date().toISOString(),
        readBy: []
      }
    };
    
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
      
      // Also emit to all participants for conversations list updates
      conversation.participants.forEach(participantId => {
        global.socketServer.emitToUser(participantId.toString(), 'conversation:updated', {
          conversationId,
          lastMessage: message.toObject(),
          lastActivity: new Date()
        });
      });
    }
    
    res.json(createResponse(true, 'Message sent successfully', messageWithStatus));
    
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json(createResponse(false, 'Internal server error', null, null, 500));
  }
};

// Send image message
exports.sendImageMessage = (req, res) => {
  const imageUpload = upload.single('image');
  
  imageUpload(req, res, async (err) => {
    try {
      if (err) {
        return res.status(400).json(createResponse(false, `Upload failed: ${err.message}`, null, null, 400));
      }
      
      if (!req.file) {
        return res.status(400).json(createResponse(false, 'No image uploaded', null, null, 400));
      }
      
      const currentUserId = req.userId;
      const { conversationId } = req.params;
      const { text } = req.body; // Optional text with image
      
      // Check if user is participant
      const conversation = await Conversation.findById(conversationId);
      if (!conversation || !conversation.isParticipant(currentUserId)) {
        return res.status(403).json(createResponse(false, 'Access denied', null, null, 403));
      }
      
      // Create image message
      const messageData = {
        conversation: conversationId,
        sender: currentUserId,
        content: {
          image: req.file.path
        },
        type: 'image'
      };
      
      // Add text if provided
      if (text && text.trim()) {
        messageData.content.text = text.trim();
      }
      
      const message = await Message.create(messageData);
      
      // Update conversation lastActivity and lastMessage
      await Conversation.findByIdAndUpdate(conversationId, {
        lastActivity: new Date(),
        lastMessage: message._id
      });
      
      // Populate sender info
      await message.populate('sender', 'username displayName avatar');
      
      // Add message status to response
      const messageWithStatus = {
        ...message.toObject(),
        messageStatus: {
          status: 'sent',
          timestamp: new Date().toISOString(),
          readBy: []
        }
      };
      
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
        
        // Also emit to all participants for conversations list updates
        conversation.participants.forEach(participantId => {
          global.socketServer.emitToUser(participantId.toString(), 'conversation:updated', {
            conversationId,
            lastMessage: message.toObject(),
            lastActivity: new Date()
          });
        });
      }
      
      res.json(createResponse(true, 'Image message sent successfully', messageWithStatus));
      
    } catch (error) {
      console.error('Send image message error:', error);
      res.status(500).json(createResponse(false, 'Internal server error', null, null, 500));
    }
  });
};

// Send video message
exports.sendVideoMessage = (req, res) => {
  const videoUpload = upload.single('video');
  
  videoUpload(req, res, async (err) => {
    try {
      if (err) {
        return res.status(400).json(createResponse(false, `Upload failed: ${err.message}`, null, null, 400));
      }
      
      if (!req.file) {
        return res.status(400).json(createResponse(false, 'No video uploaded', null, null, 400));
      }
      
      const currentUserId = req.userId;
      const { conversationId } = req.params;
      const { text, duration, thumbnail } = req.body;
      
      // Check if user is participant
      const conversation = await Conversation.findById(conversationId);
      if (!conversation || !conversation.isParticipant(currentUserId)) {
        return res.status(403).json(createResponse(false, 'Access denied', null, null, 403));
      }
      
      // Create video message
      const messageData = {
        conversation: conversationId,
        sender: currentUserId,
        content: {
          video: {
            url: req.file.path,
            duration: duration ? parseFloat(duration) : undefined,
            thumbnail: thumbnail || undefined
          }
        },
        type: 'video'
      };
      
      // Add text if provided
      if (text && text.trim()) {
        messageData.content.text = text.trim();
      }
      
      const message = await Message.create(messageData);
      
      // Update conversation
      await Conversation.findByIdAndUpdate(conversationId, {
        lastActivity: new Date(),
        lastMessage: message._id
      });
      
      // Populate sender info
      await message.populate('sender', 'username displayName avatar');
      
      const messageWithStatus = {
        ...message.toObject(),
        messageStatus: {
          status: 'sent',
          timestamp: new Date().toISOString(),
          readBy: []
        }
      };
      
      // Emit socket event
      if (global.socketServer) {
        conversation.participants.forEach(participantId => {
          if (participantId.toString() !== currentUserId) {
            global.socketServer.emitToUser(participantId.toString(), 'message:new', {
              conversationId,
              message: message.toObject()
            });
          }
        });
        
        conversation.participants.forEach(participantId => {
          global.socketServer.emitToUser(participantId.toString(), 'conversation:updated', {
            conversationId,
            lastMessage: message.toObject(),
            lastActivity: new Date()
          });
        });
      }
      
      res.json(createResponse(true, 'Video message sent successfully', messageWithStatus));
      
    } catch (error) {
      console.error('Send video message error:', error);
      res.status(500).json(createResponse(false, 'Internal server error', null, null, 500));
    }
  });
};

// Send audio message
exports.sendAudioMessage = (req, res) => {
  const audioUpload = upload.single('audio');
  
  audioUpload(req, res, async (err) => {
    try {
      if (err) {
        return res.status(400).json(createResponse(false, `Upload failed: ${err.message}`, null, null, 400));
      }
      
      if (!req.file) {
        return res.status(400).json(createResponse(false, 'No audio uploaded', null, null, 400));
      }
      
      const currentUserId = req.userId;
      const { conversationId } = req.params;
      const { duration, waveform } = req.body;
      
      // Check if user is participant
      const conversation = await Conversation.findById(conversationId);
      if (!conversation || !conversation.isParticipant(currentUserId)) {
        return res.status(403).json(createResponse(false, 'Access denied', null, null, 403));
      }
      
      // Create audio message
      const messageData = {
        conversation: conversationId,
        sender: currentUserId,
        content: {
          audio: {
            url: req.file.path,
            duration: duration ? parseFloat(duration) : undefined,
            waveform: waveform ? JSON.parse(waveform) : undefined
          }
        },
        type: 'audio'
      };
      
      const message = await Message.create(messageData);
      
      // Update conversation
      await Conversation.findByIdAndUpdate(conversationId, {
        lastActivity: new Date(),
        lastMessage: message._id
      });
      
      // Populate sender info
      await message.populate('sender', 'username displayName avatar');
      
      const messageWithStatus = {
        ...message.toObject(),
        messageStatus: {
          status: 'sent',
          timestamp: new Date().toISOString(),
          readBy: []
        }
      };
      
      // Emit socket event
      if (global.socketServer) {
        conversation.participants.forEach(participantId => {
          if (participantId.toString() !== currentUserId) {
            global.socketServer.emitToUser(participantId.toString(), 'message:new', {
              conversationId,
              message: message.toObject()
            });
          }
        });
        
        conversation.participants.forEach(participantId => {
          global.socketServer.emitToUser(participantId.toString(), 'conversation:updated', {
            conversationId,
            lastMessage: message.toObject(),
            lastActivity: new Date()
          });
        });
      }
      
      res.json(createResponse(true, 'Audio message sent successfully', messageWithStatus));
      
    } catch (error) {
      console.error('Send audio message error:', error);
      res.status(500).json(createResponse(false, 'Internal server error', null, null, 500));
    }
  });
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
      
      // Also emit conversation update for unread count changes
      conversation.participants.forEach(participantId => {
        global.socketServer.emitToUser(participantId.toString(), 'conversation:updated', {
          conversationId,
          action: 'messages_read',
          readBy: currentUserId
        });
      });
    }
    
    res.json(createResponse(true, 'Messages marked as read'));
    
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json(createResponse(false, 'Internal server error', null, null, 500));
  }
};

// Recall a message (soft delete with TTL)
exports.recallMessage = async (req, res) => {
  try {
    const currentUserId = req.userId;
    const { messageId } = req.params;
    
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json(createResponse(false, 'Message not found', null, null, 404));
    }
    
    // Check if message is already deleted
    if (message.isDeleted) {
      return res.status(400).json(createResponse(false, 'Message already recalled', null, null, 400));
    }
    
    // Check if user is sender
    if (message.sender.toString() !== currentUserId) {
      return res.status(403).json(createResponse(false, 'Only sender can recall message', null, null, 403));
    }
    
    // Check time limit (e.g., can only recall within 24 hours)
    const timeLimit = 24 * 60 * 60 * 1000; // 24 hours
    if (Date.now() - new Date(message.createdAt).getTime() > timeLimit) {
      return res.status(400).json(createResponse(false, 'Cannot recall message after 24 hours', null, null, 400));
    }
    
    // Recall message using model method
    await message.recallMessage(currentUserId);
    
    // Emit socket event
    if (global.socketServer) {
      const conversation = await Conversation.findById(message.conversation);
      conversation.participants.forEach(participantId => {
        global.socketServer.emitToUser(participantId.toString(), 'message:recalled', {
          conversationId: message.conversation,
          messageId: message._id,
          recalledBy: currentUserId,
          recalledAt: message.deletedAt
        });
      });
    }
    
    res.json(createResponse(true, 'Message recalled successfully', {
      messageId: message._id,
      recalledAt: message.deletedAt,
      expiresAt: message.expiresAt
    }));
    
  } catch (error) {
    console.error('Recall message error:', error);
    res.status(500).json(createResponse(false, 'Internal server error', null, null, 500));
  }
};

// Delete a message (legacy - keep for compatibility)
exports.deleteMessage = exports.recallMessage;

// Edit a message
exports.editMessage = async (req, res) => {
  try {
    const currentUserId = req.userId;
    const { messageId } = req.params;
    const { text } = req.body;
    
    if (!text || !text.trim()) {
      return res.status(400).json(createResponse(false, 'Message text is required', null, null, 400));
    }
    
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json(createResponse(false, 'Message not found', null, null, 404));
    }
    
    // Check if message is deleted
    if (message.isDeleted) {
      return res.status(400).json(createResponse(false, 'Cannot edit recalled message', null, null, 400));
    }
    
    // Check if user is sender
    if (message.sender.toString() !== currentUserId) {
      return res.status(403).json(createResponse(false, 'Only sender can edit message', null, null, 403));
    }
    
    // Check if message is text type
    if (message.type !== 'text' && !message.content.text) {
      return res.status(400).json(createResponse(false, 'Can only edit text messages', null, null, 400));
    }
    
    // Check time limit (e.g., can only edit within 24 hours)
    const timeLimit = 24 * 60 * 60 * 1000; // 24 hours
    if (Date.now() - new Date(message.createdAt).getTime() > timeLimit) {
      return res.status(400).json(createResponse(false, 'Cannot edit message after 24 hours', null, null, 400));
    }
    
    // Edit message using model method
    await message.editMessage(text.trim());
    
    // Populate sender info
    await message.populate('sender', 'username displayName avatar');
    
    // Emit socket event
    if (global.socketServer) {
      const conversation = await Conversation.findById(message.conversation);
      conversation.participants.forEach(participantId => {
        global.socketServer.emitToUser(participantId.toString(), 'message:edited', {
          conversationId: message.conversation,
          message: message.toObject(),
          editedBy: currentUserId,
          editedAt: new Date()
        });
      });
    }
    
    res.json(createResponse(true, 'Message edited successfully', message.toObject()));
    
  } catch (error) {
    console.error('Edit message error:', error);
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

// Get user online status
exports.getUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId).select('isOnline lastSeen');
    
    if (!user) {
      return res.status(404).json(createResponse(false, 'User not found', null, null, 404));
    }
    
    res.json(createResponse(true, 'User status retrieved successfully', {
      userId,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen
    }));
    
  } catch (error) {
    console.error('Get user status error:', error);
    res.status(500).json(createResponse(false, 'Internal server error', null, null, 500));
  }
};

module.exports = exports;
