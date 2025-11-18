# Omega Connect - Setup Instructions

## Current Issue: MongoDB Not Running

You're seeing this error:
```
Error connecting to MongoDB: connect ECONNREFUSED ::1:27017
```

This means MongoDB is not running on your computer.

## Solution: Choose One Option

### Option 1: Use MongoDB Atlas (Cloud) - RECOMMENDED ✅

No installation needed! Use MongoDB's free cloud database.

#### Steps:

1. **Go to MongoDB Atlas**
   - Visit: https://www.mongodb.com/cloud/atlas/register
   - Sign up for a free account (no credit card required)

2. **Create a Free Cluster**
   - Click "Build a Database"
   - Choose "FREE" (M0 Sandbox)
   - Select a cloud provider (AWS recommended)
   - Choose a region close to you
   - Click "Create Cluster"

3. **Create Database User**
   - Go to "Database Access" in left menu
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Username: `omegauser`
   - Password: Create a strong password (save it!)
   - User Privileges: "Read and write to any database"
   - Click "Add User"

4. **Whitelist Your IP Address**
   - Go to "Network Access" in left menu
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (for development)
   - Click "Confirm"

5. **Get Connection String**
   - Go back to "Database" in left menu
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string (looks like this):
   ```
   mongodb+srv://omegauser:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

6. **Update Your .env File**
   - Replace `<password>` with your actual password
   - Update your `.env`:
   ```env
   MONGODB_URI=mongodb+srv://omegauser:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/omega-connect?retryWrites=true&w=majority
   ```

7. **Restart Your Server**
   ```bash
   npm run dev
   ```

   You should see:
   ```
   MongoDB Connected: cluster0-shard-00-00.xxxxx.mongodb.net
   ```

---

### Option 2: Install MongoDB Locally

If you want to run MongoDB on your computer:

#### Windows:

1. **Download MongoDB**
   - Go to: https://www.mongodb.com/try/download/community
   - Select: Windows x64
   - Download the MSI installer

2. **Install MongoDB**
   - Run the installer
   - Choose "Complete" installation
   - Install as a Service (check the box)
   - Install MongoDB Compass (optional GUI)

3. **Verify Installation**
   - Open Command Prompt
   - Run:
   ```bash
   mongod --version
   ```

4. **Start MongoDB Service**
   ```bash
   net start MongoDB
   ```

5. **Update .env** (if needed)
   ```env
   MONGODB_URI=mongodb://localhost:27017/omega-connect
   ```

6. **Restart Your Server**
   ```bash
   npm run dev
   ```

#### Mac:

1. **Install with Homebrew**
   ```bash
   brew tap mongodb/brew
   brew install mongodb-community
   ```

2. **Start MongoDB**
   ```bash
   brew services start mongodb-community
   ```

3. **Restart Your Server**
   ```bash
   npm run dev
   ```

#### Linux (Ubuntu/Debian):

1. **Install MongoDB**
   ```bash
   sudo apt-get update
   sudo apt-get install -y mongodb
   ```

2. **Start MongoDB**
   ```bash
   sudo systemctl start mongodb
   sudo systemctl enable mongodb
   ```

3. **Restart Your Server**
   ```bash
   npm run dev
   ```

---

## Complete .env Configuration

Create/update your `.env` file with this content:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database - Update with your MongoDB connection string
MONGODB_URI=mongodb://localhost:27017/omega-connect
# OR for Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/omega-connect

# JWT Secret
JWT_SECRET=omega_connect_super_secret_key_change_in_production_2024
JWT_EXPIRE=7d

# Redis (Optional - Keep disabled for now)
REDIS_ENABLED=false
REDIS_HOST=localhost
REDIS_PORT=6379

# Stripe (Get from dashboard.stripe.com)
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# CORS
CLIENT_URL=http://localhost:3000

# Subscription Plans
FREE_SWIPES_PER_WEEK=10
```

---

## Quick Start Checklist

- [ ] MongoDB is running (Atlas or local)
- [ ] `.env` file is created with correct MongoDB URI
- [ ] Dependencies are installed (`npm install`)
- [ ] Server starts without errors (`npm run dev`)

---

## Expected Success Output

When everything is working, you should see:

```
Redis is disabled - running without cache
MongoDB Connected: localhost (or your Atlas cluster)
Server is running on port 5000
Environment: development
Socket.io is ready for WebRTC signaling
```

---

## Troubleshooting

### Still getting connection errors?

1. **Check MongoDB is running**
   - Local: `mongod --version` or check Task Manager/Activity Monitor
   - Atlas: Check your cluster is "Active" in Atlas dashboard

2. **Check .env file exists**
   - Make sure `.env` is in the root directory
   - No typos in `MONGODB_URI`

3. **Check connection string**
   - Local: `mongodb://localhost:27017/omega-connect`
   - Atlas: Must include username, password, and cluster address

4. **Firewall issues (Atlas)**
   - Make sure your IP is whitelisted in Network Access
   - Try "Allow Access from Anywhere" (0.0.0.0/0)

### Test MongoDB Connection

You can test if MongoDB is reachable:

```bash
# For local MongoDB
mongosh mongodb://localhost:27017/omega-connect

# For Atlas (replace with your connection string)
mongosh "mongodb+srv://username:password@cluster.mongodb.net/omega-connect"
```

---

## What's Working

✅ **Redis issue is fixed** - No more Redis connection spam
✅ **Password hashing** - Automatic bcrypt hashing
✅ **ES6 modules** - All imports working correctly
✅ **Code formatting** - Properly formatted

## What Needs Setup

⚠️ **MongoDB** - Need to set up local or Atlas database

---

## Recommended: Use MongoDB Atlas

**Why?**
- ✅ Free forever (512MB)
- ✅ No installation needed
- ✅ Works from anywhere
- ✅ Automatic backups
- ✅ Easy to use
- ✅ Production-ready

---

## Need Help?

1. **MongoDB Atlas Tutorial**: https://www.mongodb.com/basics/get-started
2. **Local MongoDB Docs**: https://docs.mongodb.com/manual/installation/
3. **Connection String Format**: https://docs.mongodb.com/manual/reference/connection-string/

---

**Once MongoDB is set up, your backend will be fully operational!** 🚀

