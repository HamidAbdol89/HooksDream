const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  participants: [{
    type: String, // Changed from ObjectId to String to match User._id
    ref: 'User',
    required: true
  }],
  type: {
    type: String,
    enum: ['direct', 'group'],
    default: 'direct'
  },
  name: {
    type: String, // Cho group chat
    trim: true
  },
  avatar: {
    type: String // Cho group chat
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Unread count per participant
  unreadCount: [{
    user: {
      type: String,
      ref: 'User'
    },
    count: {
      type: Number,
      default: 0
    }
  }],
  // Metadata cho conversation
  metadata: {
    createdBy: {
      type: String, // Changed from ObjectId to String
      ref: 'User'
    },
    isArchived: {
      type: Boolean,
      default: false
    },
    isMuted: [{
      user: {
        type: String, // Changed from ObjectId to String
        ref: 'User'
      },
      mutedAt: {
        type: Date,
        default: Date.now
      }
    }]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes cho performance
conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastActivity: -1 });
conversationSchema.index({ 'participants': 1, 'lastActivity': -1 });

// Virtual để get participant count
conversationSchema.virtual('participantCount').get(function() {
  return this.participants.length;
});

// Method để check if user is participant
conversationSchema.methods.isParticipant = function(userId) {
  return this.participants.some(p => p.toString() === userId.toString());
};

// Method để get other participant (for direct chat)
conversationSchema.methods.getOtherParticipant = function(userId) {
  if (this.type !== 'direct') return null;
  return this.participants.find(p => p.toString() !== userId.toString());
};

// Method để increment unread count cho user
conversationSchema.methods.incrementUnreadCount = function(userId) {
  const userUnread = this.unreadCount.find(u => u.user.toString() === userId.toString());
  if (userUnread) {
    userUnread.count += 1;
  } else {
    this.unreadCount.push({ user: userId, count: 1 });
  }
};

// Method để clear unread count cho user
conversationSchema.methods.clearUnreadCount = function(userId) {
  const userUnread = this.unreadCount.find(u => u.user.toString() === userId.toString());
  if (userUnread) {
    userUnread.count = 0;
  }
};

// Method để get unread count cho user
conversationSchema.methods.getUnreadCount = function(userId) {
  const userUnread = this.unreadCount.find(u => u.user.toString() === userId.toString());
  return userUnread ? userUnread.count : 0;
};

// Static method để find conversation between users
conversationSchema.statics.findDirectConversation = function(user1Id, user2Id) {
  return this.findOne({
    type: 'direct',
    participants: { $all: [user1Id, user2Id], $size: 2 }
  });
};

module.exports = mongoose.model('Conversation', conversationSchema);
