"use client";

import { useState } from "react";

export default function CheckoutButton() {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_id: "premium_plan",
        email: 'user@example.com',
      }),
    });
    const data = await res.json();
    window.location.href = data.url; // Stripe redirect
  };

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      className="px-4 py-2 bg-indigo-600 text-white rounded-md"
    >
      {loading ? "Redirecting..." : "Pay Now"}
    </button>
  );
}
