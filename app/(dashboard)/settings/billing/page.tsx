import { redirect } from "next/navigation";
import { BillingButton } from "@/components/forms/BillingButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { plans } from "@/lib/plans";
import { getBusinessForUser, getCurrentUser, getSubscriptionForBusiness } from "@/lib/data";
import type { PlanCode } from "@/lib/types";

export default async function BillingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const business = await getBusinessForUser(user.id);
  if (!business) return <EmptyState title="Business profile required" description="Create a business profile before choosing a plan." />;
  const subscription = await getSubscriptionForBusiness(business.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-950">Billing</h1>
        <p className="mt-1 text-slate-500">Current plan: {subscription?.plan ?? "none"}</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {(Object.keys(plans) as PlanCode[]).map((planCode) => {
          const plan = plans[planCode];
          return (
            <div key={planCode} className="rounded-lg border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-bold">{plan.name}</h2>
              <p className="mt-2 text-3xl font-bold">${plan.price}<span className="text-base font-medium text-slate-500">/mo</span></p>
              <p className="mt-1 text-sm text-slate-500">{plan.leadsPerMonth} leads/month</p>
              <ul className="my-5 space-y-2 text-sm text-slate-600">
                {plan.features.map((feature) => <li key={feature}>{feature}</li>)}
              </ul>
              <BillingButton plan={planCode} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
