import connectDB from './db';
import User from '@/models/User';

/**
 * Get user data from MongoDB by Auth0 ID
 */
export async function getUserData(auth0Id) {
  try {
    await connectDB();
    const user = await User.findOne({ auth0Id });
    return user ? JSON.parse(JSON.stringify(user)) : null;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

/**
 * Create or update user in MongoDB
 */
export async function saveUserData(auth0Id, userData) {
  try {
    await connectDB();
    
    const user = await User.findOneAndUpdate(
      { auth0Id },
      { ...userData, auth0Id },
      { upsert: true, new: true, runValidators: true }
    );
    
    return JSON.parse(JSON.stringify(user));
  } catch (error) {
    console.error('Error saving user:', error);
    throw error;
  }
}

/**
 * Check if user has completed onboarding
 */
export async function hasCompletedOnboarding(auth0Id) {
  try {
    await connectDB();
    const user = await User.findOne({ auth0Id });
    return user?.onboardingCompleted || false;
  } catch (error) {
    console.error('Error checking onboarding:', error);
    return false;
  }
}

/**
 * Get user by email
 */
export async function getUserByEmail(email) {
  try {
    await connectDB();
    const user = await User.findOne({ email });
    return user ? JSON.parse(JSON.stringify(user)) : null;
  } catch (error) {
    console.error('Error fetching user by email:', error);
    return null;
  }
}
