import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters'],
    default: ''
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer-not-to-say'],
    required: [true, 'Gender is required']
  },
  interests: [{
    type: String,
    trim: true
  }],
  isLive: {
    type: Boolean,
    default: false
  },
  plan: {
    type: String,
    enum: ['free', 'premium'],
    default: 'free'
  },
  swipesThisWeek: {
    type: Number,
    default: 0
  },
  swipesResetDate: {
    type: Date,
    default: () => {
      const date = new Date();
      date.setDate(date.getDate() + 7);
      return date;
    }
  },
  profileImage: {
    type: String,
    default: ''
  },
  blockedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  reportedUsers: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    reportedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to check if user can swipe
userSchema.methods.canSwipe = function() {
  // Premium users have unlimited swipes
  if (this.plan === 'premium') {
    return true;
  }

  // Check if reset date has passed
  if (new Date() > this.swipesResetDate) {
    this.swipesThisWeek = 0;
    this.swipesResetDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }

  // Check swipe limit for free users
  const freeLimit = parseInt(process.env.FREE_SWIPES_PER_WEEK) || 10;
  return this.swipesThisWeek < freeLimit;
};

// Method to increment swipe count
userSchema.methods.incrementSwipe = async function() {
  this.swipesThisWeek += 1;
  await this.save();
};

const User = mongoose.model('User', userSchema);

export default User;

