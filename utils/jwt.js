import jwt from 'jsonwebtoken';

// Generate JWT token
export const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Send token response
export const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  // Create token
  const token = generateToken(user._id);

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  };

  // Remove password from output
  user.password = undefined;

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      status: 'success',
      message,
      token,
      data: {
        user
      }
    });
};

