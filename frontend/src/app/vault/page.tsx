"use client";

import { useEffect, useMemo, useState } from "react";
import { FileLock2, Search, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Surface, inputClass } from "@/components/ui";
import { api } from "@/lib/api";
import type { DocumentCategory, TrustDocument } from "@/lib/types";

const categories: Array<DocumentCategory | "All"> = ["All", "Medical", "Finance", "Education", "Legal", "Identity", "General"];

export default function VaultPage() {
  const [documents, setDocuments] = useState<TrustDocument[]>([]);
  const [category, setCategory] = useState<DocumentCategory | "All">("All");
  const [query, setQuery] = useState("");

  useEffect(() => {
    api<TrustDocument[]>("/api/documents").then(setDocuments).catch(() => setDocuments([]));
  }, []);

  const filtered = useMemo(() => {
    return documents.filter((document) => {
      const categoryMatch = category === "All" || document.category === category;
      const queryMatch = `${document.title} ${document.summary} ${document.category}`.toLowerCase().includes(query.toLowerCase());
      return categoryMatch && queryMatch;
    });
  }, [category, documents, query]);

  return (
    <AppShell title="Document vault" subtitle="Browse encrypted documents by category, inspect redacted fields, and choose evidence for disclosure workflows.">
      <div className="grid gap-5">
        <Surface className="p-5">
          <div className="grid gap-4 md:grid-cols-[1fr_auto]">
            <label className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#82968e]" size={18} />
              <input className={`${inputClass} w-full pl-11`} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by title, summary, or category" />
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((item) => (
                <button
                  key={item}
                  onClick={() => setCategory(item)}
                  className={`focus-ring min-h-11 rounded-full px-4 text-sm font-semibold transition ${
                    category === item ? "bg-[#071510] text-white" : "border border-[#cdded6] bg-white text-[#315147] hover:bg-[#f4faf7]"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </Surface>

        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((document) => (
            <Surface key={document.id} className="p-6">
              <div className="flex items-start justify-between gap-5">
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#08734f]">
                    <FileLock2 size={17} />
                    {document.category}
                  </div>
                  <h2 className="mt-3 text-2xl font-semibold">{document.title}</h2>
                  <p className="mt-3 text-sm leading-6 text-[#607069]">{document.summary}</p>
                </div>
                <div className="rounded-full bg-[#e5f7ef] px-3 py-1 text-xs font-semibold text-[#08734f]">Encrypted</div>
              </div>

              <div className="mt-6 grid gap-3">
                {document.fields.slice(0, 5).map((field) => (
                  <div key={field.id} className="flex items-center justify-between border-t border-[#edf2ef] pt-3">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <ShieldCheck size={15} className="text-[#0f9f6e]" />
                      {field.label}
                    </span>
                    <span className="text-sm text-[#607069]">{field.redactedValue}</span>
                  </div>
                ))}
                {document.fields.length === 0 ? <p className="border-t border-[#edf2ef] pt-3 text-sm text-[#607069]">No protected fields detected.</p> : null}
              </div>
            </Surface>
          ))}
        </div>

        {filtered.length === 0 ? (
          <Surface className="p-10 text-center">
            <FileLock2 className="mx-auto text-[#0f9f6e]" size={38} />
            <h2 className="mt-4 text-2xl font-semibold">No documents found</h2>
            <p className="mt-2 text-sm text-[#607069]">Upload documents or adjust the vault filters.</p>
          </Surface>
        ) : null}
      </div>
    </AppShell>
  );
}
