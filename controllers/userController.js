import Match from '../models/Match.js';
import User from '../models/User.js';

// @desc    Get user profile by ID
// @route   GET /api/users/:id
// @access  Private
export const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }

    // Check if user is blocked
    if (req.user.blockedUsers.includes(user._id)) {
      return res.status(403).json({
        status: 'error',
        message: 'This user is blocked',
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   POST /api/users/update
// @access  Private
export const updateProfile = async (req, res, next) => {
  try {
    const { bio, interests, gender, profileImage } = req.body;

    const fieldsToUpdate = {};
    if (bio !== undefined) fieldsToUpdate.bio = bio;
    if (interests !== undefined) fieldsToUpdate.interests = interests;
    if (gender !== undefined) fieldsToUpdate.gender = gender;
    if (profileImage !== undefined) fieldsToUpdate.profileImage = profileImage;

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true,
    }).select('-password');

    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};




export const getRecommendations = async (req, res, next) => {
  try {
    const currentUser = req.user;
    console.log('🟢 Current user ID:', currentUser._id);
    console.log('🧱 Blocked users:', currentUser.blockedUsers);

    // 1️⃣ Get all matched users for the current user
    const matches = await Match.find({
      $or: [{ userA: currentUser._id }, { userB: currentUser._id }],
      status: 'matched',
    });
    console.log('📦 Matches found:', matches.length);

    // Extract matched user IDs
    const matchedUserIds = matches.map((match) =>
      match.userA.toString() === currentUser._id.toString()
        ? match.userB.toString()
        : match.userA.toString(),
    );

    console.log('🔗 Matched user IDs:', matchedUserIds);

    // 2️⃣ Build filter query
    const query = {
      _id: {
        $ne: currentUser._id,
        $nin: [...(currentUser.blockedUsers || []), ...matchedUserIds],
      },
      isLive: true,
      isActive: true,
    };

    console.log('🔍 Query:', JSON.stringify(query, null, 2));

    // 3️⃣ Fetch users
    const liveUsers = await User.find(query)
      .select('-password')
      .limit(20)
      .lean();

    console.log('👥 Live users found:', liveUsers.length);

    res.status(200).json({
      status: 'success',
      results: liveUsers.length,
      data: {
        users: liveUsers,
      },
    });
  } catch (error) {
    console.error('❌ Error in getRecommendations:', error);
    next(error);
  }
};

// @desc    Handle swipe action
// @route   POST /api/users/swipe
// @access  Private
export const swipeUser = async (req, res, next) => {
  try {
    const { targetUserId, action } = req.body;

    if (!targetUserId || !action) {
      return res.status(400).json({
        status: 'error',
        message: 'Target user ID and action are required',
      });
    }

    if (!['like', 'skip'].includes(action)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid action. Must be "like" or "skip"',
      });
    }

    const currentUser = await User.findById(req.user.id);

    // Check if user can swipe
    if (!currentUser.canSwipe()) {
      return res.status(403).json({
        status: 'error',
        message: 'Swipe limit reached. Upgrade to premium for unlimited swipes',
        swipesRemaining: 0,
      });
    }

    // Increment swipe count
    await currentUser.incrementSwipe();

    if (action === 'like') {
      // Create or update match
      const match = await Match.findOneAndUpdate(
        {
          $or: [
            { userA: currentUser._id, userB: targetUserId },
            { userA: targetUserId, userB: currentUser._id },
          ],
        },
        {
          userA: currentUser._id,
          userB: targetUserId,
          status: 'matched',
          matchedAt: new Date(),
          initiatedBy: currentUser._id,
        },
        {
          upsert: true,
          new: true,
        },
      );

      // Emit match event via Socket.io
      const io = req.app.get('io');
      io.to(`user_${targetUserId}`).emit('newMatch', {
        userId: currentUser._id,
        matchId: match._id,
      });

      res.status(200).json({
        status: 'success',
        message: 'Match created',
        data: {
          match,
          swipesRemaining: currentUser.canSwipe()
            ? currentUser.plan === 'premium'
              ? 'unlimited'
              : parseInt(process.env.FREE_SWIPES_PER_WEEK || 10) -
                currentUser.swipesThisWeek
            : 0,
        },
      });
    } else {
      // Just skip
      res.status(200).json({
        status: 'success',
        message: 'User skipped',
        data: {
          swipesRemaining: currentUser.canSwipe()
            ? currentUser.plan === 'premium'
              ? 'unlimited'
              : parseInt(process.env.FREE_SWIPES_PER_WEEK || 10) -
                currentUser.swipesThisWeek
            : 0,
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Report or block a user
// @route   POST /api/users/report
// @access  Private
export const reportUser = async (req, res, next) => {
  try {
    const { targetUserId, reason, action } = req.body; // action: 'report' or 'block'

    if (!targetUserId || !action) {
      return res.status(400).json({
        status: 'error',
        message: 'Target user ID and action are required',
      });
    }

    const currentUser = await User.findById(req.user.id);

    if (action === 'block') {
      if (!currentUser.blockedUsers.includes(targetUserId)) {
        currentUser.blockedUsers.push(targetUserId);
        await currentUser.save();
      }

      res.status(200).json({
        status: 'success',
        message: 'User blocked successfully',
      });
    } else if (action === 'report') {
      if (!reason) {
        return res.status(400).json({
          status: 'error',
          message: 'Report reason is required',
        });
      }

      currentUser.reportedUsers.push({
        userId: targetUserId,
        reason,
        reportedAt: new Date(),
      });
      await currentUser.save();

      res.status(200).json({
        status: 'success',
        message: 'User reported successfully',
      });
    } else {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid action',
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's matches
// @route   GET /api/users/matches
// @access  Private
export const getUserMatches = async (req, res, next) => {
  try {
    const matches = await Match.find({
      $or: [{ userA: req.user.id }, { userB: req.user.id }],
      status: 'matched',
    })
      .populate('userA', 'email bio gender interests profileImage')
      .populate('userB', 'email bio gender interests profileImage')
      .sort('-matchedAt');

    res.status(200).json({
      status: 'success',
      results: matches.length,
      data: {
        matches,
      },
    });
  } catch (error) {
    next(error);
  }
};
