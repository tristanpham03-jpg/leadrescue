import { Resend } from "resend";
import type { Business, Lead } from "@/lib/types";

export class EmailConfigurationError extends Error {
  constructor() {
    super("Email sending is not configured yet.");
    this.name = "EmailConfigurationError";
  }
}

export class EmailDeliveryError extends Error {
  constructor(message = "Email could not be sent. Please try again.") {
    super(message);
    this.name = "EmailDeliveryError";
  }
}

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    throw new EmailConfigurationError();
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const result = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL,
    to,
    subject,
    html
  });

  if ("error" in result && result.error) {
    console.error("Resend email send failed", result.error);
    throw new EmailDeliveryError(typeof result.error === "object" && "message" in result.error ? String(result.error.message) : undefined);
  }

  return result;
}

export function leadResponseHtml(body: string) {
  return `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">${body.replaceAll("\n", "<br />")}</div>`;
}

export function ownerNotificationHtml(business: Business, lead: Lead) {
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
      <h2>New LeadRescue lead for ${business.business_name}</h2>
      <p><strong>Name:</strong> ${lead.name}</p>
      <p><strong>Email:</strong> ${lead.email}</p>
      <p><strong>Phone:</strong> ${lead.phone ?? "Not provided"}</p>
      <p><strong>Message:</strong><br />${lead.message}</p>
    </div>
  `;
}
