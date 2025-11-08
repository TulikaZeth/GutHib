# MongoDB + Auth0 Setup Guide

## 📦 Packages Installed

```bash
npm install mongoose --legacy-peer-deps
npm install jsonwebtoken --legacy-peer-deps
npm install @auth0/nextjs-auth0
```

## 🔧 Environment Variables

Add to your `.env.local`:

```env
# Auth0 Configuration
AUTH0_SECRET=your-secret-key-here
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=https://your-domain.auth0.com
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret

# JWT Configuration (optional, uses AUTH0_SECRET if not set)
JWT_SECRET=your-jwt-secret

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/GutHib
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/GutHib?retryWrites=true&w=majority
```

## 🗄️ MongoDB Setup Options

### Option 1: Local MongoDB

1. **Install MongoDB**
   - Download from: https://www.mongodb.com/try/download/community
   - Or use Docker: `docker run -d -p 27017:27017 --name mongodb mongo`

2. **Start MongoDB**
   ```bash
   mongod
   ```

3. **Use Local Connection String**
   ```env
   MONGODB_URI=mongodb://localhost:27017/GutHib
   ```

### Option 2: MongoDB Atlas (Cloud - FREE)

1. **Create Account**
   - Go to: https://www.mongodb.com/cloud/atlas/register
   - Sign up for free

2. **Create Cluster**
   - Choose "Shared" (FREE tier)
   - Select your region
   - Click "Create Cluster"

3. **Setup Database Access**
   - Go to "Database Access"
   - Click "Add New Database User"
   - Create username and password
   - Set privileges to "Read and write to any database"

4. **Setup Network Access**
   - Go to "Network Access"
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (0.0.0.0/0)
   - Or add your specific IP

5. **Get Connection String**
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with `GutHib`

6. **Add to .env.local**
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/GutHib?retryWrites=true&w=majority
   ```

## 📊 User Model Schema

The application uses the following user schema:

```javascript
{
  // Basic Info
  name: String (required)
  email: String (required, unique)
  githubUsername: String (required)
  githubUrl: String
  resumeUrl: String
  auth0Id: String (unique, for Auth0 linking)
  
  // Subscription
  plan: "FREE" | "PREMIUM" (default: "FREE")
  
  // Resume AI Analysis
  summary: String
  totalExperience: Number (in years)
  confidenceLevel: "low" | "medium" | "high"
  rawTextLength: Number
  
  // Skills (array of objects)
  skills: [{
    name: String
    score: Number
    category: String
    description: String
  }]
  
  // Tech Stack (object)
  techStack: {
    languages: [String]
    frameworks: [String]
    tools: [String]
    libraries: [String]
    databases: [String]
    cloudPlatforms: [String]
  }
  
  // Activity
  lastYearCommits: Number (default: 0)
  isActive: Boolean (default: false)
  workloadScore: Number (0-100, default: 0)
  
  // Preferences
  preferredIssues: [String]
  
  // Relations
  assignedIssues: [ObjectId] (ref: "Issue")
  
  // Meta
  onboardingCompleted: Boolean (default: false)
  createdAt: Date (auto)
  updatedAt: Date (auto)
}
```

## 🔄 User Creation Flow

### Automatic Creation on Signup/Login

1. **User signs up via Auth0**
   - Goes to `/auth/signin` or `/auth/register`
   - Clicks "SIGN IN WITH AUTH0"
   - Completes Auth0 authentication

2. **Callback Handler Triggers**
   - Auth0 redirects to `/api/auth/callback`
   - Custom `afterCallback` function runs
   - User is automatically created in MongoDB with:
     - `auth0Id` from Auth0
     - `name` from Auth0 profile
     - `email` from Auth0 profile
     - `githubUsername` from Auth0 nickname or email
     - Default values for other fields

3. **Home Page Check**
   - After redirect to home page
   - Checks if user exists in MongoDB
   - Creates user if missing (backup check)
   - Redirects to `/onboarding` if not completed

4. **Onboarding Completion**
   - User fills out onboarding form
   - Data saved to MongoDB via `/api/onboarding`
   - User document updated with:
     - `githubUsername`
     - `techStack` (mapped from form)
     - `preferredIssues` (interests)
     - `totalExperience` (from level)
     - `onboardingCompleted: true`

## 🛠️ API Endpoints

### User Management

- **POST /api/users/create** - Manually create user
- **GET /api/users/create** - Get or create current user

### Onboarding

- **POST /api/onboarding** - Save onboarding data
  ```javascript
  {
    githubUsername: "string",
    resume: "filename",
    techStack: ["JavaScript", "React"],
    interests: ["Bug Fixes", "Frontend"],
    level: "intermediate",
    resumeUrl: "https://..."
  }
  ```

### Authentication

- **GET /api/auth/login** - Start Auth0 login
- **GET /api/auth/logout** - Logout
- **GET /api/auth/callback** - Auth0 callback (auto-creates user)
- **GET /api/auth/token** - Generate JWT token

## 🧪 Testing the Setup

### 1. Check MongoDB Connection

Create a test file `test-db.js`:

```javascript
const mongoose = require('mongoose');

