# 🎨 Frontend Setup Guide

This guide will help you set up and run the Omega Connect frontend alongside the backend.

## 📁 Project Structure

```
C:\Project\
├── Omega-backend\          # Backend (Express, Socket.io, MongoDB)
│   ├── server.js
│   ├── package.json
│   └── ...
└── omega-frontend\         # Frontend (React, TypeScript, Tailwind)
    ├── src\
    ├── package.json
    └── ...
```

## 🚀 Quick Setup (Both Frontend & Backend)

### 1. Start Backend (Terminal 1)

```bash
cd C:\Project\Omega-backend
npm install
npm run dev
```

Backend will run on: `http://localhost:5000`

### 2. Start Frontend (Terminal 2)

```bash
cd C:\Project\omega-frontend
npm install
npm run dev
```

Frontend will run on: `http://localhost:3000`

## ✅ Verify Setup

1. **Backend Health Check**
   - Visit: http://localhost:5000/health
   - Should see: `{"status":"success","message":"Omega Connect API is running"}`

2. **Frontend Check**
   - Visit: http://localhost:3000
   - Should see login page

3. **Test Registration**
   - Go to http://localhost:3000/register
   - Create an account
   - Should redirect to dashboard

## 🔧 Environment Variables

### Backend (.env in Omega-backend)
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/omega-connect
JWT_SECRET=omega_connect_super_secret_key_change_in_production_2024
JWT_EXPIRE=7d
REDIS_ENABLED=false
CLIENT_URL=http://localhost:3000
```

### Frontend (.env in omega-frontend)
```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

## 📡 API Endpoints Used by Frontend

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Sign in
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Sign out

### Users
- `GET /api/users/recommendations` - Get live users to match
- `GET /api/users/matches` - Get matched users
- `POST /api/users/swipe` - Like/skip action
- `POST /api/users/update` - Update profile

### Video
- `POST /api/video/start` - Start streaming
- `POST /api/video/join` - Join a stream
- `POST /api/video/end` - End streaming
- `GET /api/video/history` - Stream history

### Subscription
- `GET /api/subscription/plans` - Get plans
- `GET /api/subscription/status` - Get user status
- `POST /api/subscription/subscribe` - Subscribe to plan

## 🎥 WebRTC & Socket.io Flow

1. **User goes live:**
   ```
   Frontend → POST /api/video/start → Backend
   Frontend → Socket.emit('goLive') → Backend
   ```

2. **Finding a match:**
   ```
   Frontend → GET /api/users/recommendations → Backend
   Frontend creates WebRTC offer
   Frontend → Socket.emit('offer') → Backend → Other user
   ```

3. **Connection established:**
   ```
   Other user creates answer
   Other user → Socket.emit('answer') → Backend → First user
   ICE candidates exchanged via Socket.io
   WebRTC peer connection established
   ```

## 🧪 Testing with Multiple Users

### Option 1: Multiple Browsers
1. Open Chrome → Register user1
2. Open Firefox → Register user2
3. Both users go to video chat
4. They should match automatically

### Option 2: Incognito/Private
1. Regular window → user1
2. Incognito window → user2
3. Test matching

### Option 3: Multiple Devices
1. Desktop → user1
2. Mobile/Tablet → user2 (use your local IP)

## 🐛 Common Issues

### CORS Errors
**Problem:** Frontend can't connect to backend

**Solution:** Check backend `server.js` has correct CORS setup:
```javascript
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));
```

### Socket.io Connection Failed
**Problem:** Real-time features not working

**Solution:**
1. Verify backend is running on port 5000
2. Check vite.config.ts proxy settings
3. Look for Socket.io connection in browser console

### Video Not Working
**Problem:** Camera/microphone not accessible

**Solution:**
1. Check browser permissions
2. Use HTTPS in production
3. Ensure no other app is using camera

### MongoDB Connection Error
**Problem:** Backend can't connect to database

**Solution:**
1. Start MongoDB: `mongod`
2. Or use MongoDB Atlas cloud database
3. Update MONGODB_URI in .env

## 🎯 Development Workflow

1. **Start Backend First**
   ```bash
   cd Omega-backend
   npm run dev
   ```

2. **Then Start Frontend**
   ```bash
   cd omega-frontend
   npm run dev
   ```

3. **Make Changes**
   - Both have hot reload enabled
   - Changes reflect automatically

4. **Test Features**
   - Create accounts
   - Test video chat
   - Check subscriptions
   - Update profiles

## 📦 Production Deployment

### Backend (Heroku/Railway/Render)
```bash
cd Omega-backend
# Set environment variables on hosting platform
# Deploy backend first
```

### Frontend (Vercel/Netlify)
```bash
cd omega-frontend
# Update .env with production backend URL
# Build and deploy
npm run build
```

## 🔒 Security Notes

### Development
- Using HTTP is fine
- localhost is secure
- CORS enabled for testing

### Production
- **Must use HTTPS** for WebRTC
- Update CORS to production domain
- Use environment variables
- Enable security headers
- Use secure JWT secrets

## 📊 Monitoring

### Backend Logs
Watch for:
- Socket.io connections
- API requests
- WebRTC signaling events

### Frontend Console
Check for:
- API errors
- Socket connection status
- WebRTC connection state

## 🎨 Frontend Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Vite** - Build tool
- **React Router** - Navigation
- **Axios** - HTTP client
- **Socket.io Client** - Real-time
- **WebRTC** - Video streaming

## 🔗 Helpful Links

- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- Backend Health: http://localhost:5000/health
- Frontend README: `omega-frontend/README.md`
- Frontend Quick Start: `omega-frontend/QUICK_START.md`

## 💡 Tips

1. **Keep both terminals open** - One for backend, one for frontend
2. **Check backend first** - Make sure it's running before frontend
3. **Use browser DevTools** - Network tab for API calls, Console for errors
4. **Test with 2+ users** - Video matching requires multiple users
5. **Clear localStorage** - If you encounter auth issues

## 🆘 Getting Help

1. Check terminal logs for errors
2. Review browser console (F12)
3. Verify all dependencies are installed
4. Ensure MongoDB is running
5. Check that ports 3000 and 5000 are not in use

---

**Ready to code! 🚀**

For detailed frontend documentation, see: `omega-frontend/README.md`

