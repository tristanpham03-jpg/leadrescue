"use client";

import { useState } from "react";
import type { PlanCode } from "@/lib/types";
import { Button } from "@/components/ui/Button";

export function BillingButton({ plan }: { plan: PlanCode }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function checkout() {
    setLoading(true);
    setError(null);
    const response = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan })
    });
    const payload = await response.json().catch(() => ({}));
    setLoading(false);
    if (payload.url) {
      window.location.href = payload.url;
      return;
    }
    setError(payload.error ?? "Billing is not configured yet. You can still test LeadRescue without subscribing.");
  }

  return (
    <div className="space-y-2">
      <Button className="w-full" onClick={checkout} disabled={loading}>
        {loading ? "Opening checkout..." : "Subscribe"}
      </Button>
      {error && <p className="rounded-md bg-slate-50 p-3 text-xs leading-5 text-slate-600">{error}</p>}
    </div>
  );
}
