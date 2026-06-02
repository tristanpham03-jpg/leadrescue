import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/ui/EmptyState";
import { LeadStatusChart } from "@/components/dashboard/LeadStatusChart";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { getBusinessForUser, getCurrentUser, getDashboardStats, getLeadsForBusiness } from "@/lib/data";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const business = await getBusinessForUser(user.id);

  if (!business) {
    return (
      <EmptyState
        title="Set up your business profile"
        description="Add your business details so LeadRescue can generate accurate lead responses."
        action={
          <Link href="/business" className="inline-flex h-10 items-center justify-center rounded-md bg-rescue-600 px-4 text-sm font-semibold text-white transition hover:bg-rescue-700">
            Create business profile
          </Link>
        }
      />
    );
  }

  const [stats, leads] = await Promise.all([getDashboardStats(business.id), getLeadsForBusiness(business.id)]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase text-rescue-700">{business.business_name}</p>
          <h1 className="text-3xl font-bold text-slate-950">Lead dashboard</h1>
        </div>
        <Link href={`/capture/${business.id}`} className="text-sm font-semibold text-rescue-700">
          Public lead form
        </Link>
      </div>
      <StatsCards stats={stats} />
      <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <LeadStatusChart stats={stats} />
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-bold text-slate-950">Recent leads</h2>
          <div className="mt-4 space-y-3">
            {leads.slice(0, 5).map((lead) => (
              <Link key={lead.id} href={`/leads/${lead.id}`} className="block rounded-md border border-slate-100 p-3 hover:bg-slate-50">
                <div className="flex justify-between gap-3">
                  <p className="font-semibold text-slate-950">{lead.name}</p>
                  <span className="text-xs font-bold text-slate-500">{lead.status}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-slate-600">{lead.message}</p>
              </Link>
            ))}
            {!leads.length && <p className="text-sm text-slate-500">No leads yet. Submit a test lead or connect your website to start capturing customers.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
