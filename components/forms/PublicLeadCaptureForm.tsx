"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";

type PublicLeadCaptureFormProps = {
  businessId: string;
  businessName: string;
  headline: string;
  buttonText: string;
  successMessage: string;
  primaryColor: string;
  services: string[];
};

export function PublicLeadCaptureForm({ businessId, businessName, headline, buttonText, successMessage, primaryColor, services }: PublicLeadCaptureFormProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setError(null);
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    const response = await fetch("/api/public/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, business_id: businessId })
    });
    const payload = await response.json().catch(() => ({}));
    setStatus(response.ok ? "success" : "error");
    if (response.ok) {
      form.reset();
      return;
    }

    setError(payload.error ?? "Something went wrong. Please try again.");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">{headline}</h1>
        <p className="mt-1 text-sm text-slate-500">Send your request to {businessName} and the team will follow up shortly.</p>
      </div>
      <Input name="name" placeholder="Name" required />
      <Input type="email" name="email" placeholder="Email" required />
      <Input name="phone" placeholder="Phone" />
      {services.length > 0 && (
        <Select name="service" defaultValue="">
          <option value="" disabled>Select a service</option>
          {services.map((service) => (
            <option key={service} value={service}>{service}</option>
          ))}
        </Select>
      )}
      <Textarea name="message" placeholder="How can we help?" required />
      {status === "success" && <p className="rounded-md bg-rescue-50 p-3 text-sm text-rescue-700">{successMessage}</p>}
      {status === "error" && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error ?? "Something went wrong. Please try again."}</p>}
      <Button className="w-full hover:opacity-90" disabled={status === "loading"} style={{ backgroundColor: primaryColor }}>
        {status === "loading" ? "Sending..." : buttonText}
      </Button>
    </form>
  );
}
