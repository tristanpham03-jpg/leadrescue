"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Bot, Copy, Download, Eye, Mail, Phone, Search, Trash2, X } from "lucide-react";
import type { Lead, LeadStatus } from "@/lib/types";
import { formatRelativeTime } from "@/lib/time";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";

const statuses: Array<LeadStatus | "All"> = ["All", "New", "Contacted", "Quoted", "Won", "Lost"];
const editableStatuses = statuses.filter((status): status is LeadStatus => status !== "All");
const pageSize = 10;
const bulkSendLimit = 10;
type SortKey = "created_at" | "status" | "name";
type SortDirection = "asc" | "desc";
type BulkMode = "idle" | "status" | "ai";

type AiReplyState = {
  lead: Lead;
  reply: string;
  error: string | null;
  loading: boolean;
  sending: boolean;
  sent: boolean;
  copied: boolean;
};

type BulkFailure = {
  name: string;
  error: string;
};

type BulkResult = {
  sent: number;
  failed: BulkFailure[];
};

function digitsOnly(value: string | null | undefined) {
  return (value ?? "").replace(/\D/g, "");
}

function matchesLead(lead: Lead, query: string, status: LeadStatus | "All") {
  if (status !== "All" && lead.status !== status) return false;
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return true;
  const searchableText = [lead.name, lead.email, lead.phone ?? "", lead.message, lead.status].join(" ").toLowerCase();
  const queryDigits = digitsOnly(trimmed);
  const phoneDigits = digitsOnly(lead.phone);
  return searchableText.includes(trimmed) || Boolean(queryDigits && phoneDigits.includes(queryDigits));
}

function statusBadgeClass(status: LeadStatus) {
  const classes: Record<LeadStatus, string> = {
    New: "border-blue-200 bg-blue-50 text-blue-700",
    Contacted: "border-yellow-200 bg-yellow-50 text-yellow-800",
    Quoted: "border-purple-200 bg-purple-50 text-purple-700",
    Won: "border-rescue-100 bg-rescue-50 text-rescue-700",
    Lost: "border-red-200 bg-red-50 text-red-700"
  };
  return classes[status];
}

function bulkSkipReason(lead: Lead) {
  if (!lead.email.trim()) return "Missing email address";
  if (lead.status === "Won" || lead.status === "Lost") return `Lead is marked ${lead.status}`;
  return null;
}

function Highlight({ value, query }: { value: string | null | undefined; query: string }) {
  const text = value ?? "";
  const trimmed = query.trim();
  if (!trimmed) return <>{text}</>;
  const index = text.toLowerCase().indexOf(trimmed.toLowerCase());
  if (index === -1) return <>{text}</>;
  return <>{text.slice(0, index)}<mark className="rounded bg-amber-100 px-0.5 font-semibold text-amber-900">{text.slice(index, index + trimmed.length)}</mark>{text.slice(index + trimmed.length)}</>;
}

