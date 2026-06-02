import { redirect } from "next/navigation";
import { EmptyState } from "@/components/ui/EmptyState";
import { TrashLeadsTable } from "@/components/leads/TrashLeadsTable";
import { getBusinessForUser, getCurrentUser, getDeletedLeadsForBusiness } from "@/lib/data";

export default async function TrashPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const business = await getBusinessForUser(user.id);
  if (!business) return <EmptyState title="Business profile required" description="Create a business profile before viewing deleted leads." />;

  const leads = await getDeletedLeadsForBusiness(business.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-950">Trash</h1>
        <p className="mt-1 text-slate-500">Restore leads that were deleted by mistake.</p>
      </div>
      <TrashLeadsTable leads={leads} />
    </div>
  );
}
