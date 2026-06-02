import { redirect } from "next/navigation";
import { AutomationForm } from "@/components/forms/AutomationForm";
import { EmptyState } from "@/components/ui/EmptyState";
import { getBusinessForUser, getCurrentUser } from "@/lib/data";

export default async function AutomationSettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const business = await getBusinessForUser(user.id);
  if (!business) return <EmptyState title="Business profile required" description="Create a business profile before editing follow-up templates." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-950">Follow-up automation</h1>
        <p className="mt-1 text-slate-500">Customize owner reminders for New leads after 24 hours and Contacted leads after 3 days.</p>
      </div>
      <AutomationForm business={business} />
    </div>
  );
}
