"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink, Plus, Save, X } from "lucide-react";
import type { Business } from "@/lib/types";
import { captureFormDefaults } from "@/lib/captureFormDefaults";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";

type CopyTarget = "link" | "embed" | null;

function getValue(value: string | null | undefined, fallback: string) {
  return value?.trim() || fallback;
}

function cleanService(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function WebsiteSetupForm({ business, appUrl }: { business: Business; appUrl: string }) {
  const hostedFormUrl = `${appUrl.replace(/\/$/, "")}/capture/${business.id}`;
  const embedCode = `<iframe src="${hostedFormUrl}" width="100%" height="700" style="border:0;border-radius:12px;"></iframe>`;
  const [copied, setCopied] = useState<CopyTarget>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serviceInput, setServiceInput] = useState("");
  const [serviceError, setServiceError] = useState<string | null>(null);
  const [services, setServices] = useState<string[]>(business.capture_form_services ?? []);

  async function markWebsiteLinkCopied() {
    await fetch("/api/business/onboarding", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ website_link_copied: true })
    }).catch(() => undefined);
  }

  async function copyToClipboard(value: string, target: CopyTarget) {
    await navigator.clipboard.writeText(value);
    if (target === "link") await markWebsiteLinkCopied();
    setCopied(target);
    window.setTimeout(() => setCopied(null), 2200);
  }

  function addService() {
    const nextService = cleanService(serviceInput);
    if (!nextService) {
      setServiceError("Type a service before adding it.");
      return;
    }
    if (services.some((service) => service.toLowerCase() === nextService.toLowerCase())) {
      setServiceError("That service is already in the list.");
      return;
    }
    setServices((current) => [...current, nextService]);
    setServiceInput("");
    setServiceError(null);
    setSaved(false);
  }

  function removeService(serviceToRemove: string) {
    setServices((current) => current.filter((service) => service !== serviceToRemove));
    setServiceError(null);
    setSaved(false);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setSaved(false);
    setError(null);
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch("/api/business/website", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    setLoading(false);
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setError(payload.error ?? "Unable to save website setup settings.");
      return;
    }
    setSaved(true);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-950">Hosted Lead Form</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">Use this link anywhere you want customers to request help from your business.</p>
          </div>
          <a href={hostedFormUrl} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 transition hover:bg-slate-50">
            Open form <ExternalLink className="h-4 w-4" />
          </a>
        </div>
        <div className="mt-5 flex flex-col gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center">
          <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap text-sm text-slate-700">{hostedFormUrl}</code>
          <Button type="button" variant="secondary" onClick={() => copyToClipboard(hostedFormUrl, "link")}>
            {copied === "link" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied === "link" ? "Copied" : "Copy Link"}
          </Button>
        </div>
        {copied === "link" && <p className="mt-3 rounded-md border border-rescue-100 bg-rescue-50 p-3 text-sm font-medium text-rescue-700">Hosted form link copied.</p>}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-950">Embed Form</h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">Paste this code into your website to show the LeadRescue form directly on the page.</p>
        <Textarea readOnly value={embedCode} className="mt-5 min-h-24 font-mono text-xs" />
        <div className="mt-3 flex justify-end">
          <Button type="button" variant="secondary" onClick={() => copyToClipboard(embedCode, "embed")}>
            {copied === "embed" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied === "embed" ? "Copied" : "Copy Embed Code"}
          </Button>
        </div>
        {copied === "embed" && <p className="mt-3 rounded-md border border-rescue-100 bg-rescue-50 p-3 text-sm font-medium text-rescue-700">Embed code copied.</p>}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-950">Simple Setup Instructions</h2>
        <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
          <li>Use the hosted form link for a Contact Us or Request Estimate button.</li>
          <li>Use the embed code to place the form directly on your website.</li>
          <li>Most users can send this code to their website designer or paste it into website builders like Wix, Squarespace, WordPress, or Webflow.</li>
        </ul>
      </section>

      <form onSubmit={onSubmit} className="space-y-5 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-950">Form Customization</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">Adjust the words and color customers see on your LeadRescue form.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            Form headline
            <Input name="capture_form_headline" defaultValue={getValue(business.capture_form_headline, captureFormDefaults.headline)} className="mt-1" onChange={() => setSaved(false)} />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Submit button text
            <Input name="capture_form_button_text" defaultValue={getValue(business.capture_form_button_text, captureFormDefaults.buttonText)} className="mt-1" onChange={() => setSaved(false)} />
          </label>
        </div>
        <label className="block text-sm font-medium text-slate-700">
          Success message
          <Input name="capture_form_success_message" defaultValue={getValue(business.capture_form_success_message, captureFormDefaults.successMessage)} className="mt-1" onChange={() => setSaved(false)} />
        </label>
        <label className="block max-w-44 text-sm font-medium text-slate-700">
          Primary color
          <Input type="color" name="capture_form_primary_color" defaultValue={getValue(business.capture_form_primary_color, captureFormDefaults.primaryColor)} className="mt-1 h-11 p-1" onChange={() => setSaved(false)} />
        </label>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <label className="block text-sm font-medium text-slate-700">Optional services dropdown list</label>
          <input type="hidden" name="capture_form_services" value={services.join(",")} />
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <Input
              value={serviceInput}
              onChange={(event) => {
                setServiceInput(event.target.value);
                setServiceError(null);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addService();
                }
              }}
              placeholder="Type a service and press Enter"
            />
            <Button type="button" variant="secondary" onClick={addService} className="shrink-0">
              <Plus className="h-4 w-4" />
              Add Service
            </Button>
          </div>
          {serviceError && <p className="mt-2 text-sm font-medium text-red-700">{serviceError}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            {services.map((service) => (
              <span key={service} className="inline-flex max-w-full items-center gap-2 rounded-full border border-rescue-100 bg-rescue-50 px-3 py-1 text-sm font-medium text-rescue-800">
                <span className="truncate">{service}</span>
                <button type="button" onClick={() => removeService(service)} className="rounded-full p-0.5 text-rescue-700 hover:bg-rescue-100" aria-label={`Remove ${service}`}>
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
            {!services.length && <p className="text-sm text-slate-500">No services added yet. Customers will only see the message field.</p>}
          </div>
          <div className="mt-5 rounded-md border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-900">Public form preview</p>
            <p className="mt-1 text-xs text-slate-500">This is how the services dropdown will appear to customers.</p>
            {services.length ? (
              <Select className="mt-3" defaultValue="">
                <option value="" disabled>Select a service</option>
                {services.map((service) => <option key={service}>{service}</option>)}
              </Select>
            ) : (
              <p className="mt-3 rounded-md bg-slate-50 p-3 text-sm text-slate-500">No services dropdown will be shown.</p>
            )}
          </div>
        </div>

        {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {saved && <p className="rounded-md border border-rescue-100 bg-rescue-50 p-3 text-sm font-medium text-rescue-700">Website setup settings saved.</p>}
        <Button disabled={loading}>
          <Save className="h-4 w-4" />
          {loading ? "Saving..." : "Save website setup"}
        </Button>
      </form>
    </div>
  );
}
