"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import type { Lead } from "@/lib/types";
import { formatFullTimestamp } from "@/lib/time";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";

type DuplicateLead = Pick<Lead, "id" | "name" | "status" | "created_at">;

export function LeadForm({ lead }: { lead?: Lead | null }) {
  const router = useRouter();
  const isCreating = !lead;
  const [expanded, setExpanded] = useState(!isCreating);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [duplicateLead, setDuplicateLead] = useState<DuplicateLead | null>(null);
  const [pendingFormData, setPendingFormData] = useState<Record<string, FormDataEntryValue> | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  async function checkForDuplicate(data: Record<string, FormDataEntryValue>) {
    const params = new URLSearchParams();
    const email = String(data.email ?? "").trim();
    const phone = String(data.phone ?? "").trim();
    if (email) params.set("email", email);
    if (phone) params.set("phone", phone);
    if (!params.toString()) return null;

    const response = await fetch(`/api/leads/duplicates?${params.toString()}`);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error ?? "Unable to check for duplicate leads.");
    return (payload.duplicate ?? null) as DuplicateLead | null;
  }

  async function saveLead(data: Record<string, FormDataEntryValue>, form?: HTMLFormElement) {
    const response = await fetch(lead ? `/api/leads/${lead.id}` : "/api/leads", {
      method: lead ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error ?? "Unable to save lead.");
    }

    if (isCreating) {
      form?.reset();
      setPendingFormData(null);
      setDuplicateLead(null);
      setSuccess(true);
      router.refresh();
      return;
    }

    setSuccess(true);
    router.refresh();
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    formRef.current = form;
    setLoading(true);
    setError(null);
    setSuccess(false);

    const data = Object.fromEntries(new FormData(form));

    try {
      if (isCreating) {
        const duplicate = await checkForDuplicate(data);
        if (duplicate) {
          setPendingFormData(data);
          setDuplicateLead(duplicate);
          return;
        }
      }
      await saveLead(data, form);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save lead.");
    } finally {
      setLoading(false);
    }
  }

  async function createAnyway() {
    if (!pendingFormData) return;
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      await saveLead(pendingFormData, formRef.current ?? undefined);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save lead.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6">
      {isCreating && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-950">Create New Lead</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Manually enter leads that came in by phone, email, referral, or another offline source.
            </p>
          </div>
          <Button type="button" variant="secondary" onClick={() => setExpanded((current) => !current)}>
            <Plus className="h-4 w-4" />
            {expanded ? "Hide Form" : "+ Add Lead"}
          </Button>
        </div>
      )}

      {success && (
        <p className="mt-4 rounded-md border border-rescue-100 bg-rescue-50 p-3 text-sm font-medium text-rescue-700">
          {isCreating ? "Lead created successfully." : "Lead saved successfully."}
        </p>
      )}

      {expanded && (
        <form onSubmit={onSubmit} className={isCreating ? "mt-5 grid gap-4" : "grid gap-4"}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              Lead name
              <Input name="name" defaultValue={lead?.name} required className="mt-1" />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Email
              <Input type="email" name="email" defaultValue={lead?.email} required className="mt-1" />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Phone
              <Input name="phone" defaultValue={lead?.phone ?? ""} className="mt-1" />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Status
              <Select name="status" defaultValue={lead?.status ?? "New"} className="mt-1">
                {["New", "Contacted", "Quoted", "Won", "Lost"].map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </Select>
            </label>
          </div>
          <label className="text-sm font-medium text-slate-700">
            Message
            <Textarea name="message" defaultValue={lead?.message} required className="mt-1" />
          </label>
          {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <Button disabled={loading}>{loading ? "Saving..." : "Save lead"}</Button>
        </form>
      )}

      {duplicateLead && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4">
          <div className="w-full max-w-md rounded-lg bg-white shadow-soft">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
              <div>
                <p className="text-sm font-semibold uppercase text-amber-700">Possible duplicate lead</p>
                <h2 className="mt-1 text-xl font-bold text-slate-950">Review before creating</h2>
              </div>
              <button type="button" onClick={() => setDuplicateLead(null)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100" aria-label="Close duplicate warning">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 p-5">
              <p className="text-sm leading-6 text-slate-600">A lead with the same email address or phone number already exists.</p>
              <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm">
                <p className="font-bold text-slate-950">{duplicateLead.name}</p>
                <p className="mt-1 text-slate-700">Status: {duplicateLead.status}</p>
                <p className="mt-1 text-slate-700">Created: {formatFullTimestamp(duplicateLead.created_at)}</p>
              </div>
            </div>
            <div className="flex flex-col-reverse gap-2 border-t border-slate-200 p-5 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={() => router.push(`/leads/${duplicateLead.id}`)}>View Existing Lead</Button>
              <Button type="button" onClick={createAnyway} disabled={loading}>{loading ? "Creating..." : "Create Anyway"}</Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
