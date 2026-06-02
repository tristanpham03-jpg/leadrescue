import OpenAI from "openai";
import type { Business, Lead } from "@/lib/types";

export class OpenAIConfigurationError extends Error {
  constructor() {
    super("OpenAI is not configured. Add OPENAI_API_KEY to your environment variables and try again.");
    this.name = "OpenAIConfigurationError";
  }
}

function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    throw new OpenAIConfigurationError();
  }

  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export function buildLeadResponsePrompt(business: Business, lead: Pick<Lead, "name" | "message">) {
  return [
    "Write a concise first-response email to a new website lead for a local home-service business.",
    `Tone: ${business.ai_tone ?? "Professional"}. Keep it warm, useful, and easy for a homeowner to understand.`,
    `Business name: ${business.business_name}`,
    `Industry: ${business.industry}`,
    `Service area: ${business.service_area}`,
    `Services offered: ${business.services_offered.join(", ")}`,
    `Hours: ${business.hours_of_operation}`,
    `Customer name: ${lead.name}`,
    `Customer issue or request: ${lead.message}`,
    "Requirements:",
    "- Mention the customer's issue or requested service in plain language.",
    "- Mention the business name naturally in the response.",
    "- Sound professional, local-service-business friendly, and responsive.",
    "- Do not diagnose the issue, promise a fix, guarantee timing, pricing, or availability.",
    "- Say the team will review the request and reach out shortly.",
    `- End with exactly this signature on its own line: ${business.business_name}`,
    "- Do not use placeholders like [Your Name], [Business Name], [Company Name], or a fake person name.",
    "Return only the email body."
  ].join("\n");
}

export async function generateLeadResponse(business: Business, lead: Pick<Lead, "name" | "message">) {
  const openai = getOpenAI();
  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    messages: [
      { role: "system", content: "You write short, polished customer follow-up emails for local service businesses. You never overpromise or invent details." },
      { role: "user", content: buildLeadResponsePrompt(business, lead) }
    ],
    temperature: 0.45,
    max_tokens: 200
  });

  const content = completion.choices[0]?.message.content?.trim();
  if (!content) {
    throw new Error("OpenAI did not return a response. Please try generating the reply again.");
  }

  const normalized = content
    .replaceAll("[Your Name]", business.business_name)
    .replaceAll("[Business Name]", business.business_name)
    .replaceAll("[Company Name]", business.business_name)
    .trim();
  const signature = normalized.split("\n").map((line) => line.trim()).filter(Boolean).at(-1) ?? "";

  return signature.toLowerCase().includes(business.business_name.toLowerCase())
    ? normalized
    : `${normalized}\n\n${business.business_name}`;
}