const MONGODB_URI = 'your-connection-string';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err);
    process.exit(1);
  });
```

Run: `node test-db.js`

### 2. Test User Creation Flow

1. Start dev server: `npm run dev`
2. Go to `http://localhost:3000`
3. Click "SIGN IN" or "REGISTER"
4. Complete Auth0 authentication
5. Check MongoDB - user should be created automatically
6. Complete onboarding form
7. Check MongoDB - user should be updated

### 3. View Data in MongoDB

**Using MongoDB Compass (GUI):**
1. Download: https://www.mongodb.com/try/download/compass
2. Connect using your MONGODB_URI
3. Browse `GutHib` database
4. View `users` collection

**Using MongoDB Shell:**
```bash
mongosh "your-connection-string"
use GutHib
db.users.find().pretty()
```

**Using VS Code Extension:**
1. Install "MongoDB for VS Code"
2. Connect using your MONGODB_URI
3. Browse collections

## 🐛 Troubleshooting

### Cannot connect to MongoDB
- Check if MongoDB is running (local)
- Verify MONGODB_URI in `.env.local`
- Check network access (Atlas)
- Check username/password (Atlas)

### User not created after signup
- Check browser console for errors
- Check terminal console for MongoDB errors
- Verify Auth0 callback URL is correct
- Check MongoDB connection is working

### Duplicate key error
- User with same email already exists
- Clear database: `db.users.deleteMany({})`
- Or use different email

### Module not found errors
- Run: `npm install --legacy-peer-deps`
- Clear `.next` folder: `rm -rf .next` or `rmdir /s .next`
- Restart dev server

## 📝 Database Indexes

Automatically created indexes:
- `email` (unique)
- `auth0Id` (unique, sparse)
- `githubUsername`

These improve query performance.

## 🔒 Security Notes

1. **Never commit `.env.local`** - Already in `.gitignore`
2. **Use strong MongoDB passwords**
3. **Restrict network access** in production
4. **Use connection string** with authentication
5. **Enable MongoDB SSL/TLS** in production

## 🚀 Production Deployment

When deploying to production:

1. **Use MongoDB Atlas** (recommended)
2. **Set environment variables** on your hosting platform
3. **Enable IP whitelist** for your server
4. **Use connection pooling** (already configured)
5. **Enable MongoDB monitoring**

## 📚 Useful MongoDB Queries

```javascript
// Find all users
db.users.find()

// Find user by email
db.users.findOne({ email: "user@example.com" })

// Find users who completed onboarding
db.users.find({ onboardingCompleted: true })

// Update user's plan
db.users.updateOne(
  { email: "user@example.com" },
  { $set: { plan: "PREMIUM" } }
)

// Delete all users (careful!)
db.users.deleteMany({})

// Count users
db.users.countDocuments()

// Get premium users
db.users.find({ plan: "PREMIUM" })
```

---

**You're all set! 🎉**

Users will automatically be created in MongoDB when they sign up through Auth0!
