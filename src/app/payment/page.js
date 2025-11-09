'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import StripePaymentForm from '@/components/StripePaymentForm';

// Initialize Stripe (use test key for demo)
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_51QGk6FRpCVLqjMHpQiYt1ZwxMYzHZBavdPGOGCVQWjkHOUkMT1pQXQ5K0lVdJuYs0WJhBKdJoTRMGzrb8NEd1SFL00wYZIf41E');

export default function PaymentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentData, setPaymentData] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    // Get payment session data from URL params
    const session = searchParams.get('session');
    const token = searchParams.get('token');
    const successUrl = searchParams.get('success_url');
    const cancelUrl = searchParams.get('cancel_url');

    if (!session || !token) {
      setError('Invalid payment session');
      setLoading(false);
      return;
    }

    setPaymentData({
      session,
      token,
      successUrl: decodeURIComponent(successUrl || ''),
      cancelUrl: decodeURIComponent(cancelUrl || ''),
    });
    setLoading(false);
  }, [searchParams]);

  const handlePayment = async (method) => {
    setProcessing(true);
    setError('');

    try {
      // For non-Stripe methods, simulate payment processing
      if (method !== 'stripe') {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      // Redirect to success URL
      if (paymentData?.successUrl) {
        window.location.href = paymentData.successUrl;
      } else {
        router.push('/org/dashboard');
      }
    } catch (err) {
      setError('Payment failed. Please try again.');
      setProcessing(false);
    }
  };

  const handleStripeSuccess = (paymentMethod) => {
    console.log('Stripe payment successful:', paymentMethod);
    // Redirect to success URL
    if (paymentData?.successUrl) {
      window.location.href = paymentData.successUrl;
    } else {
      router.push('/org/dashboard');
    }
  };

  const handleStripeError = (error) => {
    setError(error.message || 'Payment failed. Please try again.');
    setProcessing(false);
  };

  const handleCancel = () => {
    if (paymentData?.cancelUrl) {
      window.location.href = paymentData.cancelUrl;
    } else {
      router.push('/org/auth/register');
    }
  };

  if (loading && !paymentData) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}>
        <div style={{
          textAlign: 'center',
          fontFamily: "'Courier New', monospace",
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid #000000',
            borderTop: '4px solid transparent',
            borderRadius: '50%',
            margin: '0 auto 2rem',
            animation: 'spin 1s linear infinite',
          }} />
          <style jsx>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
          <p style={{ color: '#666666', letterSpacing: '2px' }}>LOADING PAYMENT...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '700px',
        padding: '3rem',
        background: '#ffffff',
        border: '2px solid #000000',
        borderLeft: '6px solid #000000',
        borderBottom: '6px solid #000000',
      }}>
        <h1 style={{
          color: '#000000',
          fontSize: '2rem',
          fontWeight: 900,
          letterSpacing: '2px',
          marginBottom: '2rem',
          fontFamily: "'Courier New', monospace",
          textAlign: 'center',
        }}>
          💳 PAYMENT
        </h1>

        {error && (
          <div style={{
            padding: '1rem',
            marginBottom: '2rem',
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
            fontSize: '2.5rem',
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

        {!selectedMethod ? (
          <>
            <div style={{
              padding: '1.5rem',
              background: '#f5f5f5',
              border: '2px solid #000000',
              marginBottom: '2rem',
            }}>
              <p style={{
                fontSize: '0.875rem',
                color: '#000000',
                fontFamily: "'Courier New', monospace",
                textAlign: 'center',
                lineHeight: '1.6',
                fontWeight: 'bold',
                marginBottom: '0.5rem',
              }}>
                🔒 POWERED BY UNIBEE
              </p>
              <p style={{
                fontSize: '0.75rem',
                color: '#666666',
                fontFamily: "'Courier New', monospace",
                textAlign: 'center',
                lineHeight: '1.6',
              }}>
                Choose your preferred payment method below.<br />
                All transactions are secure and encrypted.
              </p>
            </div>

            <h2 style={{
              fontSize: '1rem',
              fontWeight: 'bold',
              letterSpacing: '1px',
              marginBottom: '1.5rem',
              fontFamily: "'Courier New', monospace",
              color: '#000000',
            }}>
              SELECT PAYMENT METHOD
            </h2>

            {/* Stripe Payment Option */}
            <button
              onClick={() => setSelectedMethod('stripe')}
              style={{
                width: '100%',
                padding: '1.5rem',
                marginBottom: '1rem',
                background: '#ffffff',
                border: '2px solid #000000',
                borderLeft: '4px solid #635BFF',
                borderBottom: '4px solid #000000',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateX(4px)';
                e.currentTarget.style.background = '#f8f8ff';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateX(0)';
                e.currentTarget.style.background = '#ffffff';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  background: '#635BFF',
                  border: '2px solid #000000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                }}>
                  💳
                </div>
                <div style={{ textAlign: 'left' }}>
                  <p style={{
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    fontFamily: "'Courier New', monospace",
                    color: '#000000',
                    marginBottom: '0.25rem',
                  }}>
                    STRIPE
                  </p>
                  <p style={{
                    fontSize: '0.75rem',
                    fontFamily: "'Courier New', monospace",
                    color: '#666666',
                  }}>
                    Credit/Debit Cards • Apple Pay • Google Pay
                  </p>
                </div>
              </div>
              <span style={{
                fontSize: '1.5rem',
                color: '#000000',
              }}>→</span>
            </button>

            {/* PayPal Payment Option */}
            <button
              onClick={() => setSelectedMethod('paypal')}
              style={{
                width: '100%',
                padding: '1.5rem',
                marginBottom: '1rem',
                background: '#ffffff',
                border: '2px solid #000000',
                borderLeft: '4px solid #0070BA',
                borderBottom: '4px solid #000000',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateX(4px)';
                e.currentTarget.style.background = '#f0f8ff';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateX(0)';
                e.currentTarget.style.background = '#ffffff';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  background: '#0070BA',
                  border: '2px solid #000000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                }}>
                  💰
                </div>
                <div style={{ textAlign: 'left' }}>
                  <p style={{
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    fontFamily: "'Courier New', monospace",
                    color: '#000000',
                    marginBottom: '0.25rem',
                  }}>
                    PAYPAL
                  </p>
                  <p style={{
                    fontSize: '0.75rem',
                    fontFamily: "'Courier New', monospace",
                    color: '#666666',
                  }}>
                    Pay with your PayPal account
                  </p>
                </div>
              </div>
              <span style={{
                fontSize: '1.5rem',
                color: '#000000',
              }}>→</span>
            </button>

            {/* Bank Transfer Option */}
            <button
              onClick={() => setSelectedMethod('bank')}
              style={{
                width: '100%',
                padding: '1.5rem',
                marginBottom: '2rem',
                background: '#ffffff',
                border: '2px solid #000000',
                borderLeft: '4px solid #00A86B',
                borderBottom: '4px solid #000000',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateX(4px)';
                e.currentTarget.style.background = '#f0fff8';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateX(0)';
                e.currentTarget.style.background = '#ffffff';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  background: '#00A86B',
                  border: '2px solid #000000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                }}>
                  🏦
                </div>
                <div style={{ textAlign: 'left' }}>
                  <p style={{
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    fontFamily: "'Courier New', monospace",
                    color: '#000000',
                    marginBottom: '0.25rem',
                  }}>
                    BANK TRANSFER
                  </p>
                  <p style={{
                    fontSize: '0.75rem',
                    fontFamily: "'Courier New', monospace",
                    color: '#666666',
                  }}>
                    Direct bank transfer • ACH
                  </p>
                </div>
              </div>
              <span style={{
                fontSize: '1.5rem',
                color: '#000000',
              }}>→</span>
            </button>

            <button
              onClick={handleCancel}
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
                cursor: 'pointer',
              }}
            >
              ← BACK
            </button>
          </>
        ) : (
          <>
            {/* Payment Method Selected - Show Payment Form */}
            <div style={{
              padding: '1.5rem',
              background: selectedMethod === 'stripe' ? '#f8f8ff' : 
                          selectedMethod === 'paypal' ? '#f0f8ff' : '#f0fff8',
              border: '2px solid #000000',
              marginBottom: '2rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: selectedMethod === 'stripe' ? '#635BFF' :
                             selectedMethod === 'paypal' ? '#0070BA' : '#00A86B',
                  border: '2px solid #000000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                }}>
                  {selectedMethod === 'stripe' ? '💳' : selectedMethod === 'paypal' ? '💰' : '🏦'}
                </div>
                <p style={{
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  fontFamily: "'Courier New', monospace",
                  color: '#000000',
                  textTransform: 'uppercase',
                }}>
                  {selectedMethod} PAYMENT
                </p>
              </div>
              <p style={{
                fontSize: '0.75rem',
                color: '#666666',
                fontFamily: "'Courier New', monospace",
                lineHeight: '1.6',
              }}>
                {selectedMethod === 'stripe' && '✓ Secure payment processing via Stripe through UniBee'}
                {selectedMethod === 'paypal' && '✓ You will be redirected to PayPal to complete payment'}
                {selectedMethod === 'bank' && '✓ Secure bank transfer via UniBee payment gateway'}
              </p>
            </div>

            {/* Show Stripe Payment Form */}
            {selectedMethod === 'stripe' ? (
              <Elements stripe={stripePromise}>
                <StripePaymentForm
                  onSuccess={handleStripeSuccess}
                  onError={handleStripeError}
                  processing={processing}
                  setProcessing={setProcessing}
                />
              </Elements>
            ) : (
              <>
                {/* For other payment methods, show demo mode message */}
                <div style={{
                  padding: '1.5rem',
                  background: '#fffaf0',
                  border: '2px solid #000000',
                  marginBottom: '2rem',
                }}>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#666666',
                    fontFamily: "'Courier New', monospace",
                    textAlign: 'center',
                    lineHeight: '1.6',
                  }}>
                    ⚠️ Demo Mode: Click "Complete Payment" to simulate<br />
                    a successful {selectedMethod.toUpperCase()} payment transaction.
                  </p>
                </div>

                <button
                  onClick={() => handlePayment(selectedMethod)}
                  disabled={processing}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    background: processing ? '#999999' : '#000000',
                    color: '#ffffff',
                    border: '2px solid #ffffff',
                    borderLeft: '4px solid #ffffff',
                    borderBottom: '4px solid #ffffff',
                    fontFamily: "'Courier New', monospace",
                    fontSize: '0.875rem',
                    fontWeight: 'bold',
                    letterSpacing: '2px',
                    cursor: processing ? 'not-allowed' : 'pointer',
                    marginBottom: '1rem',
                  }}
                >
                  {processing ? 'PROCESSING PAYMENT...' : `COMPLETE PAYMENT WITH ${selectedMethod.toUpperCase()}`}
                </button>
              </>
            )}

            <button
              onClick={() => setSelectedMethod(null)}
              disabled={processing}
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
                cursor: processing ? 'not-allowed' : 'pointer',
              }}
            >
              ← CHANGE PAYMENT METHOD
            </button>
          </>
        )}

        <p style={{
          marginTop: '2rem',
          fontSize: '0.75rem',
          color: '#999999',
          fontFamily: "'Courier New', monospace",
          textAlign: 'center',
        }}>
          Session: {paymentData?.session?.substring(0, 20)}...
        </p>
      </div>
    </div>
  );
}
