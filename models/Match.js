import mongoose from 'mongoose';

const matchSchema = new mongoose.Schema({
  userA: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userB: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'matched', 'rejected'],
    default: 'pending'
  },
  matchedAt: {
    type: Date
  },
  connectionDuration: {
    type: Number, // in seconds
    default: 0
  },
  initiatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate matches
matchSchema.index({ userA: 1, userB: 1 }, { unique: true });

// Index for quick lookups
matchSchema.index({ userA: 1, status: 1 });
matchSchema.index({ userB: 1, status: 1 });

const Match = mongoose.model('Match', matchSchema);

export default Match;

