"use client";

import { useState } from "react";
import Link from "next/link";
import { RotateCcw } from "lucide-react";
import type { Lead } from "@/lib/types";
import { Button } from "@/components/ui/Button";

function daysRemaining(deletedAt: string | null) {
  if (!deletedAt) return 30;
  const deletedTime = new Date(deletedAt).getTime();
  const expiresTime = deletedTime + 30 * 24 * 60 * 60 * 1000;
  return Math.max(0, Math.ceil((expiresTime - Date.now()) / (24 * 60 * 60 * 1000)));
}

export function TrashLeadsTable({ leads }: { leads: Lead[] }) {
  const [deletedLeads, setDeletedLeads] = useState(leads);
  const [message, setMessage] = useState<string | null>(null);

  async function restoreLead(id: string) {
    const response = await fetch(`/api/leads/${id}/restore`, { method: "POST" });
    if (response.ok) {
      setDeletedLeads((current) => current.filter((lead) => lead.id !== id));
      setMessage("Lead restored from trash.");
      return;
    }

    window.alert("Unable to restore lead.");
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-950">Recently deleted</h2>
          <p className="mt-1 text-sm text-slate-500">Deleted leads stay here for 30 days and can be restored.</p>
        </div>
        <Link href="/leads" className="text-sm font-semibold text-rescue-700">
          Back to leads
        </Link>
      </div>
      {message && <p className="mx-4 mt-4 rounded-md border border-rescue-100 bg-rescue-50 p-3 text-sm font-medium text-rescue-700">{message}</p>}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Lead</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Deleted</th>
              <th className="px-4 py-3">Days left</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {deletedLeads.map((lead) => (
              <tr key={lead.id}>
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-950">{lead.name}</p>
                  <p className="mt-1 max-w-sm truncate text-slate-500">{lead.message}</p>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {lead.email}
                  <br />
                  {lead.phone}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">{lead.status}</span>
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {lead.deleted_at ? new Date(lead.deleted_at).toLocaleDateString() : "Recently"}
                </td>
                <td className="px-4 py-3 text-slate-500">{daysRemaining(lead.deleted_at)}</td>
                <td className="px-4 py-3 text-right">
                  <Button variant="secondary" onClick={() => restoreLead(lead.id)}>
                    <RotateCcw className="h-4 w-4" />
                    Restore
                  </Button>
                </td>
              </tr>
            ))}
            {!deletedLeads.length && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                  No recently deleted leads.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
