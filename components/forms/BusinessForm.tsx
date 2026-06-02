"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Business } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";

export function BusinessForm({ business }: { business?: Business | null }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSaved(false);
    const data = Object.fromEntries(new FormData(event.currentTarget));

    const response = await fetch("/api/business", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    setLoading(false);
    if (!response.ok) {
      const payload = await response.json();
      setError(payload.error ?? "Unable to save business profile.");
      return;
    }

    router.refresh();
    setSaved(true);
  }

  return (
    <form
      onSubmit={onSubmit}
      onChange={() => saved && setSaved(false)}
      className="grid gap-4 rounded-lg border border-slate-200 bg-white p-6"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">
          Business name
          <Input name="business_name" defaultValue={business?.business_name} required className="mt-1" />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Industry
          <Select name="industry" defaultValue={business?.industry ?? "Plumbing"} className="mt-1">
            {["Plumbing", "HVAC", "Electrical", "Landscaping", "Roofing", "General Home Services"].map((industry) => (
              <option key={industry}>{industry}</option>
            ))}
          </Select>
        </label>
        <label className="text-sm font-medium text-slate-700">
          Service area
          <Input name="service_area" defaultValue={business?.service_area} placeholder="Austin, TX" required className="mt-1" />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Phone number
          <Input name="phone" defaultValue={business?.phone} required className="mt-1" />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Email address
          <Input type="email" name="email" defaultValue={business?.email} required className="mt-1" />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Hours of operation
          <Input name="hours_of_operation" defaultValue={business?.hours_of_operation} placeholder="Mon-Fri 8am-5pm" required className="mt-1" />
        </label>
      </div>
      <label className="text-sm font-medium text-slate-700">
        Services offered
        <Input
          name="services_offered"
          defaultValue={business?.services_offered?.join(", ")}
          placeholder="Water heaters, drain cleaning, emergency plumbing"
          required
          className="mt-1"
        />
      </label>
      <label className="text-sm font-medium text-slate-700">
        Business description
        <Textarea name="description" defaultValue={business?.description} required className="mt-1" />
      </label>
      {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {saved && (
        <p className="rounded-md border border-rescue-100 bg-rescue-50 p-3 text-sm font-medium text-rescue-700">
          Business profile saved successfully.
        </p>
      )}
      <Button disabled={loading}>{loading ? "Saving..." : saved ? "Saved" : "Save business profile"}</Button>
    </form>
  );
}
