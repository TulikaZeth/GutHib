import { getOrgSession } from '@/lib/orgAuth';
import { redirect } from 'next/navigation';
import connectDB from '@/lib/db';
import OrgAccount from '@/models/OrgAccount';

export default async function OrgDashboardPage() {
  const session = await getOrgSession();
  
  if (!session) {
    redirect('/org/auth/signin');
  }

  await connectDB();
  const orgAccount = await OrgAccount.findById(session.orgId);

  if (!orgAccount) {
    redirect('/org/auth/signin');
  }

  return (
    <div style={{
      background: '#ffffff',
      minHeight: '80vh',
    }}>
      <div style={{
        padding: '2rem',
        border: '2px solid #000000',
        borderLeft: '6px solid #000000',
        borderBottom: '6px solid #000000',
        background: '#ffffff',
      }}>
        <h1 style={{
          color: '#000000',
          fontSize: '2.5rem',
          fontWeight: 900,
          letterSpacing: '3px',
          marginBottom: '1rem',
          fontFamily: "'Courier New', monospace",
        }}>
          ORGANIZATION DASHBOARD
        </h1>
        
        <div style={{
          color: '#666666',
          fontSize: '1rem',
          letterSpacing: '1px',
          marginBottom: '2rem',
          fontFamily: "'Courier New', monospace",
        }}>
          Welcome, <strong style={{ color: '#000000' }}>{orgAccount.orgName}</strong>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '2rem',
          marginTop: '3rem',
        }}>
          {/* Repositories Card */}
          <div style={{
            padding: '2rem',
            border: '2px solid #000000',
            borderLeft: '4px solid #000000',
            borderBottom: '4px solid #000000',
            background: '#ffffff',
          }}>
            <h3 style={{
              color: '#000000',
              fontSize: '1.25rem',
              fontWeight: 'bold',
              letterSpacing: '1.5px',
              marginBottom: '1rem',
              fontFamily: "'Courier New', monospace",
            }}>
              REPOSITORIES
            </h3>
            <p style={{
              color: '#000000',
              fontSize: '3rem',
              fontWeight: 900,
              fontFamily: "'Courier New', monospace",
            }}>
              {orgAccount.repositories?.length || 0}
            </p>
            <p style={{
              color: '#666666',
              fontSize: '0.875rem',
              letterSpacing: '1px',
              fontFamily: "'Courier New', monospace",
            }}>
              Tracked Repositories
            </p>
          </div>

          {/* Quick Actions */}
          <div style={{
            padding: '2rem',
            border: '2px solid #000000',
            borderLeft: '4px solid #000000',
            borderBottom: '4px solid #000000',
            background: '#f5f5f5',
          }}>
            <h3 style={{
              color: '#000000',
              fontSize: '1.25rem',
              fontWeight: 'bold',
              letterSpacing: '1.5px',
              marginBottom: '1.5rem',
              fontFamily: "'Courier New', monospace",
            }}>
              QUICK ACTIONS
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <a
                href="/org/dashboard/add-repos"
                style={{
                  padding: '1rem',
                  background: '#000000',
                  color: '#ffffff',
                  textAlign: 'center',
                  textDecoration: 'none',
                  border: '2px solid #ffffff',
                  borderLeft: '4px solid #ffffff',
                  borderBottom: '4px solid #ffffff',
                  fontFamily: "'Courier New', monospace",
                  fontSize: '0.875rem',
                  fontWeight: 'bold',
                  letterSpacing: '1.5px',
                }}
              >
                ADD REPOSITORY
              </a>
              <a
                href="/org/dashboard/create-issue"
                style={{
                  padding: '1rem',
                  background: '#000000',
                  color: '#ffffff',
                  textAlign: 'center',
                  textDecoration: 'none',
                  border: '2px solid #ffffff',
                  borderLeft: '4px solid #ffffff',
                  borderBottom: '4px solid #ffffff',
                  fontFamily: "'Courier New', monospace",
                  fontSize: '0.875rem',
                  fontWeight: 'bold',
                  letterSpacing: '1.5px',
                }}
              >
                CREATE ISSUE
              </a>
              <a
                href="/org/dashboard/repos"
                style={{
                  padding: '1rem',
                  background: '#ffffff',
                  color: '#000000',
                  textAlign: 'center',
                  textDecoration: 'none',
                  border: '2px solid #000000',
                  borderLeft: '4px solid #000000',
                  borderBottom: '4px solid #000000',
                  fontFamily: "'Courier New', monospace",
                  fontSize: '0.875rem',
                  fontWeight: 'bold',
                  letterSpacing: '1.5px',
                }}
              >
                VIEW REPOSITORIES
              </a>
            </div>
          </div>
        </div>

        <div style={{
          marginTop: '3rem',
          padding: '2rem',
          border: '2px solid #000000',
          borderLeft: '4px solid #000000',
          borderBottom: '4px solid #000000',
          background: '#f5f5f5',
        }}>
          <h3 style={{
            color: '#000000',
            fontSize: '1.25rem',
            fontWeight: 'bold',
            letterSpacing: '1.5px',
            marginBottom: '1rem',
            fontFamily: "'Courier New', monospace",
          }}>
            HOW IT WORKS
          </h3>
          <ul style={{
            color: '#000000',
            fontSize: '0.875rem',
            letterSpacing: '0.5px',
            fontFamily: "'Courier New', monospace",
            lineHeight: '2',
            paddingLeft: '1.5rem',
          }}>
            <li><strong>Add Repositories:</strong> Track your GitHub repositories</li>
            <li><strong>Create Issues:</strong> Raise issues on GitHub or from dashboard</li>
            <li><strong>AI Analysis:</strong> System analyzes developer profiles for skill match</li>
            <li><strong>Activity Check:</strong> Evaluates recent GitHub commits</li>
            <li><strong>Smart Assignment:</strong> Assigns to developer with best score (skills + activity + low workload)</li>
            <li><strong>AI Roadmap:</strong> Generates custom roadmap for assigned developer</li>
            <li><strong>Auto Comment:</strong> Posts roadmap as comment on GitHub issue</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
