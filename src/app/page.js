import { auth0 } from "@/lib/auth0";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import Profile from "@/components/Profile";
import { redirect } from 'next/navigation';
import connectDB from "@/lib/db";
import User from "@/models/User";

export default async function Home() {
  const session = await auth0.getSession();
  const user = session?.user;

  if (user) {
    // Ensure user exists in MongoDB
    await connectDB();
    let dbUser = await User.findOne({ _id: user.sub });
    
    // Check if onboarding is completed
    if (dbUser && !dbUser.onboardingCompleted) {
      redirect('/onboarding');
    }
  }

  return (
    <div className="app-container">
      <div className="main-card-wrapper">
        <h1 className="main-title">GUTHUB</h1>
        
        <div className="action-card">
          {user ? (
            <div className="logged-in-section">
              <p className="logged-in-message">✅ AUTHENTICATED</p>
              <Profile />
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <Link href="/demo" className="nav-button" style={{ flex: 1, textAlign: 'center', textDecoration: 'none', background: '#000', color: '#fff', border: '2px solid #fff', borderLeft: '4px solid #fff', borderBottom: '4px solid #fff' }}>
                  JWT DEMO
                </Link>
              </div>
              <LogoutButton />
            </div>
          ) : (
            <>
              <p className="action-text">
                FIND GITHUB ISSUES THAT MATCH YOUR SKILLS
              </p>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <Link href="/auth/signin" className="nav-button" style={{ flex: 1, textAlign: 'center' }}>
                  SIGN IN
                </Link>
                <Link href="/auth/register" className="nav-button" style={{ flex: 1, textAlign: 'center', background: '#000', color: '#fff', border: '2px solid #fff', borderLeft: '4px solid #fff', borderBottom: '4px solid #fff' }}>
                  REGISTER
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}