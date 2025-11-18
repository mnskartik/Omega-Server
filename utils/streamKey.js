import crypto from 'crypto';

export const generateStreamKey = (userId) => {
  const timestamp = Date.now();
  const random = crypto.randomBytes(16).toString('hex');
  return `${userId}_${timestamp}_${random}`;
};

export const validateStreamKey = (streamKey) => {
  const parts = streamKey.split('_');
  return parts.length === 3 && parts[0].length === 24; // MongoDB ObjectId length
};

