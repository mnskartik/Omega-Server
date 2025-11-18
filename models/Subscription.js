import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  plan: {
    type: String,
    enum: ['free', 'premium'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'cancelled', 'expired'],
    default: 'active'
  },
  stripeCustomerId: {
    type: String
  },
  stripeSubscriptionId: {
    type: String
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  amount: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  autoRenew: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for quick lookups
subscriptionSchema.index({ userId: 1, status: 1 });

const Subscription = mongoose.model('Subscription', subscriptionSchema);

export default Subscription;

