export type LeadStatus = "New" | "Contacted" | "Quoted" | "Won" | "Lost";
export type Industry =
  | "Plumbing"
  | "HVAC"
  | "Electrical"
  | "Landscaping"
  | "Roofing"
  | "General Home Services";

export type PlanCode = "starter" | "pro" | "agency";
export type AiTone = "Professional" | "Friendly" | "Urgent" | "Short and Direct";

export type Business = {
  id: string;
  user_id: string;
  business_name: string;
  industry: Industry;
  service_area: string;
  phone: string;
  email: string;
  description: string;
  services_offered: string[];
  hours_of_operation: string;
  reminder_24h_template: string;
  reminder_72h_template: string;
  follow_up_reminders_enabled: boolean;
  ai_tone: AiTone;
  capture_form_headline: string | null;
  capture_form_button_text: string | null;
  capture_form_success_message: string | null;
  capture_form_primary_color: string | null;
  capture_form_services: string[] | null;
  onboarding_website_link_copied: boolean;
  onboarding_automation_reviewed: boolean;
  created_at: string;
  updated_at: string;
};

export type Lead = {
  id: string;
  business_id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  status: LeadStatus;
  ai_response: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Subscription = {
  id: string;
  user_id: string;
  business_id: string;
  plan: PlanCode;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: string;
  current_period_end: string | null;
  created_at: string;
};

export type DashboardStats = {
  totalLeads: number;
  newLeads: number;
  contactedLeads: number;
  quotedLeads: number;
  wonLeads: number;
  lostLeads: number;
  leadsNeedingFollowUp: number;
  leadsThisMonth: number;
  responseRate: number;
  conversionRate: number;
  byStatus: Array<{ status: LeadStatus; count: number }>;
};
