'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

// Stripe init
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
  'pk_test_51QGk6FRpCVLqjMHpQiYt1ZwxMYzHZBavdPGOGCVQWjkHOUkMT1pQXQ5K0lVdJuYs0WJhBKdJoTRMGzrb8NEd1SFL00wYZIf41E'
);

// ------------------ STRIPE FORM COMPONENT ------------------
function StripePaymentForm({ onSuccess, onError, processing, setProcessing }) {
  const handleMockPayment = async () => {
    try {
      setProcessing(true);
      await new Promise((r) => setTimeout(r, 2000)); // simulate payment
      onSuccess({ id: 'mock_payment_id', status: 'succeeded' });
    } catch (err) {
      onError(err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div style={{
      textAlign: 'center',
      padding: '2rem',
      background: '#fffaf0',
      border: '2px solid #000000',
      marginBottom: '2rem'
    }}>
      <p style={{
        fontFamily: "'Courier New', monospace",
        color: '#666',
        fontSize: '0.875rem',
        marginBottom: '1rem'
      }}>
        ⚙️ Mock Stripe Checkout for Demo Purposes
      </p>
      <button
        onClick={handleMockPayment}
        disabled={processing}
        style={{
          width: '100%',
          padding: '1rem',
          background: processing ? '#999' : '#000',
          color: '#fff',
          border: '2px solid #fff',
          borderLeft: '4px solid #fff',
          borderBottom: '4px solid #fff',
          fontFamily: "'Courier New', monospace",
          fontSize: '0.875rem',
          fontWeight: 'bold',
          letterSpacing: '2px',
          cursor: processing ? 'not-allowed' : 'pointer'
        }}
      >
        {processing ? 'PROCESSING...' : 'COMPLETE STRIPE PAYMENT'}
      </button>
    </div>
  );
}

// ------------------ PAYMENT LOGIC COMPONENT ------------------
function PaymentLogic() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [step, setStep] = useState('payment'); // payment → completeRegistration
  const [status, setStatus] = useState('processing');
  const [error, setError] = useState('');
  const [paymentData, setPaymentData] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [processing, setProcessing] = useState(false);

  // Load Payment Session
  useEffect(() => {
    const session = searchParams.get('session');
    const token = searchParams.get('token');
    const successUrl = searchParams.get('success_url');
    const cancelUrl = searchParams.get('cancel_url');

    if (!session || !token) {
      setError('Invalid payment session');
      setStatus('error');
      return;
    }

    setPaymentData({
      session,
      token,
      successUrl: decodeURIComponent(successUrl || ''),
      cancelUrl: decodeURIComponent(cancelUrl || '')
    });
    setStatus('ready');
  }, [searchParams]);

  // Simulate payment → registration completion
  const handlePayment = async (method) => {
    setProcessing(true);
    setError('');

    try {
      await new Promise((r) => setTimeout(r, 2000)); // Simulate payment delay
      setStep('completeRegistration');
    } catch {
      setError('Payment failed. Please try again.');
      setProcessing(false);
    }
  };

  // Handle Stripe mock success
  const handleStripeSuccess = () => {
    setStep('completeRegistration');
  };

  const handleStripeError = (error) => {
    setError(error.message || 'Payment failed. Please try again.');
    setProcessing(false);
  };

  // ---------- REGISTRATION COMPLETION ----------
  useEffect(() => {
    if (step !== 'completeRegistration') return;

    const completeRegistration = async () => {
      try {
        setStatus('processing');
        const formData = {
          orgName: 'DemoOrg',
          email: 'contact@demo.com',
          paymentCompleted: true,
        };

        const res = await fetch('/api/org/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        const data = await res.json();
        if (res.ok) {
          setStatus('success');
          setTimeout(() => router.push('/org/dashboard'), 2000);
        } else {
          setStatus('error');
          setError(data.error || 'Registration failed');
        }
      } catch {
        setStatus('error');
        setError('An error occurred during registration.');
      }
    };

    completeRegistration();
  }, [step, router]);

  // ---------- UI for Registration Completion ----------
  if (step === 'completeRegistration') {
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
          maxWidth: '500px',
          padding: '3rem',
          background: '#ffffff',
          border: '2px solid #000000',
          borderLeft: '6px solid #000000',
          borderBottom: '6px solid #000000',
          textAlign: 'center',
        }}>
          {status === 'processing' && (
            <>
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
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
              `}</style>
              <h2 style={{ fontFamily: "'Courier New', monospace" }}>COMPLETING REGISTRATION...</h2>
            </>
          )}
          {status === 'success' && (
            <>
              <div style={{
                width: '80px', height: '80px', background: '#000', color: '#fff',
                borderRadius: '50%', display: 'flex', alignItems: 'center',
                justifyContent: 'center', margin: '0 auto 2rem', fontSize: '3rem'
              }}>✓</div>
              <h2 style={{ fontFamily: "'Courier New', monospace" }}>REGISTRATION COMPLETE!</h2>
              <p>Redirecting to your dashboard...</p>
            </>
          )}
          {status === 'error' && (
            <>
              <div style={{
                width: '80px', height: '80px', background: '#ff4444', color: '#fff',
                borderRadius: '50%', display: 'flex', alignItems: 'center',
                justifyContent: 'center', margin: '0 auto 2rem', fontSize: '3rem'
              }}>✕</div>
              <h2>REGISTRATION FAILED</h2>
              <p>{error}</p>
            </>
          )}
        </div>
      </div>
    );
  }

  // ---------- UI for Payment Page ----------
  return (
    <div style={{
      minHeight: '100vh',
      background: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '700px',
        padding: '3rem',
        background: '#fff',
        border: '2px solid #000',
        borderLeft: '6px solid #000',
        borderBottom: '6px solid #000',
      }}>
        <h1 style={{
          color: '#000', fontSize: '2rem', fontWeight: 900, letterSpacing: '2px',
          marginBottom: '2rem', fontFamily: "'Courier New', monospace", textAlign: 'center'
        }}>💳 PAYMENT</h1>

        {error && (
          <div style={{
            padding: '1rem', marginBottom: '2rem', background: '#ff4444',
            color: '#fff', border: '2px solid #fff', fontFamily: "'Courier New', monospace",
          }}>{error}</div>
        )}

        {!selectedMethod ? (
          <>
            <button
              onClick={() => setSelectedMethod('stripe')}
              style={{
                width: '100%', padding: '1.5rem', background: '#fff',
                border: '2px solid #000', cursor: 'pointer', marginBottom: '1rem'
              }}
            >
              Pay with Stripe
            </button>
            <button
              onClick={() => handlePayment('bank')}
              style={{
                width: '100%', padding: '1.5rem', background: '#fff',
                border: '2px solid #000', cursor: 'pointer', marginBottom: '1rem'
              }}
            >
              Pay via Bank Transfer
            </button>
          </>
        ) : (
          <>
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
              <button
                onClick={() => handlePayment(selectedMethod)}
                disabled={processing}
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: processing ? '#999' : '#000',
                  color: '#fff',
                  fontFamily: "'Courier New', monospace",
                  border: '2px solid #fff',
                }}
              >
                {processing ? 'PROCESSING...' : 'COMPLETE PAYMENT'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ------------------ PAGE WRAPPER (with client-side mount fix) ------------------
export default function PaymentPage() {
  // 💡 FIX: Use state to ensure the component is mounted on the client before rendering PaymentLogic
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  const loadingFallback = (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Courier New', monospace",
    }}>
      <p>🌀 Loading secure payment portal...</p>
    </div>
  );

  return (
    <Suspense fallback={loadingFallback}>
      {/* Conditionally render PaymentLogic only when the component has mounted on the client */}
      {mounted ? <PaymentLogic /> : loadingFallback}
    </Suspense>
  );
}
