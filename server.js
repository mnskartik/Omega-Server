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
import { setupMatchmaking } from "./controllers/matchController.js";


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
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // -----------------------------------------
  // 1️⃣ LIVESTREAM EVENTS  (your existing system)
  // -----------------------------------------

  socket.on("goLive", async (userId) => {
    socket.userId = userId;
    socket.join(`user_${userId}`);

    await User.findByIdAndUpdate(userId, { isLive: true });
    console.log(`User ${userId} is now live`);
  });

  socket.on("joinStream", ({ userId, targetUserId }) => {
    socket.join(`stream_${targetUserId}`);
    io.to(`user_${targetUserId}`).emit("viewerJoined", { userId });
  });

  socket.on("offer", ({ offer, targetUserId }) => {
    io.to(`user_${targetUserId}`).emit("offer", { offer, from: socket.id });
  });

  socket.on("answer", ({ answer, targetUserId }) => {
    io.to(`user_${targetUserId}`).emit("answer", { answer, from: socket.id });
  });

  socket.on("ice-candidate", ({ candidate, targetUserId }) => {
    io.to(`user_${targetUserId}`).emit("ice-candidate", {
      candidate,
      from: socket.id,
    });
  });

  // -----------------------------------------
  // 2️⃣ OMEGLE-STYLE MATCHMAKING
  // -----------------------------------------

  // Temporary storage for waiting user
  let waitingUser = null;

  socket.on("findPartner", () => {
    if (!waitingUser) {
      waitingUser = socket.id;
      socket.emit("matchStatus", "Waiting for a partner...");
    } else {
      const partner = waitingUser;
      waitingUser = null;

      // send match to both users
      socket.emit("partnerFound", partner);
      io.to(partner).emit("partnerFound", socket.id);

      console.log(`Matched: ${socket.id} ↔ ${partner}`);
    }
  });

  // WebRTC relays for 1-on-1 matching
  socket.on("offer-m", ({ offer, target }) => {
    io.to(target).emit("offer-m", { offer, from: socket.id });
  });

  socket.on("answer-m", ({ answer, target }) => {
    io.to(target).emit("answer-m", { answer, from: socket.id });
  });

  socket.on("ice-m", ({ candidate, target }) => {
    io.to(target).emit("ice-m", { candidate, from: socket.id });
  });

  // -----------------------------------------
  // 3️⃣ DISCONNECT HANDLING
  // -----------------------------------------
  socket.on("disconnect", async () => {
    console.log("User disconnected:", socket.id);

    // livestream cleanup
    if (socket.userId) {
      await User.findByIdAndUpdate(socket.userId, { isLive: false });
    }

    // matchmaking cleanup
    if (waitingUser === socket.id) {
      waitingUser = null;
    }
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
