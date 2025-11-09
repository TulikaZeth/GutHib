'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function OrgRegisterPage() {
  const [step, setStep] = useState(1); // 1: form, 2: payment
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    orgName: '',
    githubOrgName: '',
    description: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setError('');
    // Move to payment step
    setStep(2);
  };

  const handlePayment = async () => {
    setLoading(true);
    setError('');

    try {
      // Create checkout session
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: "org_subscription",
          email: formData.email,
          success_url: `${window.location.origin}/org/auth/register/complete?data=${encodeURIComponent(JSON.stringify(formData))}`,
          cancel_url: `${window.location.origin}/org/auth/register`,
        }),
      });

      const data = await res.json();
      
      if (data.url) {
        // Redirect to payment page
        window.location.href = data.url;
      } else {
        setError('Failed to create payment session');
        setLoading(false);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep(1);
    setError('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      marginTop: '2rem',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '500px',
      }}>
        {/* Header */}
        <div style={{
          marginBottom: '2rem',
          textAlign: 'center',
        }}>
         
          <p style={{
            color: '#666666',
            fontSize: '1rem',
            letterSpacing: '2px',
            fontFamily: "'Courier New', monospace",
          }}>
            ORGANIZATION REGISTRATION
          </p>
        </div>

        {/* Form Container */}
        <div style={{
          padding: '2.5rem',
          background: '#ffffff',
          border: '2px solid #000000',
          borderLeft: '6px solid #000000',
          borderBottom: '6px solid #000000',
        }}>
          {step === 1 ? (
            // STEP 1: Registration Form
            <form onSubmit={handleFormSubmit}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                color: '#000000',
                fontSize: '0.875rem',
                fontWeight: 'bold',
                letterSpacing: '1px',
                marginBottom: '0.5rem',
                fontFamily: "'Courier New', monospace",
              }}>
                ORGANIZATION NAME
              </label>
              <input
                type="text"
                value={formData.orgName}
                onChange={(e) => setFormData({ ...formData, orgName: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  background: '#ffffff',
                  color: '#000000',
                  border: '2px solid #000000',
                  borderLeft: '4px solid #000000',
                  borderBottom: '4px solid #000000',
                  fontSize: '1rem',
                  fontFamily: "'Courier New', monospace",
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                color: '#000000',
                fontSize: '0.875rem',
                fontWeight: 'bold',
                letterSpacing: '1px',
                marginBottom: '0.5rem',
                fontFamily: "'Courier New', monospace",
              }}>
                GITHUB ORGANIZATION NAME (OPTIONAL)
              </label>
              <input
                type="text"
                value={formData.githubOrgName}
                onChange={(e) => setFormData({ ...formData, githubOrgName: e.target.value })}
                placeholder="e.g., facebook, google, or any custom name"
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  background: '#ffffff',
                  color: '#000000',
                  border: '2px solid #000000',
                  borderLeft: '4px solid #000000',
                  borderBottom: '4px solid #000000',
                  fontSize: '1rem',
                  fontFamily: "'Courier New', monospace",
                  outline: 'none',
                }}
              />
              <p style={{
                marginTop: '0.5rem',
                fontSize: '0.75rem',
                color: '#666666',
                fontFamily: "'Courier New', monospace",
                letterSpacing: '0.5px',
              }}>
                Can be a real GitHub org or any custom name
              </p>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                color: '#000000',
                fontSize: '0.875rem',
                fontWeight: 'bold',
                letterSpacing: '1px',
                marginBottom: '0.5rem',
                fontFamily: "'Courier New', monospace",
              }}>
                EMAIL
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  background: '#ffffff',
                  color: '#000000',
                  border: '2px solid #000000',
                  borderLeft: '4px solid #000000',
                  borderBottom: '4px solid #000000',
                  fontSize: '1rem',
                  fontFamily: "'Courier New', monospace",
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                color: '#000000',
                fontSize: '0.875rem',
                fontWeight: 'bold',
                letterSpacing: '1px',
                marginBottom: '0.5rem',
                fontFamily: "'Courier New', monospace",
              }}>
                PASSWORD
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  background: '#ffffff',
                  color: '#000000',
                  border: '2px solid #000000',
                  borderLeft: '4px solid #000000',
                  borderBottom: '4px solid #000000',
                  fontSize: '1rem',
                  fontFamily: "'Courier New', monospace",
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={{
                display: 'block',
                color: '#000000',
                fontSize: '0.875rem',
                fontWeight: 'bold',
                letterSpacing: '1px',
                marginBottom: '0.5rem',
                fontFamily: "'Courier New', monospace",
              }}>
                DESCRIPTION (OPTIONAL)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  background: '#ffffff',
                  color: '#000000',
                  border: '2px solid #000000',
                  borderLeft: '4px solid #000000',
                  borderBottom: '4px solid #000000',
                  fontSize: '1rem',
                  fontFamily: "'Courier New', monospace",
                  outline: 'none',
                  resize: 'vertical',
                }}
              />
            </div>

            {error && (
              <div style={{
                padding: '1rem',
                marginBottom: '1.5rem',
                background: '#000000',
                color: '#ffffff',
                border: '2px solid #ffffff',
                fontFamily: "'Courier New', monospace",
                fontSize: '0.875rem',
                fontWeight: 'bold',
                letterSpacing: '0.5px',
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '1rem',
                background: loading ? '#999999' : '#000000',
                color: '#ffffff',
                border: '2px solid #ffffff',
                borderLeft: '4px solid #ffffff',
                borderBottom: '4px solid #ffffff',
                fontFamily: "'Courier New', monospace",
                fontSize: '0.875rem',
                fontWeight: 'bold',
                letterSpacing: '2px',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              CONTINUE TO PAYMENT
            </button>
          </form>
          ) : (
            // STEP 2: Payment
            <div>
              <div style={{
                padding: '1.5rem',
                background: '#f5f5f5',
                border: '2px solid #000000',
                marginBottom: '2rem',
              }}>
                <h3 style={{
                  color: '#000000',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  letterSpacing: '1.5px',
                  marginBottom: '1rem',
                  fontFamily: "'Courier New', monospace",
                }}>
                  📋 REGISTRATION DETAILS
                </h3>
                <div style={{
                  fontSize: '0.875rem',
                  fontFamily: "'Courier New', monospace",
                  color: '#666666',
                }}>
                  <p style={{ marginBottom: '0.5rem' }}>
                    <strong>Organization:</strong> {formData.orgName}
                  </p>
                  <p style={{ marginBottom: '0.5rem' }}>
                    <strong>Email:</strong> {formData.email}
                  </p>
                  {formData.githubOrgName && (
                    <p style={{ marginBottom: '0.5rem' }}>
                      <strong>GitHub Org:</strong> {formData.githubOrgName}
                    </p>
                  )}
                </div>
              </div>

              <div style={{
                padding: '2rem',
                background: '#000000',
                color: '#ffffff',
                border: '2px solid #ffffff',
                marginBottom: '2rem',
                textAlign: 'center',
              }}>
                <p style={{
                  fontSize: '0.875rem',
                  letterSpacing: '1px',
                  marginBottom: '0.5rem',
                  fontFamily: "'Courier New', monospace",
                }}>
                  SUBSCRIPTION PLAN
                </p>
                <p style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  marginBottom: '0.5rem',
                  fontFamily: "'Courier New', monospace",
                }}>
                  $49/month
                </p>
                <p style={{
                  fontSize: '0.75rem',
                  opacity: 0.8,
                  fontFamily: "'Courier New', monospace",
                }}>
                  AI-Powered Issue Assignment • Unlimited Repos • Advanced Analytics
                </p>
              </div>

              {error && (
                <div style={{
                  padding: '1rem',
                  marginBottom: '1.5rem',
                  background: '#ff4444',
                  color: '#ffffff',
                  border: '2px solid #ffffff',
                  fontFamily: "'Courier New', monospace",
                  fontSize: '0.875rem',
                  fontWeight: 'bold',
                  letterSpacing: '0.5px',
                }}>
                  {error}
                </div>
              )}

              <button
                onClick={handlePayment}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: loading ? '#999999' : '#000000',
                  color: '#ffffff',
                  border: '2px solid #ffffff',
                  borderLeft: '4px solid #ffffff',
                  borderBottom: '4px solid #ffffff',
                  fontFamily: "'Courier New', monospace",
                  fontSize: '0.875rem',
                  fontWeight: 'bold',
                  letterSpacing: '2px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  marginBottom: '1rem',
                }}
              >
                {loading ? 'REDIRECTING TO PAYMENT...' : 'PROCEED TO PAYMENT'}
              </button>

              <button
                onClick={handleBack}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: '#ffffff',
                  color: '#000000',
                  border: '2px solid #000000',
                  borderLeft: '4px solid #000000',
                  borderBottom: '4px solid #000000',
                  fontFamily: "'Courier New', monospace",
                  fontSize: '0.875rem',
                  fontWeight: 'bold',
                  letterSpacing: '2px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                BACK TO FORM
              </button>
            </div>
          )}

          <div style={{
            marginTop: '1.5rem',
            textAlign: 'center',
          }}>
            <a
              href="/org/auth/signin"
              style={{
                color: '#666666',
                fontSize: '0.875rem',
                letterSpacing: '1px',
                textDecoration: 'underline',
                fontFamily: "'Courier New', monospace",
              }}
            >
              Already have an account? Sign In
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
