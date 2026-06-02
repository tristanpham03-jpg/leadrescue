"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DashboardStats } from "@/lib/types";

export function LeadStatusChart({ stats }: { stats: DashboardStats }) {
  return (
    <div className="h-72 rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="mb-4 text-lg font-bold text-slate-950">Lead pipeline</h2>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart data={stats.byStatus}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="status" tickLine={false} axisLine={false} fontSize={12} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
          <Tooltip />
          <Bar dataKey="count" fill="#12b981" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
