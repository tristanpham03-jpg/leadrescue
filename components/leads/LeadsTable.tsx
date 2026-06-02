"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bot, Copy, Download, Eye, Mail, Phone, Search, Trash2, X } from "lucide-react";
import type { Lead, LeadStatus } from "@/lib/types";
import { formatRelativeTime } from "@/lib/time";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";

const statuses: Array<LeadStatus | "All"> = ["All", "New", "Contacted", "Quoted", "Won", "Lost"];
const editableStatuses = statuses.filter((status): status is LeadStatus => status !== "All");
const pageSize = 10;
type SortKey = "created_at" | "status" | "name";
type SortDirection = "asc" | "desc";

type AiReplyState = {
  lead: Lead;
  reply: string;
  error: string | null;
  loading: boolean;
  sending: boolean;
  sent: boolean;
  copied: boolean;
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

  useEffect(() => setActiveLeads(leads), [leads]);
  useEffect(() => setPage(1), [query, status, sortKey, sortDirection]);

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
        {message && <p className="mx-4 mt-4 rounded-md border border-rescue-100 bg-rescue-50 p-3 text-sm font-medium text-rescue-700">{message}</p>}
        <div className="w-full overflow-x-auto">
          <table className="min-w-[1120px] table-fixed text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
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
                  <td className="px-4 py-3 font-semibold text-slate-950"><Highlight value={lead.name} query={query} /></td>
                  <td className="px-4 py-3 text-slate-600">
                    <a href={`mailto:${lead.email}`} onClick={(event) => event.stopPropagation()} className="inline-flex items-center gap-1 text-rescue-700 hover:underline"><Mail className="h-3.5 w-3.5" /><Highlight value={lead.email} query={query} /></a>
                    <br />
                    {lead.phone && <a href={`tel:${lead.phone}`} onClick={(event) => event.stopPropagation()} className="mt-1 inline-flex items-center gap-1 text-slate-600 hover:text-rescue-700 hover:underline"><Phone className="h-3.5 w-3.5" /><Highlight value={lead.phone} query={query} /></a>}
                  </td>
                  <td className="px-4 py-3 text-slate-600"><span className="line-clamp-1 inline-block max-w-56 align-middle"><Highlight value={lead.message} query={query} /></span><button onClick={(event) => { event.stopPropagation(); setMessageLead(lead); }} className="ml-2 inline-flex items-center gap-1 text-xs font-semibold text-rescue-700 hover:underline"><Eye className="h-3.5 w-3.5" />View</button></td>
                  <td className="px-4 py-3"><select value={lead.status} disabled={statusUpdatingId === lead.id} onClick={(event) => event.stopPropagation()} onChange={(event) => updateStatus(lead, event.target.value as LeadStatus)} className={`h-8 min-w-28 rounded-md border px-2 text-xs font-bold outline-none focus:ring-2 focus:ring-rescue-500 ${statusBadgeClass(lead.status)}`}>{editableStatuses.map((leadStatus) => <option key={leadStatus}>{leadStatus}</option>)}</select></td>
                  <td className="px-4 py-3 text-slate-500">{formatRelativeTime(lead.created_at)}</td>
                  <td className="px-4 py-3"><Button variant="secondary" onClick={(event) => { event.stopPropagation(); generateAiReply(lead); }} className="h-8 px-3 text-xs"><Bot className="h-4 w-4" />Generate</Button></td>
                  <td className="px-4 py-3 text-right"><button onClick={(event) => { event.stopPropagation(); deleteLead(lead.id); }} className="rounded-md p-2 text-red-600 hover:bg-red-50" aria-label="Move lead to trash"><Trash2 className="h-4 w-4" /></button></td>
                </tr>
              ))}
              {!paginatedLeads.length && <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">{activeLeads.length ? "No leads match your search." : "No leads yet. Submit a test lead or connect your website to start capturing customers."}</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-3 border-t border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">Showing {filteredLeads.length ? (page - 1) * pageSize + 1 : 0}-{Math.min(page * pageSize, filteredLeads.length)} of {filteredLeads.length} leads</p>
          <div className="flex gap-2"><Button variant="secondary" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</Button><Button variant="secondary" disabled={page === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>Next</Button></div>
        </div>
      </div>

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
