"use client";

import { FormEvent, useState } from "react";
import { FileUp, ShieldCheck, UploadCloud } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button, Field, Surface, inputClass } from "@/components/ui";
import { apiUrl } from "@/lib/api";
import { authHeaders } from "@/lib/auth";
import type { TrustDocument } from "@/lib/types";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [document, setDocument] = useState<TrustDocument | null>(null);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("title", title || file.name);
      const response = await fetch(apiUrl("/api/documents"), { method: "POST", body: form, headers: authHeaders() });
      if (!response.ok) throw new Error((await response.json()).error ?? "Upload failed");
      setDocument((await response.json()) as TrustDocument);
      setFile(null);
      setTitle("");
      const fileInput = event.currentTarget.querySelector("input[type=file]") as HTMLInputElement | null;
      if (fileInput) fileInput.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell title="Upload document" subtitle="Encrypt a document, run OCR/text extraction, detect protected fields, and add it to the AI-searchable vault.">
      <div className="grid gap-5 xl:grid-cols-[0.85fr_1fr]">
        <Surface className="p-6">
          <form onSubmit={submit} className="grid gap-5">
            <div className="rounded-[26px] border border-dashed border-[#a8c9ba] bg-[#f4faf7] p-8 text-center">
              <UploadCloud className="mx-auto text-[#0f9f6e]" size={42} />
              <h2 className="mt-4 text-2xl font-semibold">Secure intake</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#607069]">
                PDFs, images, and text files are encrypted before storage. OCR and privacy indexing happen server-side.
              </p>
              <input
                className="focus-ring mt-6 w-full rounded-2xl border border-[#cdded6] bg-white p-3 text-sm"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.txt,.md,image/*,application/pdf,text/*"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                required
              />
            </div>
            <Field label="Display title">
              <input className={inputClass} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Income certificate, passport, medical report..." />
            </Field>
            {error ? <p className="rounded-2xl bg-[#fff4f1] p-3 text-sm text-[#9b3d2d]">{error}</p> : null}
            <Button disabled={!file || loading}>
              <FileUp size={18} />
              {loading ? "Encrypting and indexing" : "Upload to vault"}
            </Button>
          </form>
        </Surface>

        <Surface className="p-6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="text-[#0f9f6e]" size={24} />
            <h2 className="text-2xl font-semibold">Index result</h2>
          </div>
          {document ? (
            <div className="mt-6 grid gap-5">
              <div>
                <div className="text-sm text-[#607069]">Document</div>
                <div className="mt-1 text-xl font-semibold">{document.title}</div>
                <p className="mt-3 text-sm leading-6 text-[#607069]">{document.summary}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-[18px] bg-[#f4faf7] p-4">
                  <div className="text-xs text-[#607069]">Category</div>
                  <div className="mt-2 font-semibold">{document.category}</div>
                </div>
                <div className="rounded-[18px] bg-[#f4faf7] p-4">
                  <div className="text-xs text-[#607069]">Protected fields</div>
                  <div className="mt-2 font-semibold">{document.fields.length}</div>
                </div>
                <div className="rounded-[18px] bg-[#f4faf7] p-4">
                  <div className="text-xs text-[#607069]">Storage</div>
                  <div className="mt-2 font-semibold">AES-256-GCM</div>
                </div>
              </div>
              <div className="grid gap-2">
                {document.fields.map((field) => (
                  <div key={field.id} className="flex items-center justify-between rounded-2xl border border-[#dce8e2] bg-white px-4 py-3">
                    <span className="font-medium">{field.label}</span>
                    <span className="text-sm text-[#607069]">{field.redactedValue}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-8 rounded-[22px] bg-[#f4faf7] p-8 text-sm leading-6 text-[#607069]">
              Upload a document to see extraction, category classification, privacy-field detection, and agent audit output.
            </div>
          )}
        </Surface>
      </div>
    </AppShell>
  );
}
