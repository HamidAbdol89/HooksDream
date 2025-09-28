const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  sender: {
    type: String, // Changed from ObjectId to String to match User._id
    ref: 'User',
    required: true
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  content: {
    text: {
      type: String,
      trim: true
    },
    image: {
      type: String // URL to image
    },
    video: {
      url: String,
      duration: Number, // Duration in seconds
      thumbnail: String // Thumbnail URL
    },
    audio: {
      url: String,
      duration: Number, // Duration in seconds
      waveform: [Number] // Audio waveform data for visualization
    },
    file: {
      url: String,
      name: String,
      size: Number,
      type: String
    }
  },
  type: {
    type: String,
    enum: ['text', 'image', 'video', 'audio', 'file', 'system'],
    default: 'text'
  },
  // Message status
  status: {
    type: String,
    enum: ['sending', 'sent', 'delivered', 'read'],
    default: 'sent'
  },
  // Read receipts
  readBy: [{
    user: {
      type: String, // Changed from ObjectId to String
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Message reactions
  reactions: [{
    user: {
      type: String, // Changed from ObjectId to String
      ref: 'User'
    },
    emoji: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Soft delete with TTL
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  },
  deletedBy: {
    type: String, // Changed from ObjectId to String
    ref: 'User'
  },
  // TTL for auto cleanup (30 days after deletion)
  deleteType: {
    type: String,
    enum: ['recall', 'permanent'], // recall = soft delete, permanent = hard delete
    default: 'recall'
  },
  // Auto cleanup after 30 days of deletion
  expiresAt: {
    type: Date,
    index: { expireAfterSeconds: 0 } // MongoDB TTL index
  },
  // Edit history
  editHistory: [{
    content: String,
    editedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isEdited: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes cho performance
messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ conversation: 1, status: 1 });
messageSchema.index({ 'readBy.user': 1 });

// Virtual để check if message has content
messageSchema.virtual('hasContent').get(function() {
  return !!(this.content.text || this.content.image || this.content.video || this.content.audio || this.content.file);
});

// Method để mark as read by user
messageSchema.methods.markAsRead = function(userId) {
  const existingRead = this.readBy.find(r => r.user.toString() === userId.toString());
  if (!existingRead) {
    this.readBy.push({ user: userId });
  }
  return this.save();
};

// Method để check if read by user
messageSchema.methods.isReadBy = function(userId) {
  return this.readBy.some(r => r.user.toString() === userId.toString());
};

// Method để add reaction
messageSchema.methods.addReaction = function(userId, emoji) {
  // Remove existing reaction from this user
  this.reactions = this.reactions.filter(r => r.user.toString() !== userId.toString());
  // Add new reaction
  this.reactions.push({ user: userId, emoji });
  return this.save();
};

// Method để remove reaction
messageSchema.methods.removeReaction = function(userId) {
  this.reactions = this.reactions.filter(r => r.user.toString() !== userId.toString());
  return this.save();
};

// Method để recall message (soft delete với TTL)
messageSchema.methods.recallMessage = function(userId) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = userId;
  this.deleteType = 'recall';
  // Set TTL to 30 days from now
  this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  return this.save();
};

// Method để edit message
messageSchema.methods.editMessage = function(newContent) {
  // Save current content to history
  if (this.content.text) {
    this.editHistory.push({
      content: this.content.text,
      editedAt: new Date()
    });
  }
  
  // Update content
  this.content.text = newContent;
  this.isEdited = true;
  return this.save();
};

// Pre-save middleware để update conversation lastActivity
messageSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      const Conversation = mongoose.model('Conversation');
      await Conversation.findByIdAndUpdate(this.conversation, {
        lastMessage: this._id,
        lastActivity: new Date()
      });
    } catch (error) {
      console.error('Error updating conversation:', error);
    }
  }
  next();
});

module.exports = mongoose.model('Message', messageSchema);