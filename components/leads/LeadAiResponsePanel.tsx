"use client";

import { useState } from "react";
import { Bot, Copy, Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";

export function LeadAiResponsePanel({
  leadId,
  leadEmail,
  initialResponse
}: {
  leadId: string;
  leadEmail: string;
  initialResponse: string | null;
}) {
  const [response, setResponse] = useState(initialResponse ?? "");
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generateResponse() {
    setGenerating(true);
    setError(null);
    setCopied(false);
    setSent(false);

    const result = await fetch(`/api/leads/${leadId}/ai-reply`, { method: "POST" });
    const payload = await result.json().catch(() => ({}));
    setGenerating(false);

    if (!result.ok) {
      setError(payload.error ?? "Unable to generate AI reply.");
      return;
    }

    setResponse(payload.reply ?? "");
  }

  async function copyResponse() {
    if (!response.trim()) return;
    await navigator.clipboard.writeText(response);
    setCopied(true);
    setSent(false);
  }

  async function sendEmail() {
    if (!response.trim()) return;
    setSending(true);
    setError(null);
    setCopied(false);
    setSent(false);

    const result = await fetch(`/api/leads/${leadId}/send-reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reply: response })
    });
    const payload = await result.json().catch(() => ({}));
    setSending(false);

    if (!result.ok) {
      setError(payload.error ?? "Unable to send AI reply.");
      return;
    }

    setSent(true);
  }

  return (
    <section className="rounded-lg border border-rescue-100 bg-rescue-50 p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-bold text-rescue-700">AI response</p>
          <p className="mt-1 text-sm text-slate-600">Generate, edit, copy, or send this response to {leadEmail}.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" variant="secondary" onClick={generateResponse} disabled={generating}>
            <Bot className="h-4 w-4" />
            {generating ? "Generating..." : response.trim() ? "Regenerate AI Response" : "Generate AI Reply"}
          </Button>
          <Button type="button" variant="secondary" onClick={copyResponse} disabled={!response.trim()}>
            <Copy className="h-4 w-4" />
            Copy Response
          </Button>
          <Button type="button" onClick={sendEmail} disabled={sending || !response.trim()}>
            <Mail className="h-4 w-4" />
            {sending ? "Sending..." : "Send Email"}
          </Button>
        </div>
      </div>

      <Textarea
        value={response}
        placeholder="No AI response yet. Click Generate AI Reply to create a draft."
        onChange={(event) => {
          setResponse(event.target.value);
          setCopied(false);
          setSent(false);
          setError(null);
        }}
        className="mt-4 min-h-40 bg-white"
      />

      {copied && <p className="mt-3 rounded-md bg-white p-3 text-sm font-medium text-slate-700">Response copied to clipboard.</p>}
      {sent && <p className="mt-3 rounded-md bg-white p-3 text-sm font-medium text-rescue-700">Email sent successfully.</p>}
      {error && <p className="mt-3 rounded-md bg-red-50 p-3 text-sm font-medium text-red-700">{error}</p>}
    </section>
  );
}
