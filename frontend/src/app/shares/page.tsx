"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Ban, Clock, Copy, ExternalLink, Link2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button, Surface, StatusDot } from "@/components/ui";
import { api } from "@/lib/api";
import type { ShareLink } from "@/lib/types";

export default function SharesPage() {
  const [shares, setShares] = useState<ShareLink[]>([]);

  async function load() {
    setShares(await api<ShareLink[]>("/api/shares").catch(() => []));
  }

  async function revoke(id: string) {
    await api<ShareLink>(`/api/shares/${id}/revoke`, { method: "POST" });
    await load();
  }

  function absoluteShareUrl(url: string) {
    if (typeof window === "undefined") return url;
    return `${window.location.origin}${url}`;
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <AppShell title="Shared links" subtitle="Review active, expired, and revoked disclosure packages. Revoke access at any time.">
      <div className="grid gap-4">
        {shares.map((share) => (
          <Surface key={share.id} className="p-6">
            <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-start">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-[#08734f]">
                  <Link2 size={17} />
                  {share.recipient} · {share.role}
                </div>
                <h2 className="mt-3 text-2xl font-semibold">{share.documentTitle ?? share.url}</h2>
                <div className="mt-3 flex flex-wrap gap-4 text-sm text-[#607069]">
                  <span className="inline-flex items-center gap-2">
                    <Clock size={16} />
                    Expires {new Date(share.expiresAt).toLocaleString()}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <StatusDot status={share.status === "active" ? "good" : share.status === "expired" ? "warn" : "bad"} />
                    {share.status}
                  </span>
                  <span>Policy {share.terminal3Proof.policyHash.slice(0, 12)}</span>
                </div>
                <div className="mt-3 break-all font-mono text-xs text-[#607069]">{share.url}</div>
              </div>
              <div className="flex gap-2">
                <Link
                  href={share.url}
                  className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#bfd5cb] bg-white px-5 text-sm font-semibold text-[#10231d]"
                >
                  <ExternalLink size={16} />
                  Open
                </Link>
                <Button type="button" variant="secondary" onClick={() => navigator.clipboard?.writeText(absoluteShareUrl(share.url))}>
                  <Copy size={16} />
                  Copy link
                </Button>
                <Button type="button" variant="danger" disabled={share.status !== "active"} onClick={() => revoke(share.id)}>
                  <Ban size={16} />
                  Revoke
                </Button>
              </div>
            </div>
            <pre className="mt-5 max-h-[220px] overflow-auto whitespace-pre-wrap rounded-[20px] bg-[#f4faf7] p-4 text-sm leading-6 text-[#315147]">
              {share.maskedText}
            </pre>
          </Surface>
        ))}
        {shares.length === 0 ? (
          <Surface className="p-10 text-center">
            <Link2 className="mx-auto text-[#0f9f6e]" size={38} />
            <h2 className="mt-4 text-2xl font-semibold">No links yet</h2>
            <p className="mt-2 text-sm text-[#607069]">Create a secure disclosure from the permissions page.</p>
          </Surface>
        ) : null}
      </div>
    </AppShell>
  );
}
