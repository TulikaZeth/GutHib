# Payment Setup Instructions

## Current Status
The payment integration is configured for UniBee running at `http://127.0.0.1:8088`

## To Fix the 401 Error:

### Option 1: Configure UniBee (Recommended)
1. Ensure UniBee is running at `http://127.0.0.1:8088`
2. Login to UniBee merchant dashboard
3. Go to Settings → API Keys
4. Copy your merchant API key
5. Add to `.env.local`:
   ```
   UNIBEE_API_KEY=your-actual-unibee-token
   ```
6. Restart Next.js server

### Option 2: Mock Payment for Testing
Create a mock endpoint at `src/app/api/checkout/mock/route.js`:

```javascript
import { NextResponse } from "next/server";

export async function POST(req) {
  const body = await req.json();
  
  // Mock payment session
  return NextResponse.json({
    url: body.success_url, // Skip payment, go directly to success
    sessionId: "mock_session_" + Date.now(),
  });
}
```

Then update registration page to use `/api/checkout/mock` instead of `/api/checkout`

### Option 3: Use Stripe Instead
If you prefer Stripe over UniBee, I can help you set that up instead.

## Current Flow:
1. User fills registration form
2. Clicks "PROCEED TO PAYMENT"
3. Creates checkout session with UniBee
4. Redirects to UniBee payment page
5. On success → `/org/auth/register/complete`
6. Creates organization account
7. Redirects to dashboard
