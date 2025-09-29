const mongoose = require('mongoose');

const pushSubscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  endpoint: {
    type: String,
    required: true,
    unique: true
  },
  keys: {
    p256dh: {
      type: String,
      required: true
    },
    auth: {
      type: String,
      required: true
    }
  },
  userAgent: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastUsed: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries - endpoint already unique, so skip duplicate
pushSubscriptionSchema.index({ userId: 1, isActive: 1 });

// Clean up expired subscriptions
pushSubscriptionSchema.index({ 
  lastUsed: 1 
}, { 
  expireAfterSeconds: 30 * 24 * 60 * 60 // 30 days
});

// Methods
pushSubscriptionSchema.methods.toSubscriptionObject = function() {
  return {
    endpoint: this.endpoint,
    keys: {
      p256dh: this.keys.p256dh,
      auth: this.keys.auth
    }
  };
};

// Statics
pushSubscriptionSchema.statics.findByUserId = function(userId) {
  return this.find({ userId, isActive: true });
};

pushSubscriptionSchema.statics.findByEndpoint = function(endpoint) {
  return this.findOne({ endpoint });
};

pushSubscriptionSchema.statics.deactivateByEndpoint = function(endpoint) {
  return this.updateOne({ endpoint }, { isActive: false });
};

module.exports = mongoose.model('PushSubscription', pushSubscriptionSchema);
