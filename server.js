import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/database.js';
import { errorHandler } from './middleware/errorHandler.js';

// Import routes
import User from './models/User.js';
import authRoutes from './routes/authRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';
import userRoutes from './routes/userRoutes.js';
import videoRoutes from './routes/videoRoutes.js';


// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Initialize Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet()); // Security headers
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  }),
);
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Make io accessible to routes
app.set('io', io);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Omega Connect API is running',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/video', videoRoutes);
app.use('/api/subscription', subscriptionRoutes);


// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Handle user going live
  // socket.on('goLive', (userId) => {
  //   socket.join(`user_${userId}`);
  //   console.log(`User ${userId} is now live`);
  // });
  socket.on('goLive', async (userId) => {
    socket.userId = userId; // ✅ store for disconnect
    socket.join(`user_${userId}`);

    await User.findByIdAndUpdate(userId, { isLive: true });
    console.log(`User ${userId} is now live`);
  });

  // Handle user joining a stream
  socket.on('joinStream', ({ userId, targetUserId }) => {
    socket.join(`stream_${targetUserId}`);
    io.to(`user_${targetUserId}`).emit('viewerJoined', { userId });
  });

  // WebRTC signaling
  socket.on('offer', ({ offer, targetUserId }) => {
    io.to(`user_${targetUserId}`).emit('offer', { offer, from: socket.id });
  });

  socket.on('answer', ({ answer, targetUserId }) => {
    io.to(`user_${targetUserId}`).emit('answer', { answer, from: socket.id });
  });

  socket.on('ice-candidate', ({ candidate, targetUserId }) => {
    io.to(`user_${targetUserId}`).emit('ice-candidate', {
      candidate,
      from: socket.id,
    });
  });

  // Handle disconnection
  // socket.on('disconnect', () => {
  //   console.log('User disconnected:', socket.id);
  // });
  socket.on('disconnect', async () => {
    if (socket.userId) {
      await User.findByIdAndUpdate(socket.userId, { isLive: false });
    }
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
  });
});

// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Socket.io is ready for WebRTC signaling`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  httpServer.close(() => process.exit(1));
});

export default app;
