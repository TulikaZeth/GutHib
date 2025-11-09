'use client';

import { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

export default function StripePaymentForm({ onSuccess, onError, processing, setProcessing }) {
  const stripe = useStripe();
  const elements = useElements();
  const [cardError, setCardError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setCardError('');

    try {
      const cardElement = elements.getElement(CardElement);
      
      // In demo mode, simulate payment after 2 seconds
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate successful payment
      const mockPaymentMethod = {
        id: 'pm_demo_' + Date.now(),
        card: {
          brand: 'visa',
          last4: '4242',
        }
      };

      onSuccess(mockPaymentMethod);
    } catch (error) {
      setCardError(error.message || 'Payment failed. Please try again.');
      onError(error);
      setProcessing(false);
    }
  };

  const cardStyle = {
    style: {
      base: {
        color: '#000000',
        fontFamily: "'Courier New', monospace",
        fontSmoothing: 'antialiased',
        fontSize: '16px',
        '::placeholder': {
          color: '#999999',
        },
      },
      invalid: {
        color: '#ff4444',
        iconColor: '#ff4444',
      },
    },
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%' }}>
      <div style={{
        padding: '1.5rem',
        background: '#ffffff',
        border: '2px solid #635BFF',
        marginBottom: '1.5rem',
      }}>
        <label style={{
          display: 'block',
          fontSize: '0.875rem',
          fontWeight: 'bold',
          fontFamily: "'Courier New', monospace",
          color: '#000000',
          marginBottom: '0.75rem',
          letterSpacing: '1px',
        }}>
          💳 CARD DETAILS
        </label>
        <div style={{
          padding: '1rem',
          background: '#f8f8ff',
          border: '2px solid #635BFF',
        }}>
          <CardElement options={cardStyle} />
        </div>
        {cardError && (
          <p style={{
            marginTop: '0.5rem',
            fontSize: '0.75rem',
            color: '#ff4444',
            fontFamily: "'Courier New', monospace",
          }}>
            ⚠️ {cardError}
          </p>
        )}
      </div>

      <div style={{
        padding: '1rem',
        background: '#f0f8ff',
        border: '2px solid #635BFF',
        marginBottom: '1.5rem',
      }}>
        <p style={{
          fontSize: '0.75rem',
          color: '#666666',
          fontFamily: "'Courier New', monospace",
          lineHeight: '1.6',
          marginBottom: '0.5rem',
        }}>
          💡 <strong>Demo Mode:</strong> Use test card numbers:
        </p>
        <p style={{
          fontSize: '0.75rem',
          color: '#635BFF',
          fontFamily: "'Courier New', monospace",
          fontWeight: 'bold',
        }}>
          • 4242 4242 4242 4242 (Success)<br />
          • Any future expiry • Any 3-digit CVC
        </p>
      </div>

      <button
        type="submit"
        disabled={!stripe || processing}
        style={{
          width: '100%',
          padding: '1rem',
          background: (!stripe || processing) ? '#999999' : '#635BFF',
          color: '#ffffff',
          border: '2px solid #ffffff',
          borderLeft: '4px solid #ffffff',
          borderBottom: '4px solid #ffffff',
          fontFamily: "'Courier New', monospace",
          fontSize: '0.875rem',
          fontWeight: 'bold',
          letterSpacing: '2px',
          cursor: (!stripe || processing) ? 'not-allowed' : 'pointer',
          marginBottom: '1rem',
        }}
      >
        {processing ? '⏳ PROCESSING...' : '🔒 PAY $49/MONTH'}
      </button>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        marginBottom: '1rem',
      }}>
        <span style={{ fontSize: '0.75rem', color: '#999999' }}>🔒</span>
        <p style={{
          fontSize: '0.75rem',
          color: '#999999',
          fontFamily: "'Courier New', monospace",
        }}>
          Secured by Stripe • PCI DSS Compliant
        </p>
      </div>
    </form>
  );
}
