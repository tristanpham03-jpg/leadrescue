import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LeadForm } from "@/components/forms/LeadForm";
import { LeadAiResponsePanel } from "@/components/leads/LeadAiResponsePanel";
import { getBusinessForUser, getCurrentUser } from "@/lib/data";
import { formatFullTimestamp, formatLeadAge } from "@/lib/time";
import type { Lead } from "@/lib/types";

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const business = await getBusinessForUser(user.id);
  if (!business) notFound();

  const supabase = await createClient();
  const { id } = await params;
  const { data } = await supabase
    .from("leads")
    .select("*")
    .eq("id", id)
    .eq("business_id", business.id)
    .is("deleted_at", null)
    .maybeSingle();
  const lead = data as Lead | null;
  if (!lead) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-950">{lead.name}</h1>
          <p className="mt-1 text-slate-500">{lead.email}</p>
          <p className="mt-2 text-sm text-slate-500">
            Created {formatFullTimestamp(lead.created_at)} · {formatLeadAge(lead.created_at)}
          </p>
        </div>
      </div>
      <LeadAiResponsePanel leadId={lead.id} leadEmail={lead.email} initialResponse={lead.ai_response} />
      <LeadForm lead={lead} />
    </div>
  );
}
