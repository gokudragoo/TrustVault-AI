"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, KeyRound, Link2, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button, Field, Surface, inputClass } from "@/components/ui";
import { api } from "@/lib/api";
import type { AppSettings, ShareLink, TrustDocument } from "@/lib/types";

export default function PermissionsPage() {
  const [documents, setDocuments] = useState<TrustDocument[]>([]);
  const [documentId, setDocumentId] = useState("");
  const [recipient, setRecipient] = useState("SBI Bank");
  const [role, setRole] = useState("Bank verifier");
  const [expiryHours, setExpiryHours] = useState(24);
  const [allowedFields, setAllowedFields] = useState<string[]>([]);
  const [hiddenFields, setHiddenFields] = useState<string[]>([]);
  const [share, setShare] = useState<ShareLink | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api<TrustDocument[]>("/api/documents")
      .then((items) => {
        setDocuments(items);
        if (items[0]) {
          setDocumentId(items[0].id);
          applyDefaultPolicy(items[0]);
        }
      })
      .catch(() => setDocuments([]));
    api<AppSettings>("/api/settings")
      .then((settings) => setExpiryHours(settings.defaultExpiryHours))
      .catch(() => undefined);
  }, []);

  const selected = useMemo(() => documents.find((document) => document.id === documentId), [documentId, documents]);

  function applyDefaultPolicy(document: TrustDocument) {
    const firstAllowed = document.fields.filter((field) => ["Income", "PAN"].includes(field.label)).map((field) => field.id);
    setAllowedFields(firstAllowed);
    setHiddenFields(document.fields.filter((field) => !firstAllowed.includes(field.id)).map((field) => field.id));
  }

  function toggle(id: string, target: "allow" | "hide") {
    if (target === "allow") {
      setAllowedFields((items) => (items.includes(id) ? items.filter((item) => item !== id) : [...items, id]));
      setHiddenFields((items) => items.filter((item) => item !== id));
    } else {
      setHiddenFields((items) => (items.includes(id) ? items.filter((item) => item !== id) : [...items, id]));
      setAllowedFields((items) => items.filter((item) => item !== id));
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      setShare(
        await api<ShareLink>("/api/permissions/disclose", {
          method: "POST",
          body: JSON.stringify({ documentId, recipient, role, allowedFields, hiddenFields, expiryHours })
        })
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create disclosure");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell title="Permission dashboard" subtitle="Choose the document, recipient, allowed fields, hidden fields, and expiry. The backend creates a Terminal3 proof envelope for the policy.">
      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <Surface className="p-6">
          <form onSubmit={submit} className="grid gap-5">
            <Field label="Document">
              <select
                className={inputClass}
                value={documentId}
                onChange={(event) => {
                  const nextDocument = documents.find((document) => document.id === event.target.value);
                  setDocumentId(event.target.value);
                  if (nextDocument) applyDefaultPolicy(nextDocument);
                }}
                required
              >
                {documents.map((document) => (
                  <option key={document.id} value={document.id}>
                    {document.title}
                  </option>
                ))}
              </select>
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Share with">
                <input className={inputClass} value={recipient} onChange={(event) => setRecipient(event.target.value)} />
              </Field>
              <Field label="Role">
                <input className={inputClass} value={role} onChange={(event) => setRole(event.target.value)} />
              </Field>
            </div>
            <Field label="Expiry hours">
              <input className={inputClass} type="number" min={1} max={720} value={expiryHours} onChange={(event) => setExpiryHours(Number(event.target.value))} />
            </Field>

            <div className="grid gap-3">
              <div className="flex items-center gap-2 font-semibold">
                <KeyRound size={18} />
                Field policy
              </div>
              {selected?.fields.map((field) => (
                <div key={field.id} className="grid gap-3 rounded-[20px] border border-[#dce8e2] bg-white p-4 md:grid-cols-[1fr_auto_auto] md:items-center">
                  <div>
                    <div className="font-semibold">{field.label}</div>
                    <div className="mt-1 text-sm text-[#607069]">{field.redactedValue}</div>
                  </div>
                  <Button type="button" variant={allowedFields.includes(field.id) ? "primary" : "secondary"} onClick={() => toggle(field.id, "allow")} className="px-4">
                    <Eye size={16} />
                    Allow
                  </Button>
                  <Button type="button" variant={hiddenFields.includes(field.id) ? "danger" : "secondary"} onClick={() => toggle(field.id, "hide")} className="px-4">
                    <EyeOff size={16} />
                    Hide
                  </Button>
                </div>
              ))}
              {selected && selected.fields.length === 0 ? <p className="rounded-2xl bg-[#f4faf7] p-4 text-sm text-[#607069]">This document has no detected protected fields.</p> : null}
            </div>

            <Button disabled={!selected || loading}>
              <ShieldCheck size={18} />
              {loading ? "Creating policy" : "Create secure share"}
            </Button>
            {error ? <p className="rounded-2xl bg-[#fff4f1] p-3 text-sm text-[#9b3d2d]">{error}</p> : null}
          </form>
        </Surface>

        <Surface className="p-6">
          <div className="flex items-center gap-3">
            <Link2 className="text-[#0f9f6e]" size={24} />
            <h2 className="text-2xl font-semibold">Disclosure output</h2>
          </div>
          {share ? (
            <div className="mt-6 grid gap-5">
              <div className="rounded-[22px] bg-[#071510] p-5 text-white">
                <div className="text-sm text-[#a8c6ba]">Policy hash</div>
                <div className="mt-2 break-all font-mono text-sm">{share.terminal3Proof.policyHash}</div>
              </div>
              <div className="rounded-[22px] border border-[#dce8e2] bg-[#fbfefd] p-5">
                <div className="text-sm font-semibold text-[#10231d]">Terminal3 protected-action envelope</div>
                <dl className="mt-4 grid gap-3 text-sm">
                  <div className="flex justify-between gap-4 border-t border-[#edf2ef] pt-3">
                    <dt className="text-[#607069]">Tenant DID</dt>
                    <dd className="max-w-[260px] truncate font-semibold">{share.terminal3Proof.tenantDid ?? "pending"}</dd>
                  </div>
                  <div className="flex justify-between gap-4 border-t border-[#edf2ef] pt-3">
                    <dt className="text-[#607069]">Policy map</dt>
                    <dd className="max-w-[260px] truncate font-mono text-xs font-semibold">{share.terminal3Proof.policyMapName ?? "not available"}</dd>
                  </div>
                  <div className="flex justify-between gap-4 border-t border-[#edf2ef] pt-3">
                    <dt className="text-[#607069]">Control payload</dt>
                    <dd className="max-w-[260px] truncate font-mono text-xs font-semibold">{share.terminal3Proof.controlPayloadHash ?? "not prepared"}</dd>
                  </div>
                  <div className="flex justify-between gap-4 border-t border-[#edf2ef] pt-3">
                    <dt className="text-[#607069]">Contract intent</dt>
                    <dd className="font-semibold">
                      {share.terminal3Proof.contract?.name ?? "trustvault-disclosure"} · {share.terminal3Proof.contract?.status ?? "prepared"}
                    </dd>
                  </div>
                  <div className="border-t border-[#edf2ef] pt-3">
                    <dt className="text-[#607069]">Allowed hosts</dt>
                    <dd className="mt-2 flex flex-wrap gap-2">
                      {share.terminal3Proof.permittedHosts.map((host) => (
                        <span key={host} className="rounded-full bg-[#e5f7ef] px-3 py-1 text-xs font-semibold text-[#08734f]">
                          {host}
                        </span>
                      ))}
                    </dd>
                  </div>
                </dl>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-[18px] bg-[#f4faf7] p-4">
                  <div className="text-xs text-[#607069]">Recipient</div>
                  <div className="mt-2 font-semibold">{share.recipient}</div>
                </div>
                <div className="rounded-[18px] bg-[#f4faf7] p-4">
                  <div className="text-xs text-[#607069]">Terminal3</div>
                  <div className="mt-2 font-semibold">{share.terminal3Proof.sdkConnected ? "Connected" : "Pending"}</div>
                </div>
                <div className="rounded-[18px] bg-[#f4faf7] p-4">
                  <div className="text-xs text-[#607069]">Status</div>
                  <div className="mt-2 font-semibold">{share.status}</div>
                </div>
              </div>
              <pre className="max-h-[360px] overflow-auto whitespace-pre-wrap rounded-[22px] border border-[#dce8e2] bg-[#fbfefd] p-5 text-sm leading-6">
                {share.maskedText}
              </pre>
            </div>
          ) : (
            <div className="mt-8 rounded-[22px] bg-[#f4faf7] p-8 text-sm leading-6 text-[#607069]">
              Select allowed and hidden fields to generate an expiring disclosure package with a Terminal3 proof envelope.
            </div>
          )}
        </Surface>
      </div>
    </AppShell>
  );
}
