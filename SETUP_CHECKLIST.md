# ⚡ Quick Setup Checklist

## Before You Start

Make sure you have your `.env.local` file with **MONGODB_URI** added!

```env
# Add this to your existing .env.local:
MONGODB_URI=mongodb://localhost:27017/guthub
# OR for Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/guthub
```

## 🚀 Step-by-Step Setup

### ✅ Step 1: Verify Dependencies
```bash
npm install --legacy-peer-deps
```

**Installed packages:**
- ✅ mongoose (MongoDB ODM)
- ✅ jsonwebtoken (JWT tokens)
- ✅ @auth0/nextjs-auth0 (Auth0 integration)
- ✅ dotenv (environment variables)

---

### ✅ Step 2: Test MongoDB Connection
```bash
npm run test:mongo
```

**Expected output:**
```
✅ SUCCESS! MongoDB connected successfully!
✅ Test document created
✅ All tests passed!
```

**If it fails:**
- Check if MongoDB is running (local setup)
- Verify MONGODB_URI in .env.local
- See MONGODB_SETUP.md for detailed help

---

### ✅ Step 3: Start Development Server
```bash
npm run dev
```

Visit: http://localhost:3000

---

### ✅ Step 4: Test User Registration Flow

1. **Go to homepage** → http://localhost:3000
2. **Click "REGISTER"** button
3. **Complete Auth0 signup**
4. **User automatically created in MongoDB** ✨
5. **Redirected to onboarding**
6. **Fill out onboarding form**
7. **User data saved to MongoDB**

---

### ✅ Step 5: Verify User in MongoDB

**Option A: MongoDB Compass (GUI)**
1. Open MongoDB Compass
2. Connect with your MONGODB_URI
3. Browse: `guthub` database → `users` collection
4. You should see your user!

**Option B: Command Line**
```bash
mongosh "your-mongodb-uri"
use guthub
db.users.find().pretty()
```

**Option C: VS Code Extension**
1. Install "MongoDB for VS Code"
2. Connect and browse collections

---

### ✅ Step 6: Test JWT Token System

1. **Sign in** (if not already signed in)
2. **Go to** http://localhost:3000/demo
3. **Click "GENERATE TOKEN"**
4. **See JWT token** displayed
5. **Click "FETCH PROTECTED DATA"**
6. **See API response** with your user data

---

## 🎯 What Should Work Now

### Authentication Flow
- [ ] Sign in page loads (`/auth/signin`)
- [ ] Register page loads (`/auth/register`)
- [ ] Auth0 login works
- [ ] User created in MongoDB after signup
- [ ] Redirect to onboarding for new users
- [ ] Onboarding saves to MongoDB
- [ ] Redirect to home after onboarding
- [ ] Logout works

### Database Operations
- [ ] MongoDB connection successful
- [ ] User created automatically on signup
- [ ] User data updated on onboarding
- [ ] Can view users in MongoDB
- [ ] Indexes created automatically

### JWT System
- [ ] Token generation works (`/api/auth/token`)
- [ ] Protected API accessible with token
- [ ] Demo page shows token flow (`/demo`)
- [ ] Middleware verifies tokens

### UI/UX
- [ ] Dark theme (black & white)
- [ ] Bold left & bottom borders
- [ ] No border radius anywhere
- [ ] Monospace font (Courier New)
- [ ] Hover effects work
- [ ] Responsive design

---

## 📊 User Schema in MongoDB

When a user is created, they get this structure:

```javascript
{
  _id: ObjectId("..."),
  auth0Id: "auth0|...",           // Links to Auth0
  name: "User Name",
  email: "user@example.com",
  githubUsername: "username",
  githubUrl: "https://github.com/username",
  plan: "FREE",
  onboardingCompleted: false,     // Changes to true after onboarding
  isActive: true,
  
  // After onboarding:
  techStack: {
    languages: ["JavaScript", "Python"],
    frameworks: ["React", "Node.js"],
    tools: [],
    libraries: [],
    databases: [],
    cloudPlatforms: []
  },
  preferredIssues: ["Bug Fixes", "Frontend"],
  totalExperience: 3,
  confidenceLevel: "medium",
  
  createdAt: ISODate("..."),
  updatedAt: ISODate("..."),
}
```

---

## 🔧 Useful Commands

```bash
# Test MongoDB connection
npm run test:mongo

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Generate new Auth0 secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🐛 Common Issues & Solutions

### Issue: "Module not found: @/lib/auth0"
**Solution:** File created at `src/lib/auth0.js` ✅

### Issue: "Cannot connect to MongoDB"
**Solutions:**
1. Check if MongoDB is running: `mongod` (local)
2. Verify MONGODB_URI in .env.local
3. Test connection: `npm run test:mongo`
4. Check network access (Atlas users)

### Issue: "User not created after signup"
**Solutions:**
1. Check browser console for errors
2. Check terminal console for MongoDB errors
3. Verify Auth0 callback URL is correct
4. Run: `npm run test:mongo` to verify DB connection

### Issue: Build errors
**Solutions:**
```bash
# Clear cache and reinstall
rm -rf .next node_modules
npm install --legacy-peer-deps
npm run dev
```

---

## 📚 Documentation Files

- **IMPLEMENTATION_SUMMARY.md** - Complete overview of what's implemented
- **MONGODB_SETUP.md** - Detailed MongoDB setup guide
- **AUTH_README.md** - Authentication system documentation
- **QUICK_START.md** - Quick start guide
- **.env.local.example** - Environment variables template

---

## 🎉 Success Criteria

Your setup is complete when:
- ✅ `npm run test:mongo` shows success
- ✅ Dev server starts without errors
- ✅ Can sign up through Auth0
- ✅ User appears in MongoDB after signup
- ✅ Onboarding form works
- ✅ Can generate JWT tokens
- ✅ Dark theme displays correctly

---

## 🚀 Next Steps After Setup

1. **Customize the User Model**
   - Edit `src/models/User.js`
   - Add more fields as needed

2. **Add More API Routes**
   - Create endpoints in `src/app/api/`
   - Use the User model to query data

3. **Build Features**
   - User dashboard
   - Issue matching system
   - Profile editing
   - Premium features

4. **Deploy to Production**
   - Use MongoDB Atlas (free tier)
   - Set environment variables on host
   - Configure Auth0 for production domain

---

## 📞 Need Help?

Check these files:
1. **IMPLEMENTATION_SUMMARY.md** - Full overview
2. **MONGODB_SETUP.md** - MongoDB help
3. **Troubleshooting section** in each guide

---

**Ready to go! 🚀**

Start with: `npm run test:mongo` then `npm run dev`
