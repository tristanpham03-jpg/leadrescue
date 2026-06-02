import { redirect } from "next/navigation";
import { BusinessForm } from "@/components/forms/BusinessForm";
import { getBusinessForUser, getCurrentUser } from "@/lib/data";

export default async function BusinessPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const business = await getBusinessForUser(user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-950">Business profile</h1>
        <p className="mt-1 text-slate-500">LeadRescue uses this context for AI responses and owner notifications.</p>
      </div>
      <BusinessForm business={business} />
    </div>
  );
}
