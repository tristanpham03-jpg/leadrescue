import { redirect } from "next/navigation";
import { EmptyState } from "@/components/ui/EmptyState";
import { LeadForm } from "@/components/forms/LeadForm";
import { LeadsTable } from "@/components/leads/LeadsTable";
import { getBusinessForUser, getCurrentUser, getLeadsForBusiness } from "@/lib/data";

export default async function LeadsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const business = await getBusinessForUser(user.id);
  if (!business) return <EmptyState title="Business profile required" description="Create a business profile before adding leads." />;

  const leads = await getLeadsForBusiness(business.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-950">Leads</h1>
        <p className="mt-1 text-slate-500">Search, filter, export, edit, and delete lead records.</p>
      </div>
      <LeadForm />
      <LeadsTable leads={leads} />
    </div>
  );
}
