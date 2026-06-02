"use client";

import { useState } from "react";
import type { PlanCode } from "@/lib/types";
import { Button } from "@/components/ui/Button";

export function BillingButton({ plan }: { plan: PlanCode }) {
  const [loading, setLoading] = useState(false);

  async function checkout() {
    setLoading(true);
    const response = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan })
    });
    const payload = await response.json();
    setLoading(false);
    if (payload.url) window.location.href = payload.url;
  }

  return (
    <Button className="w-full" onClick={checkout} disabled={loading}>
      {loading ? "Opening checkout..." : "Subscribe"}
    </Button>
  );
}
