import { redirect } from "next/navigation";
import { EmptyState } from "@/components/ui/EmptyState";
import { WebsiteSetupForm } from "@/components/forms/WebsiteSetupForm";
import { getBusinessForUser, getCurrentUser } from "@/lib/data";

export default async function WebsiteSetupPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const business = await getBusinessForUser(user.id);

  if (!business) {
    return <EmptyState title="Business profile required" description="Create a business profile before connecting your website." />;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase text-rescue-700">Website Setup</p>
        <h1 className="text-3xl font-bold text-slate-950">Connect your website</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Share your hosted LeadRescue form or embed it directly on your website so new requests flow into your leads dashboard.
        </p>
      </div>
      <WebsiteSetupForm business={business} appUrl={appUrl} />
    </div>
  );
}
