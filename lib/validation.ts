import { z } from "zod";
import { captureFormDefaults } from "@/lib/captureFormDefaults";

export const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Use at least 8 characters")
});

export const businessSchema = z.object({
  business_name: z.string().min(2),
  industry: z.enum(["Plumbing", "HVAC", "Electrical", "Landscaping", "Roofing", "General Home Services"]),
  service_area: z.string().min(2),
  phone: z.string().min(7),
  email: z.string().email(),
  description: z.string().min(20),
  services_offered: z.string().min(2),
  hours_of_operation: z.string().min(2)
});

export const leadSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  message: z.string().min(8)
});

export const leadStatusSchema = z.enum(["New", "Contacted", "Quoted", "Won", "Lost"]);

export const leadUpdateSchema = leadSchema.extend({
  status: leadStatusSchema
});

export const automationTemplateSchema = z.object({
  follow_up_reminders_enabled: z.boolean().default(true),
  ai_tone: z.enum(["Professional", "Friendly", "Urgent", "Short and Direct"]).default("Professional"),
  reminder_24h_template: z.string().min(20),
  reminder_72h_template: z.string().min(20)
});

export const websiteSetupSchema = z.object({
  capture_form_headline: z.string().trim().min(2).default(captureFormDefaults.headline),
  capture_form_button_text: z.string().trim().min(2).default(captureFormDefaults.buttonText),
  capture_form_success_message: z.string().trim().min(8).default(captureFormDefaults.successMessage),
  capture_form_primary_color: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, "Use a valid hex color like #16a34a").default(captureFormDefaults.primaryColor),
  capture_form_services: z.string().optional().default("")
});
