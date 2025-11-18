# Omega Connect Backend

Node.js Express backend with ES6 modules for a live video matching platform.

## Quick Start

### 1. Create .env file

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/omega-connect

# JWT Secret
JWT_SECRET=omega_connect_super_secret_key_change_in_production_2024
JWT_EXPIRE=7d

# Redis Configuration (Optional - Set to 'true' to enable)
REDIS_ENABLED=false
REDIS_HOST=localhost
REDIS_PORT=6379

# Stripe Configuration
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# CORS
CLIENT_URL=http://localhost:3000

# Subscription Plans
FREE_SWIPES_PER_WEEK=10
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start MongoDB

```bash
mongod
```

Or use MongoDB Atlas (cloud database).

### 4. Run the Server

```bash
npm run dev
```

## Features

- ✅ **Password Hashing** - Automatic bcrypt hashing (10 rounds)
- ✅ **JWT Authentication** - Token-based auth
- ✅ **User Profiles** - Bio, interests, gender
- ✅ **Live Video Streaming** - WebRTC signaling via Socket.io
- ✅ **Swipe Matching** - Like/skip system
- ✅ **Subscription System** - Free & Premium plans with Stripe
- ✅ **Redis Caching** - Optional (disabled by default)
- ✅ **Real-time Events** - Socket.io integration

## Redis Configuration

**Redis is now optional!** The app works perfectly without Redis.

- **Disabled (default)**: Set `REDIS_ENABLED=false` or leave it empty
- **Enabled**: Set `REDIS_ENABLED=true` and start Redis server

When disabled, you won't see any Redis connection errors.

## API Endpoints

### Authentication (`/api/auth`)

- `POST /register` - Register user (password auto-hashed)
- `POST /login` - Login user
- `GET /me` - Get current user (protected)
- `POST /logout` - Logout (protected)
- `PUT /updatepassword` - Update password (protected)

### Users (`/api/users`)

- `GET /recommendations` - Get live users (protected)
- `GET /matches` - Get matches (protected)
- `GET /:id` - Get user profile (protected)
- `POST /update` - Update profile (protected)
- `POST /swipe` - Swipe action (protected)
- `POST /report` - Report/block user (protected)

### Video (`/api/video`)

- `POST /start` - Start stream (protected)
- `POST /join` - Join stream (protected)
- `POST /end` - End stream (protected)
- `GET /status/:id` - Stream status (protected)
- `GET /history` - Stream history (protected)

### Subscription (`/api/subscription`)

- `GET /plans` - Get plans (public)
- `GET /status` - Get status (protected)
- `POST /subscribe` - Subscribe (protected)
- `POST /cancel` - Cancel (protected)
- `POST /webhook` - Stripe webhook (public)

## Testing

```bash
# Health check
curl http://localhost:5000/health

# Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123",
    "gender": "male"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123"
  }'
```

## Project Structure

```
omega-backend/
├── config/              # Database & Redis config
├── controllers/         # Business logic
├── middleware/          # Auth, validation, errors
├── models/              # MongoDB schemas
├── routes/              # API routes
├── utils/               # Helper functions
├── server.js            # Main entry point
├── package.json         # Dependencies
└── .env                 # Configuration
```

## Tech Stack

- **Runtime**: Node.js with ES6 modules
- **Framework**: Express.js
- **Database**: MongoDB + Mongoose
- **Auth**: JWT + bcrypt
- **Real-time**: Socket.io
- **Caching**: Redis (optional)
- **Payments**: Stripe
- **Security**: Helmet + CORS

## Password Security

Passwords are automatically hashed using bcrypt with 10 salt rounds:

- Plain text password is never stored
- Hashing happens automatically on user creation and password updates
- See `models/User.js` for implementation

## License

ISC
