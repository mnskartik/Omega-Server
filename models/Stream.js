import mongoose from 'mongoose';

const streamSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  streamKey: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['live', 'ended'],
    default: 'live'
  },
  viewers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  viewerCount: {
    type: Number,
    default: 0
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  endedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for quick lookups
streamSchema.index({ userId: 1, status: 1 });
streamSchema.index({ streamKey: 1 });

const Stream = mongoose.model('Stream', streamSchema);

export default Stream;

