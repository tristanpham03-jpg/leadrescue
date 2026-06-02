"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Business } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Select, Textarea } from "@/components/ui/Input";

export function AutomationForm({ business }: { business: Business }) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(business.follow_up_reminders_enabled ?? true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSaved(false);
    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/business/automation", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        follow_up_reminders_enabled: enabled,
        ai_tone: formData.get("ai_tone"),
        reminder_24h_template: formData.get("reminder_24h_template"),
        reminder_72h_template: formData.get("reminder_72h_template")
      })
    });
    setLoading(false);
    if (!response.ok) {
      const payload = await response.json();
      setError(payload.error ?? "Unable to save automation settings.");
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-lg border border-slate-200 bg-white p-6">
      <div className="border-b border-slate-100 pb-5">
        <h2 className="text-lg font-bold text-slate-950">Automation Settings</h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          LeadRescue can remind you when leads have not been contacted so potential customers don't fall through the cracks.
        </p>
        <label className="mt-4 flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <span>
            <span className="block text-sm font-semibold text-slate-900">Send follow-up reminders for unattended leads</span>
            <span className="mt-1 block text-sm text-slate-500">Turn this off to pause all reminder emails and notifications.</span>
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            onClick={() => {
              setEnabled((current) => !current);
              setSaved(false);
            }}
            className={`relative h-6 w-11 rounded-full transition ${enabled ? "bg-rescue-600" : "bg-slate-300"}`}
          >
            <span
              className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${enabled ? "left-6" : "left-1"}`}
            />
          </button>
        </label>
      </div>

      <label className="block text-sm font-medium text-slate-700">
        AI response tone
        <Select name="ai_tone" defaultValue={business.ai_tone ?? "Professional"} className="mt-1" onChange={() => setSaved(false)}>
          {["Professional", "Friendly", "Urgent", "Short and Direct"].map((tone) => (
            <option key={tone}>{tone}</option>
          ))}
        </Select>
      </label>

      <label className="block text-sm font-medium text-slate-700">
        New lead reminder template
        <Textarea name="reminder_24h_template" defaultValue={business.reminder_24h_template} className="mt-1" onChange={() => setSaved(false)} />
      </label>
      <label className="block text-sm font-medium text-slate-700">
        Contacted lead follow-up template
        <Textarea name="reminder_72h_template" defaultValue={business.reminder_72h_template} className="mt-1" onChange={() => setSaved(false)} />
      </label>
      <p className="text-sm text-slate-500">Supported tokens: {"{{lead_name}}"}, {"{{business_name}}"}, {"{{service_requested}}"}</p>
      {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {saved && <p className="rounded-md border border-rescue-100 bg-rescue-50 p-3 text-sm font-medium text-rescue-700">Automation settings saved.</p>}
      <Button disabled={loading}>{loading ? "Saving..." : "Save automation settings"}</Button>
    </form>
  );
}
