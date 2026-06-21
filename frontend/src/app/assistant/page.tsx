"use client";

import { FormEvent, useEffect, useState } from "react";
import { Bot, Send, Sparkles } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button, Surface, inputClass } from "@/components/ui";
import { api } from "@/lib/api";
import type { TrustDocument } from "@/lib/types";

interface ChatResponse {
  answer: string;
  model: string;
  usedOpenAI: boolean;
  sources: Array<{ id: string; title: string; category: string; fields: number }>;
}

export default function AssistantPage() {
  const [question, setQuestion] = useState("What can you tell me about my income proof without exposing Aadhaar?");
  const [documents, setDocuments] = useState<TrustDocument[]>([]);
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string; meta?: string }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api<TrustDocument[]>("/api/documents").then(setDocuments).catch(() => setDocuments([]));
  }, []);

  async function ask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!question.trim()) return;
    const q = question.trim();
    setQuestion("");
    setMessages((items) => [...items, { role: "user", content: q }]);
    setLoading(true);
    try {
      const result = await api<ChatResponse>("/api/chat", {
        method: "POST",
        body: JSON.stringify({ question: q })
      });
      setMessages((items) => [
        ...items,
        {
          role: "assistant",
          content: result.answer,
          meta: `${result.usedOpenAI ? "OpenAI" : "Local"} · ${result.model} · ${result.sources.map((source) => source.title).join(", ") || "no sources"}`
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell title="AI Vault Assistant" subtitle="Ask questions across encrypted documents. Answers use retrieved vault context and avoid revealing full sensitive identifiers.">
      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <Surface className="flex min-h-[650px] flex-col p-5">
          <div className="flex items-center justify-between gap-4 border-b border-[#edf2ef] pb-4">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#e5f7ef] text-[#08734f]">
                <Bot size={22} />
              </span>
              <div>
                <h2 className="font-semibold">Privacy-aware RAG chat</h2>
                <p className="text-sm text-[#607069]">Grounded in indexed vault documents</p>
              </div>
            </div>
            <Sparkles className="text-[#0f9f6e]" size={23} />
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto py-5">
            {messages.length === 0 ? (
              <div className="rounded-[24px] bg-[#f4faf7] p-6 text-sm leading-6 text-[#607069]">
                Try asking about income, a contract summary, medical report explanation, or which fields should be hidden for a bank, doctor, employer, or lawyer.
              </div>
            ) : null}
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={message.role === "user" ? "ml-auto max-w-[78%]" : "mr-auto max-w-[86%]"}>
                <div
                  className={
                    message.role === "user"
                      ? "rounded-[24px] bg-[#071510] px-5 py-4 text-sm leading-6 text-white"
                      : "rounded-[24px] border border-[#dce8e2] bg-white px-5 py-4 text-sm leading-6 text-[#10231d]"
                  }
                >
                  {message.content}
                </div>
                {message.meta ? <div className="mt-2 text-xs text-[#607069]">{message.meta}</div> : null}
              </div>
            ))}
          </div>

          <form onSubmit={ask} className="flex gap-3 border-t border-[#edf2ef] pt-4">
            <input className={`${inputClass} flex-1`} value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask a private question about your documents" />
            <Button disabled={loading || !question.trim()} className="px-4">
              <Send size={17} />
              Ask
            </Button>
          </form>
        </Surface>

        <Surface className="p-5">
          <h2 className="text-lg font-semibold">Available context</h2>
          <div className="mt-4 grid gap-3">
            {documents.slice(0, 8).map((document) => (
              <div key={document.id} className="border-t border-[#edf2ef] pt-3">
                <div className="font-semibold">{document.title}</div>
                <div className="mt-1 text-xs text-[#607069]">
                  {document.category} · {document.fields.length} protected fields
                </div>
              </div>
            ))}
            {documents.length === 0 ? <p className="text-sm leading-6 text-[#607069]">Upload or seed a document to give the assistant vault context.</p> : null}
          </div>
        </Surface>
      </div>
    </AppShell>
  );
}
