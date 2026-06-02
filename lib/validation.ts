import { z } from "zod";

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
