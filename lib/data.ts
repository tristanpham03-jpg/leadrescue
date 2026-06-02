import { subDays, startOfMonth } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import type { Business, DashboardStats, Lead, LeadStatus, Subscription } from "@/lib/types";

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return user;
}

export async function getBusinessForUser(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("businesses").select("*").eq("user_id", userId).maybeSingle();
  return data as Business | null;
}

export async function getSubscriptionForBusiness(businessId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data as Subscription | null;
}

export async function getLeadsForBusiness(businessId: string, status?: string, search?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("leads")
    .select("*")
    .eq("business_id", businessId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (status && status !== "All") query = query.eq("status", status);
  if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,message.ilike.%${search}%`);

  const { data } = await query;
  return (data ?? []) as Lead[];
}

export async function getDeletedLeadsForBusiness(businessId: string) {
  const supabase = await createClient();
  const cutoff = subDays(new Date(), 30).toISOString();
  const { data } = await supabase
    .from("leads")
    .select("*")
    .eq("business_id", businessId)
    .not("deleted_at", "is", null)
    .gte("deleted_at", cutoff)
    .order("deleted_at", { ascending: false });

  return (data ?? []) as Lead[];
}

export async function getDashboardStats(businessId: string): Promise<DashboardStats> {
  const supabase = await createClient();
  const monthStart = startOfMonth(new Date()).toISOString();
  const { data: leads } = await supabase.from("leads").select("*").eq("business_id", businessId).is("deleted_at", null);
  const allLeads = (leads ?? []) as Lead[];
  const contactedStatuses: LeadStatus[] = ["Contacted", "Quoted", "Won"];
  const byStatus = (["New", "Contacted", "Quoted", "Won", "Lost"] as LeadStatus[]).map((status) => ({
    status,
    count: allLeads.filter((lead) => lead.status === status).length
  }));

  return {
    totalLeads: allLeads.length,
    newLeads: allLeads.filter((lead) => lead.status === "New").length,
    contactedLeads: allLeads.filter((lead) => lead.status === "Contacted").length,
    quotedLeads: allLeads.filter((lead) => lead.status === "Quoted").length,
    wonLeads: allLeads.filter((lead) => lead.status === "Won").length,
    leadsThisMonth: allLeads.filter((lead) => lead.created_at >= monthStart).length,
    responseRate: allLeads.length ? Math.round((allLeads.filter((lead) => Boolean(lead.ai_response)).length / allLeads.length) * 100) : 0,
    conversionRate: allLeads.length ? Math.round((allLeads.filter((lead) => lead.status === "Won").length / allLeads.length) * 100) : 0,
    byStatus: byStatus.filter((item) => item.count > 0 || contactedStatuses.includes(item.status))
  };
}
