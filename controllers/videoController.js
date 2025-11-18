import { safeRedisDel, safeRedisIncr, safeRedisSet } from '../config/redis.js';
import Stream from '../models/Stream.js';
import User from '../models/User.js';
import { generateStreamKey } from '../utils/streamKey.js';

export const startStream = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Check if user already has an active stream
    const existingStream = await Stream.findOne({
      userId,
      status: 'live',
    });

    if (existingStream) {
      return res.status(400).json({
        status: 'error',
        message: 'You already have an active stream',
        data: {
          stream: existingStream,
        },
      });
    }

    // Generate stream key
    const streamKey = generateStreamKey(userId);

    // Create new stream
    const stream = await Stream.create({
      userId,
      streamKey,
      status: 'live',
    });

    // Update user's live status
    await User.findByIdAndUpdate(userId, {
      isLive: true,
      lastActive: new Date(),
    });

    // Store stream info in Redis for quick access (optional)
    await safeRedisSet(
      `stream:${streamKey}`,
      JSON.stringify({
        userId,
        streamId: stream._id,
        status: 'live',
        startedAt: stream.startedAt,
      }),
      { EX: 3600 }, // Expire in 1 hour
    );

    // Emit event via Socket.io
    const io = req.app.get('io');
    io.emit('userWentLive', { userId });

    res.status(201).json({
      status: 'success',
      message: 'Stream started successfully',
      data: {
        stream,
        streamKey,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Join another user's stream
// @route   POST /api/video/join
// @access  Private
export const joinStream = async (req, res, next) => {
  try {
    const { streamKey } = req.body;
    const viewerId = req.user.id;

    if (!streamKey) {
      return res.status(400).json({
        status: 'error',
        message: 'Stream key is required',
      });
    }

    // Find the stream
    const stream = await Stream.findOne({
      streamKey,
      status: 'live',
    }).populate('userId', 'email bio gender interests profileImage');

    if (!stream) {
      return res.status(404).json({
        status: 'error',
        message: 'Stream not found or has ended',
      });
    }

    // Check if viewer is blocked
    const streamer = await User.findById(stream.userId);
    if (streamer.blockedUsers.includes(viewerId)) {
      return res.status(403).json({
        status: 'error',
        message: 'You cannot join this stream',
      });
    }

    // Add viewer to stream
    if (!stream.viewers.includes(viewerId)) {
      stream.viewers.push(viewerId);
      stream.viewerCount += 1;
      await stream.save();
    }

    // Update Redis (optional)
    await safeRedisIncr(`stream:${streamKey}:viewers`);

    // Emit event via Socket.io
    const io = req.app.get('io');
    io.to(`stream_${stream.userId}`).emit('viewerJoined', {
      viewerId,
      viewerCount: stream.viewerCount,
    });

    res.status(200).json({
      status: 'success',
      message: 'Joined stream successfully',
      data: {
        stream,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    End a stream
// @route   POST /api/video/end
// @access  Private
export const endStream = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { streamKey } = req.body;

    // Find and update the stream
    const stream = await Stream.findOneAndUpdate(
      {
        streamKey,
        userId,
        status: 'live',
      },
      {
        status: 'ended',
        endedAt: new Date(),
      },
      { new: true },
    );

    if (!stream) {
      return res.status(404).json({
        status: 'error',
        message: 'Active stream not found',
      });
    }

    // Update user's live status
    await User.findByIdAndUpdate(userId, {
      isLive: false,
      lastActive: new Date(),
    });

    // Remove from Redis (optional)
    await safeRedisDel(`stream:${streamKey}`);
    await safeRedisDel(`stream:${streamKey}:viewers`);

    // Emit event via Socket.io
    const io = req.app.get('io');
    io.to(`stream_${userId}`).emit('streamEnded', {
      streamId: stream._id,
    });

    res.status(200).json({
      status: 'success',
      message: 'Stream ended successfully',
      data: {
        stream,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get stream status
// @route   GET /api/video/status/:id
// @access  Private
export const getStreamStatus = async (req, res, next) => {
  try {
    const userId = req.params.id;

    // Check user's live status
    const user = await User.findById(userId).select('isLive');

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }

    if (!user.isLive) {
      return res.status(200).json({
        status: 'success',
        data: {
          isLive: false,
          stream: null,
        },
      });
    }

    // Get active stream
    const stream = await Stream.findOne({
      userId,
      status: 'live',
    });

    res.status(200).json({
      status: 'success',
      data: {
        isLive: true,
        stream,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's stream history
// @route   GET /api/video/history
// @access  Private
export const getStreamHistory = async (req, res, next) => {
  try {
    const streams = await Stream.find({
      userId: req.user.id,
    })
      .sort('-createdAt')
      .limit(20);

    res.status(200).json({
      status: 'success',
      results: streams.length,
      data: {
        streams,
      },
    });
  } catch (error) {
    next(error);
  }
};