export function LeadsTable({ leads }: { leads: Lead[] }) {
  const router = useRouter();
  const [activeLeads, setActiveLeads] = useState(leads);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<LeadStatus | "All">("All");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [page, setPage] = useState(1);
  const [aiReply, setAiReply] = useState<AiReplyState | null>(null);
  const [messageLead, setMessageLead] = useState<Lead | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<LeadStatus>("Contacted");
  const [bulkMode, setBulkMode] = useState<BulkMode>("idle");
  const [bulkProgress, setBulkProgress] = useState(0);
  const [bulkSentCount, setBulkSentCount] = useState(0);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [bulkConfirmText, setBulkConfirmText] = useState("");
  const [bulkResult, setBulkResult] = useState<BulkResult | null>(null);

  useEffect(() => setActiveLeads(leads), [leads]);
  useEffect(() => setPage(1), [query, status, sortKey, sortDirection]);
  useEffect(() => {
    const activeIds = new Set(activeLeads.map((lead) => lead.id));
    setSelectedIds((current) => current.filter((id) => activeIds.has(id)));
  }, [activeLeads]);

  const filteredLeads = useMemo(() => {
    const filtered = activeLeads.filter((lead) => matchesLead(lead, query, status));
    return [...filtered].sort((a, b) => {
      const direction = sortDirection === "asc" ? 1 : -1;
      if (sortKey === "created_at") return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * direction;
      return a[sortKey].localeCompare(b[sortKey]) * direction;
    });
  }, [activeLeads, query, status, sortDirection, sortKey]);

  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / pageSize));
  const paginatedLeads = filteredLeads.slice((page - 1) * pageSize, page * pageSize);
  const selectedLeads = activeLeads.filter((lead) => selectedIds.includes(lead.id));
  const validBulkEmailLeads = selectedLeads.filter((lead) => !bulkSkipReason(lead));
  const sendableLeads = validBulkEmailLeads.slice(0, bulkSendLimit);
  const skippedLeads = [
    ...selectedLeads.map((lead) => ({ lead, reason: bulkSkipReason(lead) })).filter((item): item is { lead: Lead; reason: string } => Boolean(item.reason)),
    ...validBulkEmailLeads.slice(bulkSendLimit).map((lead) => ({ lead, reason: `Bulk send limit is ${bulkSendLimit} leads at a time` }))
  ];
  const pageSelectedCount = paginatedLeads.filter((lead) => selectedIds.includes(lead.id)).length;
  const allPageSelected = paginatedLeads.length > 0 && pageSelectedCount === paginatedLeads.length;
  const somePageSelected = pageSelectedCount > 0 && !allPageSelected;
  const bulkWorking = bulkMode !== "idle";

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDirection(key === "created_at" ? "desc" : "asc");
  }

  function toggleLeadSelection(id: string, checked: boolean) {
    setBulkError(null);
    setBulkResult(null);
    setSelectedIds((current) => checked ? [...new Set([...current, id])] : current.filter((selectedId) => selectedId !== id));
  }

  function togglePageSelection(checked: boolean) {
    setBulkError(null);
    setBulkResult(null);
    const pageIds = paginatedLeads.map((lead) => lead.id);
    setSelectedIds((current) => checked ? [...new Set([...current, ...pageIds])] : current.filter((id) => !pageIds.includes(id)));
  }

  function openBulkSendModal() {
    setBulkConfirmText("");
    setBulkError(null);
    setBulkResult(null);
    setBulkConfirmOpen(true);
  }

  async function deleteLead(id: string) {
    if (!window.confirm("Move this lead to trash?")) return;
    const response = await fetch(`/api/leads/${id}`, { method: "DELETE" });
    if (response.ok) setActiveLeads((current) => current.filter((lead) => lead.id !== id));
    else window.alert("Unable to move lead to trash.");
  }

  async function updateStatus(lead: Lead, nextStatus: LeadStatus) {
    setStatusUpdatingId(lead.id);
    setActiveLeads((current) => current.map((item) => (item.id === lead.id ? { ...item, status: nextStatus } : item)));
    const response = await fetch(`/api/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: lead.name, email: lead.email, phone: lead.phone ?? "", message: lead.message, status: nextStatus })
    });
    if (!response.ok) {
      setActiveLeads((current) => current.map((item) => (item.id === lead.id ? lead : item)));
      window.alert("Unable to update lead status.");
      setStatusUpdatingId(null);
      return;
    }
    setStatusUpdatingId(null);
    setMessage("Lead status updated.");
  }

  async function bulkUpdateStatus() {
    if (!selectedLeads.length) return;
    setBulkMode("status");
    setBulkProgress(0);
    setBulkError(null);
    setBulkResult(null);
    const failures: string[] = [];

    for (const lead of selectedLeads) {
      const response = await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: lead.name, email: lead.email, phone: lead.phone ?? "", message: lead.message, status: bulkStatus })
      });
      if (response.ok) {
        setActiveLeads((current) => current.map((item) => (item.id === lead.id ? { ...item, status: bulkStatus } : item)));
      } else {
        failures.push(lead.name);
      }
      setBulkProgress((current) => current + 1);
    }

    setBulkMode("idle");
    if (failures.length) {
      setBulkError(`Could not update ${failures.length} selected lead${failures.length === 1 ? "" : "s"}: ${failures.join(", ")}.`);
      return;
    }
    setSelectedIds([]);
    setMessage(`${selectedLeads.length} lead${selectedLeads.length === 1 ? "" : "s"} marked ${bulkStatus}.`);
  }

  async function bulkSendAiReplies() {
    if (!sendableLeads.length || bulkConfirmText !== "SEND") return;

    setBulkMode("ai");
    setBulkProgress(0);
    setBulkSentCount(0);
    setBulkError(null);
    setBulkResult(null);
    const failures: BulkFailure[] = [];
    let sent = 0;

    for (const lead of sendableLeads) {
      try {
        const generateResponse = await fetch(`/api/leads/${lead.id}/ai-reply`, { method: "POST" });
        const generatePayload = await generateResponse.json().catch(() => ({}));
        if (!generateResponse.ok || !generatePayload.reply) {
          failures.push({ name: lead.name, error: generatePayload.error ?? "AI reply was not generated" });
          setBulkProgress((current) => current + 1);
          continue;
        }

        const sendResponse = await fetch(`/api/leads/${lead.id}/send-reply`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reply: generatePayload.reply })
        });
        const sendPayload = await sendResponse.json().catch(() => ({}));
        if (!sendResponse.ok) {
          failures.push({ name: lead.name, error: sendPayload.error ?? "Email was not sent" });
          setBulkProgress((current) => current + 1);
          continue;
        }

        sent += 1;
        setBulkSentCount(sent);
        setActiveLeads((current) => current.map((item) => item.id === lead.id ? { ...item, ai_response: generatePayload.reply, status: "Contacted" } : item));
      } catch (error) {
        failures.push({ name: lead.name, error: error instanceof Error ? error.message : "Unable to send AI reply" });
      }
      setBulkProgress((current) => current + 1);
    }

    setBulkMode("idle");
    setBulkResult({ sent, failed: failures });
    if (failures.length) {
      setBulkError(`${sent} sent, ${failures.length} failed. Review the bulk send summary for details.`);
      return;
    }
    setSelectedIds((current) => current.filter((id) => !sendableLeads.some((lead) => lead.id === id)));
    setMessage(`${sent} AI email${sent === 1 ? "" : "s"} sent successfully.`);
  }

  async function generateAiReply(lead: Lead) {
    setAiReply({ lead, reply: lead.ai_response ?? "", error: null, loading: true, sending: false, sent: false, copied: false });
    const response = await fetch(`/api/leads/${lead.id}/ai-reply`, { method: "POST" });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setAiReply({ lead, reply: "", error: payload.error ?? "Unable to generate AI reply.", loading: false, sending: false, sent: false, copied: false });
      return;
    }
    setActiveLeads((current) => current.map((item) => (item.id === lead.id ? { ...item, ai_response: payload.reply } : item)));
    setAiReply({ lead: { ...lead, ai_response: payload.reply }, reply: payload.reply, error: null, loading: false, sending: false, sent: false, copied: false });
  }

  async function copyAiReply() {
    if (!aiReply?.reply.trim()) return;
    await navigator.clipboard.writeText(aiReply.reply);
    setAiReply({ ...aiReply, copied: true });
  }

  async function sendAiReply() {
    if (!aiReply || !aiReply.reply.trim()) return;
    setAiReply({ ...aiReply, sending: true, error: null, sent: false, copied: false });
    const response = await fetch(`/api/leads/${aiReply.lead.id}/send-reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reply: aiReply.reply })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setAiReply({ ...aiReply, sending: false, error: payload.error ?? "Unable to send AI reply.", sent: false, copied: false });
      return;
    }
    setActiveLeads((current) => current.map((lead) => lead.id === aiReply.lead.id ? { ...lead, ai_response: aiReply.reply, status: "Contacted" } : lead));
    setAiReply({ ...aiReply, lead: { ...aiReply.lead, status: "Contacted", ai_response: aiReply.reply }, sending: false, sent: true, copied: false });
    setMessage("AI email sent successfully.");
  }

  return (
    <>
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} className="h-10 w-full rounded-md border border-slate-200 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-rescue-500 sm:w-72" placeholder="Search leads..." type="search" />
            </div>
            <select value={status} onChange={(event) => setStatus(event.target.value as LeadStatus | "All")} className="h-10 rounded-md border border-slate-200 px-3 text-sm">
              {statuses.map((leadStatus) => <option key={leadStatus}>{leadStatus}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <a href="/api/leads?format=csv" className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold hover:bg-slate-50"><Download className="h-4 w-4" />Export CSV</a>
            <Link href="/leads/trash" className="inline-flex h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold hover:bg-slate-50">Trash</Link>
          </div>
        </div>

        {selectedIds.length > 0 && (
          <div className="border-b border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <p className="text-sm font-semibold text-slate-700">{selectedIds.length} lead{selectedIds.length === 1 ? "" : "s"} selected</p>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <select value={bulkStatus} disabled={bulkWorking} onChange={(event) => setBulkStatus(event.target.value as LeadStatus)} className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm">
                  {editableStatuses.map((leadStatus) => <option key={leadStatus}>{leadStatus}</option>)}
                </select>
                <Button type="button" variant="secondary" disabled={bulkWorking} onClick={bulkUpdateStatus}>
                  {bulkMode === "status" ? `Updating ${bulkProgress}/${selectedLeads.length}...` : "Mark Selected"}
                </Button>
                <Button type="button" disabled={bulkWorking} onClick={openBulkSendModal}>
                  <Bot className="h-4 w-4" />
                  {bulkMode === "ai" ? `Sending ${bulkProgress} of ${sendableLeads.length}...` : "Auto-Send AI Replies"}
                </Button>
                <Button type="button" variant="ghost" disabled={bulkWorking} onClick={() => setSelectedIds([])}>Clear</Button>
              </div>
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-500">Bulk status updates are separate from bulk email sending. Auto-send requires a typed confirmation and is limited to {bulkSendLimit} leads at a time.</p>
          </div>
        )}

        {message && <p className="mx-4 mt-4 rounded-md border border-rescue-100 bg-rescue-50 p-3 text-sm font-medium text-rescue-700">{message}</p>}
        {bulkError && <p className="mx-4 mt-4 rounded-md border border-red-100 bg-red-50 p-3 text-sm font-medium text-red-700">{bulkError}</p>}
        {bulkResult && !bulkConfirmOpen && (
          <div className="mx-4 mt-4 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            <p className="font-semibold">Bulk send complete: {bulkResult.sent} sent, {bulkResult.failed.length} failed.</p>
            {bulkResult.failed.length > 0 && <ul className="mt-2 space-y-1">{bulkResult.failed.map((failure) => <li key={`${failure.name}-${failure.error}`}><span className="font-semibold">{failure.name}:</span> {failure.error}</li>)}</ul>}
          </div>
        )}

        <div className="w-full overflow-x-auto">
          <table className="min-w-[1180px] table-fixed text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="w-12 px-4 py-3"><input type="checkbox" checked={allPageSelected} aria-checked={somePageSelected ? "mixed" : allPageSelected} onChange={(event) => togglePageSelection(event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-rescue-600 focus:ring-rescue-500" aria-label="Select all leads on this page" /></th>
                <th className="w-44 px-4 py-3"><button onClick={() => toggleSort("name")} className="font-bold hover:text-slate-900">Lead</button></th>
                <th className="w-56 px-4 py-3">Contact</th>
                <th className="w-72 px-4 py-3">Message</th>
                <th className="w-40 px-4 py-3"><button onClick={() => toggleSort("status")} className="font-bold hover:text-slate-900">Status</button></th>
                <th className="w-36 px-4 py-3"><button onClick={() => toggleSort("created_at")} className="font-bold hover:text-slate-900">Created</button></th>
                <th className="w-40 px-4 py-3">AI Reply</th>
                <th className="w-16 px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedLeads.map((lead) => (
                <tr key={lead.id} onClick={() => router.push(`/leads/${lead.id}`)} className="cursor-pointer transition hover:bg-slate-50">
                  <td className="px-4 py-3"><input type="checkbox" checked={selectedIds.includes(lead.id)} onClick={(event) => event.stopPropagation()} onChange={(event) => toggleLeadSelection(lead.id, event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-rescue-600 focus:ring-rescue-500" aria-label={`Select ${lead.name}`} /></td>
                  <td className="px-4 py-3 font-semibold text-slate-950"><Highlight value={lead.name} query={query} /></td>
                  <td className="px-4 py-3 text-slate-600"><a href={`mailto:${lead.email}`} onClick={(event) => event.stopPropagation()} className="inline-flex items-center gap-1 text-rescue-700 hover:underline"><Mail className="h-3.5 w-3.5" /><Highlight value={lead.email} query={query} /></a><br />{lead.phone && <a href={`tel:${lead.phone}`} onClick={(event) => event.stopPropagation()} className="mt-1 inline-flex items-center gap-1 text-slate-600 hover:text-rescue-700 hover:underline"><Phone className="h-3.5 w-3.5" /><Highlight value={lead.phone} query={query} /></a>}</td>
                  <td className="px-4 py-3 text-slate-600"><span className="line-clamp-1 inline-block max-w-56 align-middle"><Highlight value={lead.message} query={query} /></span><button onClick={(event) => { event.stopPropagation(); setMessageLead(lead); }} className="ml-2 inline-flex items-center gap-1 text-xs font-semibold text-rescue-700 hover:underline"><Eye className="h-3.5 w-3.5" />View</button></td>
                  <td className="px-4 py-3"><select value={lead.status} disabled={statusUpdatingId === lead.id || bulkWorking} onClick={(event) => event.stopPropagation()} onChange={(event) => updateStatus(lead, event.target.value as LeadStatus)} className={`h-8 min-w-28 rounded-md border px-2 text-xs font-bold outline-none focus:ring-2 focus:ring-rescue-500 disabled:opacity-60 ${statusBadgeClass(lead.status)}`}>{editableStatuses.map((leadStatus) => <option key={leadStatus}>{leadStatus}</option>)}</select></td>
                  <td className="px-4 py-3 text-slate-500">{formatRelativeTime(lead.created_at)}</td>
                  <td className="px-4 py-3"><Button variant="secondary" disabled={bulkWorking} onClick={(event) => { event.stopPropagation(); generateAiReply(lead); }} className="h-8 px-3 text-xs"><Bot className="h-4 w-4" />Generate</Button></td>
                  <td className="px-4 py-3 text-right"><button disabled={bulkWorking} onClick={(event) => { event.stopPropagation(); deleteLead(lead.id); }} className="rounded-md p-2 text-red-600 hover:bg-red-50 disabled:opacity-50" aria-label="Move lead to trash"><Trash2 className="h-4 w-4" /></button></td>
                </tr>
              ))}
              {!paginatedLeads.length && <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-500">{activeLeads.length ? "No leads match your search." : "No leads yet. Submit a test lead or connect your website to start capturing customers."}</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-3 border-t border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-slate-500">Showing {filteredLeads.length ? (page - 1) * pageSize + 1 : 0}-{Math.min(page * pageSize, filteredLeads.length)} of {filteredLeads.length} leads</p><div className="flex gap-2"><Button variant="secondary" disabled={page === 1 || bulkWorking} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</Button><Button variant="secondary" disabled={page === totalPages || bulkWorking} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>Next</Button></div></div>
      </div>

      {bulkConfirmOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4 py-6">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-soft">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5"><div><p className="text-sm font-semibold uppercase text-red-700">Bulk Email Safety Check</p><h2 className="mt-1 text-xl font-bold text-slate-950">Confirm bulk AI email send</h2><p className="mt-1 text-sm text-slate-500">Estimated action: Generate AI replies and send emails.</p></div><button disabled={bulkWorking} onClick={() => setBulkConfirmOpen(false)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50" aria-label="Close bulk send confirmation"><X className="h-5 w-5" /></button></div>
            <div className="space-y-5 p-5">
              <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800"><div className="flex gap-2"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" /><p><span className="font-bold">Emails will be sent to real customers.</span> This action cannot be undone once emails are sent.</p></div></div>
              <div className="grid gap-3 sm:grid-cols-3"><div className="rounded-md border border-slate-200 p-3"><p className="text-xs font-semibold uppercase text-slate-500">Selected</p><p className="mt-1 text-2xl font-bold text-slate-950">{selectedLeads.length}</p></div><div className="rounded-md border border-slate-200 p-3"><p className="text-xs font-semibold uppercase text-slate-500">Will send</p><p className="mt-1 text-2xl font-bold text-slate-950">{sendableLeads.length}</p></div><div className="rounded-md border border-slate-200 p-3"><p className="text-xs font-semibold uppercase text-slate-500">Limit</p><p className="mt-1 text-2xl font-bold text-slate-950">{bulkSendLimit}</p></div></div>
              {skippedLeads.length > 0 && <div className="rounded-md border border-amber-200 bg-amber-50 p-4"><p className="text-sm font-bold text-amber-900">Skipped leads</p><ul className="mt-2 space-y-1 text-sm text-amber-900">{skippedLeads.map(({ lead, reason }) => <li key={`${lead.id}-${reason}`}><span className="font-semibold">{lead.name}</span>: {reason}</li>)}</ul></div>}
              {sendableLeads.length > 0 ? <div><p className="text-sm font-bold text-slate-900">Leads that will receive emails</p><ul className="mt-2 max-h-32 space-y-1 overflow-y-auto rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">{sendableLeads.map((lead) => <li key={lead.id}>{lead.name} <span className="text-slate-500">({lead.email})</span></li>)}</ul></div> : <p className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">No selected leads are eligible for bulk email sending.</p>}
              {!bulkResult && <label className="block text-sm font-medium text-slate-700">Type SEND to confirm<Input value={bulkConfirmText} onChange={(event) => setBulkConfirmText(event.target.value)} disabled={bulkWorking} className="mt-1" placeholder="SEND" /></label>}
              {bulkMode === "ai" && <p className="rounded-md bg-slate-50 p-3 text-sm font-semibold text-slate-700">Sending {bulkProgress} of {sendableLeads.length}...</p>}
              {bulkResult && <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700"><p className="font-bold text-slate-950">Bulk send complete: {bulkResult.sent} sent, {bulkResult.failed.length} failed.</p>{bulkResult.failed.length > 0 && <ul className="mt-2 space-y-1">{bulkResult.failed.map((failure) => <li key={`${failure.name}-${failure.error}`}><span className="font-semibold">{failure.name}:</span> {failure.error}</li>)}</ul>}</div>}
            </div>
            <div className="flex flex-col-reverse gap-2 border-t border-slate-200 p-5 sm:flex-row sm:justify-end"><Button type="button" variant="secondary" disabled={bulkWorking} onClick={() => setBulkConfirmOpen(false)}>{bulkResult ? "Done" : "Cancel"}</Button>{!bulkResult && <Button type="button" disabled={bulkWorking || bulkConfirmText !== "SEND" || sendableLeads.length === 0} onClick={bulkSendAiReplies}><Mail className="h-4 w-4" />{bulkMode === "ai" ? `Sending ${bulkProgress} of ${sendableLeads.length}...` : "Generate and Send Emails"}</Button>}</div>
          </div>
        </div>
      )}

      {messageLead && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4"><div className="w-full max-w-lg rounded-lg bg-white shadow-soft"><div className="flex items-center justify-between border-b border-slate-200 p-5"><h2 className="text-lg font-bold text-slate-950">Message from {messageLead.name}</h2><button onClick={() => setMessageLead(null)} className="rounded-md p-2 hover:bg-slate-100"><X className="h-5 w-5" /></button></div><p className="whitespace-pre-wrap p-5 text-sm leading-6 text-slate-700">{messageLead.message}</p></div></div>}

      {aiReply && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4 py-6">
          <div className="w-full max-w-2xl rounded-lg bg-white shadow-soft">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5"><div><p className="text-sm font-semibold uppercase text-rescue-700">AI Reply Draft</p><h2 className="mt-1 text-xl font-bold text-slate-950">{aiReply.lead.name}</h2><p className="mt-1 text-sm text-slate-500">Review and edit the response before sending it to {aiReply.lead.email}.</p></div><button onClick={() => setAiReply(null)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100" aria-label="Close AI reply draft"><X className="h-5 w-5" /></button></div>
            <div className="space-y-4 p-5">{aiReply.loading && <p className="rounded-md bg-slate-50 p-4 text-sm text-slate-600">Generating AI reply...</p>}{aiReply.error && <p className="rounded-md bg-red-50 p-4 text-sm font-medium text-red-700">{aiReply.error}</p>}{aiReply.sent && <p className="rounded-md bg-rescue-50 p-4 text-sm font-medium text-rescue-700">AI reply sent successfully.</p>}{aiReply.copied && <p className="rounded-md bg-slate-50 p-4 text-sm font-medium text-slate-700">Response copied to clipboard.</p>}{!aiReply.loading && !aiReply.error && <label className="block text-sm font-medium text-slate-700">Generated response. You can edit this before sending.<Textarea value={aiReply.reply} onChange={(event) => setAiReply({ ...aiReply, reply: event.target.value, sent: false, copied: false })} className="mt-2 min-h-44" /></label>}</div>
            <div className="flex flex-col-reverse gap-2 border-t border-slate-200 p-5 sm:flex-row sm:justify-end"><Button type="button" variant="secondary" onClick={() => setAiReply(null)}>Close</Button>{!aiReply.loading && !aiReply.error && <><Button type="button" variant="secondary" onClick={copyAiReply} disabled={!aiReply.reply.trim()}><Copy className="h-4 w-4" />Copy Response</Button><Button type="button" onClick={sendAiReply} disabled={aiReply.sending || !aiReply.reply.trim()}><Mail className="h-4 w-4" />{aiReply.sending ? "Sending..." : "Send Email"}</Button></>}</div>
          </div>
        </div>
      )}
    </>
  );
}
