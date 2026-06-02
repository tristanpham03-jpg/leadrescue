import { CheckCircle2, ClipboardList, Handshake, Inbox, MessageCircle, Trophy } from "lucide-react";
import type { DashboardStats } from "@/lib/types";

export function StatsCards({ stats }: { stats: DashboardStats }) {
  const cards = [
    { label: "Total Leads", value: stats.totalLeads, icon: Inbox, color: "text-slate-700" },
    { label: "New Leads", value: stats.newLeads, icon: ClipboardList, color: "text-blue-600" },
    { label: "Contacted Leads", value: stats.contactedLeads, icon: MessageCircle, color: "text-yellow-600" },
    { label: "Quoted Leads", value: stats.quotedLeads, icon: Handshake, color: "text-purple-600" },
    { label: "Won Leads", value: stats.wonLeads, icon: Trophy, color: "text-rescue-600" },
    { label: "Conversion Rate", value: `${stats.conversionRate}%`, icon: CheckCircle2, color: "text-rescue-600" }
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
      {cards.map((card) => (
        <div key={card.label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-slate-500">{card.label}</p>
            <card.icon className={`h-5 w-5 ${card.color}`} />
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-950">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
