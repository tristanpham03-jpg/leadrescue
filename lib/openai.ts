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
    "Write a concise first-response email to a new website lead for a local service business.",
    `Tone: ${business.ai_tone ?? "Professional"}. Keep it local, clear, and not pushy.`,
    `Business: ${business.business_name}`,
    `Industry: ${business.industry}`,
    `Service area: ${business.service_area}`,
    `Services: ${business.services_offered.join(", ")}`,
    `Lead name: ${lead.name}`,
    `Lead message: ${lead.message}`,
    `Sign the email with exactly: ${business.business_name}`,
    "Do not use placeholders like [Your Name], [Business Name], or [Company Name].",
    "Mention the business name and the requested service issue. Say the team will reach out shortly. Return only the email body."
  ].join("\n");
}

export async function generateLeadResponse(business: Business, lead: Pick<Lead, "name" | "message">) {
  const openai = getOpenAI();
  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    messages: [
      { role: "system", content: "You write short, polished customer follow-up emails for local service businesses." },
      { role: "user", content: buildLeadResponsePrompt(business, lead) }
    ],
    temperature: 0.5,
    max_tokens: 180
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
