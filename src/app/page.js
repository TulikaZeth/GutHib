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
        <h1 className="main-title">GutHib</h1>
        
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
              <p className="action-text" style={{ marginBottom: '2.5rem' }}>
                FIND GITHUB ISSUES THAT MATCH YOUR SKILLS
              </p>
              
              {/* Developer Section */}
              <div style={{ marginBottom: '2.5rem' }}>
                <h3 style={{ 
                  color: '#fff', 
                  fontSize: '0.875rem', 
                  fontWeight: 'bold', 
                  letterSpacing: '2px', 
                  marginBottom: '1rem',
                  textAlign: 'center',
                  fontFamily: "'Courier New', monospace"
                }}>
                  FOR DEVELOPERS
                </h3>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <Link href="/auth/signin" className="nav-button" style={{ flex: 1, textAlign: 'center' }}>
                    SIGN IN
                  </Link>
                  <Link href="/auth/register" className="nav-button" style={{ flex: 1, textAlign: 'center', background: '#000', color: '#fff', border: '2px solid #fff', borderLeft: '4px solid #fff', borderBottom: '4px solid #fff' }}>
                    REGISTER
                  </Link>
                </div>
              </div>

              {/* Divider */}
              <div style={{ 
                height: '2px', 
                background: '#fff', 
                margin: '2rem 0',
                opacity: 0.3
              }} />

              {/* Organization Section */}
              <div>
                <h3 style={{ 
                  color: '#fff', 
                  fontSize: '0.875rem', 
                  fontWeight: 'bold', 
                  letterSpacing: '2px', 
                  marginBottom: '1rem',
                  textAlign: 'center',
                  fontFamily: "'Courier New', monospace"
                }}>
                  FOR ORGANIZATIONS
                </h3>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <Link href="/org/auth/signin" className="nav-button" style={{ 
                    flex: 1, 
                    textAlign: 'center',
                    background: '#fff',
                    color: '#000',
                    border: '2px solid #000',
                    borderLeft: '4px solid #000',
                    borderBottom: '4px solid #000'
                  }}>
                    ORG <br/> SIGN IN
                  </Link>
                  <Link href="/org/auth/register" className="nav-button" style={{ 
                    flex: 1, 
                    textAlign: 'center',
                    background: '#fff',
                    color: '#000',
                    border: '2px solid #000',
                    borderLeft: '4px solid #000',
                    borderBottom: '4px solid #000'
                  }}>
                    ORG REGISTER
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}