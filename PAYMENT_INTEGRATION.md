# Payment Integration - Multi-Gateway via UniBee

## Overview
The application now supports multiple payment methods through the UniBee payment gateway, including:
- 💳 **Stripe** - Credit/Debit Cards, Apple Pay, Google Pay
- 💰 **PayPal** - PayPal account payments
- 🏦 **Bank Transfer** - Direct bank transfer & ACH

## Architecture

### Flow
1. **Registration Form** (`/org/auth/register`)
   - User fills organization details
   - Clicks "Proceed to Payment"

2. **Checkout Session** (`/api/checkout`)
   - Creates UniBee payment session
   - Returns session tokens
   - Redirects to payment page

3. **Payment Method Selection** (`/payment`)
   - User selects payment method (Stripe/PayPal/Bank)
   - Shows payment-specific interface
   - Processes payment through UniBee
   - Redirects to completion page

4. **Account Creation** (`/org/auth/register/complete`)
   - Verifies payment
   - Creates organization account
   - Redirects to dashboard

## Files Structure

```
src/
├── app/
│   ├── org/
│   │   └── auth/
│   │       └── register/
│   │           ├── page.js          # Registration form
│   │           └── complete/
│   │               └── page.js      # Post-payment account creation
│   ├── payment/
│   │   └── page.js                  # Multi-gateway payment page
│   └── api/
│       └── checkout/
│           └── route.js             # UniBee session creation
```

## Environment Variables

Add to `.env.local`:

```env
# UniBee Payment Gateway
UNIBEE_API_KEY=your_unibee_api_key_here

# App URL for redirects
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Payment Methods

### 1. Stripe (via UniBee)
- **Features**: Credit/Debit cards, Apple Pay, Google Pay
- **Color**: Purple (#635BFF)
- **Icon**: 💳
- **Use Case**: Most common payment method

### 2. PayPal (via UniBee)
- **Features**: PayPal account payments
- **Color**: Blue (#0070BA)
- **Icon**: 💰
- **Use Case**: Users who prefer PayPal

### 3. Bank Transfer (via UniBee)
- **Features**: Direct bank transfer, ACH
- **Color**: Green (#00A86B)
- **Icon**: 🏦
- **Use Case**: Large organizations preferring bank transfers

## Demo Mode

Currently in **demo mode**:
- All payments are simulated
- No actual charges are made
- Payment completes after 2-second delay
- Shows which gateway was selected

## Integration Steps for Production

### 1. Configure UniBee
```bash
# Get your UniBee credentials from dashboard
UNIBEE_API_KEY=your_production_key
UNIBEE_BASE_URL=https://api.unibee.com
```

### 2. Enable Payment Gateways in UniBee
- Login to UniBee dashboard
- Navigate to Payment Gateways
- Enable and configure:
  - Stripe integration
  - PayPal integration
  - Bank transfer settings

### 3. Update Product ID
In `/app/org/auth/register/page.js`, update:
```javascript
product_id: 'your_unibee_product_id'
```

### 4. Configure Webhooks
Set up UniBee webhooks to verify payments:
- Create `/api/webhooks/unibee/route.js`
- Verify payment status before account creation
- Handle payment failures

### 5. Update Payment Page
Replace demo logic in `/app/payment/page.js` with:
```javascript
// Integrate UniBee's actual payment widget
const handlePayment = async (method) => {
  setProcessing(true);
  
  // UniBee will handle the actual payment
  // based on the selected method (stripe/paypal/bank)
  const result = await unibeeSDK.processPayment({
    session: paymentData.session,
    token: paymentData.token,
    method: method,
  });
  
  if (result.success) {
    window.location.href = paymentData.successUrl;
  }
};
```

## Testing

### Test the Flow:
1. Start dev server: `npm run dev`
2. Go to: `http://localhost:3000/org/auth/register`
3. Fill in organization details
4. Click "Proceed to Payment"
5. Select a payment method (Stripe/PayPal/Bank)
6. Click "Complete Payment"
7. Should redirect to dashboard

### Test Different Gateways:
- Test each payment method separately
- Verify correct gateway is being used
- Check payment confirmation emails
- Verify account creation after payment

## Security Notes

1. **Never expose API keys** in client-side code
2. **Validate payments** server-side before account creation
3. **Use webhooks** to verify payment status
4. **Implement retry logic** for failed payments
5. **Log all transactions** for audit purposes

## Pricing Plan

Current plan shown on payment page:
- **Price**: $49/month
- **Features**:
  - AI-Powered Issue Assignment
  - Unlimited Repositories
  - Advanced Analytics

Update in `/app/payment/page.js` if pricing changes.

## Troubleshooting

### Issue: Payment not completing
- Check UniBee API key is valid
- Verify product_id exists in UniBee
- Check browser console for errors

### Issue: Redirect not working
- Verify NEXT_PUBLIC_APP_URL is set
- Check success_url and cancel_url encoding
- Ensure URLs are absolute paths

### Issue: Gateway not showing
- Check UniBee dashboard for enabled gateways
- Verify gateway configurations
- Test with different payment methods

## Support

For UniBee integration support:
- UniBee Documentation: https://docs.unibee.com
- UniBee Dashboard: http://127.0.0.1:8088 (local)
- Support: support@unibee.com
