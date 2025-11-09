import { NextResponse } from "next/server";
import axios from "axios";

export async function POST(req) {
  try {
    const body = await req.json();

    // Check if UniBee token is configured
    const UNIBEE_API_KEY = process.env.UNIBEE_API_KEY;
    if (!UNIBEE_API_KEY) {
      console.error("UniBee API key not configured in environment variables");
      return NextResponse.json(
        { error: "Payment system not configured. Please contact support." },
        { status: 500 }
      );
    }

    // Use custom URLs if provided, otherwise use defaults
    const successUrl = body.success_url || `${process.env.NEXT_PUBLIC_URL}/success`;
    const cancelUrl = body.cancel_url || `${process.env.NEXT_PUBLIC_URL}/cancel`;

    // Generate a unique external user ID (can be email or a unique identifier)
    const externalUserId = body.external_user_id || body.email || `user_${Date.now()}`;

    console.log("Creating checkout session with:", {
      product_id: body.product_id,
      Email: body.email,
      ExternalUserId: externalUserId,
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    // Call UniBee API with capitalized field names
    const response = await axios.post(
      "http://127.0.0.1:8088/merchant/session/new_session",
      {
        ProductId: body.product_id,
        Email: body.email,
        Name: body.name || body.email.slice(0, body.email.indexOf('@')) || "Valued Customer",
        ExternalUserId: externalUserId,
        SubscriptionPlan: "Guthib Premium",
        SuccessUrl: successUrl,
        CancelUrl: cancelUrl,
      },
      {
        headers: {
          Authorization: `Bearer ${UNIBEE_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("UniBee response:", response.data);
    
    if (response.data && response.data.code === 0 && response.data.data) {
      const { clientToken, clientSession, url } = response.data.data;
      

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const checkoutUrl = `${baseUrl}/payment?session=${encodeURIComponent(clientSession)}&token=${encodeURIComponent(clientToken)}&success_url=${encodeURIComponent(successUrl)}&cancel_url=${encodeURIComponent(cancelUrl)}`;
      
      return NextResponse.json({
        url: checkoutUrl,
        session: clientSession,
        token: clientToken,
        userId: response.data.data.userId,
        // Also return the raw data in case frontend needs to handle it differently
        raw: response.data.data,
      });
    }
    
    // If response doesn't have expected structure, return error
    return NextResponse.json(
      { error: "Invalid response from payment system" },
      { status: 500 }
    );
  } catch (error) {
    console.error("UniBee checkout error:", error.response?.data || error.message);
    
    // Provide more specific error messages
    if (error.response?.status === 401) {
      return NextResponse.json(
        { error: "Payment authentication failed. Please contact support." },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: error.response?.data?.message || error.message || "Failed to create payment session" },
      { status: 500 }
    );
  }
}
