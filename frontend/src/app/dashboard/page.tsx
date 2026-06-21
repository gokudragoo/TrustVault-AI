"use client";

import { useEffect, useState } from "react";
import { Activity, FileLock2, History, Link2, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Terminal3StatusPanel } from "@/components/terminal3-status";
import { Surface } from "@/components/ui";
import { api } from "@/lib/api";
import type { DashboardPayload } from "@/lib/types";

const fallback: DashboardPayload = {
  totals: { documents: 0, activeShares: 0, protectedFields: 0, auditEvents: 0 },
  recentDocuments: [],
  recentAudit: [],
  agentRuns: [],
  terminal3: { configured: false, connected: false, environment: "testnet" }
};

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardPayload>(fallback);

  useEffect(() => {
    api<DashboardPayload>("/api/dashboard").then(setDashboard).catch(() => setDashboard(fallback));
  }, []);

  const stats = [
    { label: "Encrypted documents", value: dashboard.totals.documents, icon: FileLock2 },
    { label: "Protected fields", value: dashboard.totals.protectedFields, icon: ShieldCheck },
    { label: "Active shares", value: dashboard.totals.activeShares, icon: Link2 },
    { label: "Audit events", value: dashboard.totals.auditEvents, icon: History }
  ];

  return (
    <AppShell
      title="Privacy command center"
      subtitle="Monitor encrypted documents, Terminal3 agent identity, disclosure policies, and audit-ready agent activity."
    >
      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="grid gap-5">
          <div className="grid gap-4 md:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Surface key={stat.label} className="p-5">
                  <Icon className="text-[#0f9f6e]" size={23} />
                  <div className="mt-6 text-3xl font-semibold text-[#071510]">{stat.value}</div>
                  <div className="mt-1 text-sm text-[#607069]">{stat.label}</div>
                </Surface>
              );
            })}
          </div>

          <Surface className="p-6">
            <div className="flex items-center justify-between gap-5">
              <div>
                <h2 className="text-xl font-semibold">Recent vault activity</h2>
                <p className="mt-1 text-sm text-[#607069]">Agent actions are logged as documents are indexed, disclosed, or revoked.</p>
              </div>
              <Activity className="text-[#0f9f6e]" size={24} />
            </div>
            <div className="mt-6 grid gap-3">
              {(dashboard.recentAudit.length ? dashboard.recentAudit : []).map((event) => (
                <div key={event.id} className="grid gap-2 border-t border-[#edf2ef] py-4 md:grid-cols-[1fr_auto] md:items-center">
                  <div>
                    <div className="font-semibold">{event.action}</div>
                    <div className="mt-1 text-sm text-[#607069]">
                      {event.actor} → {event.resource}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-[#08734f]">{event.status}</div>
                </div>
              ))}
              {dashboard.recentAudit.length === 0 ? (
                <div className="rounded-[22px] bg-[#f4faf7] p-6 text-sm leading-6 text-[#607069]">
                  No activity yet. Upload a document or connect Terminal3 to start the audit trail.
                </div>
              ) : null}
            </div>
          </Surface>

          <Surface className="p-6">
            <h2 className="text-xl font-semibold">Agent pipeline</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-5">
              {["Document", "Privacy", "Sharing", "Audit", "Summarizer"].map((agent, index) => (
                <div key={agent} className="relative rounded-[18px] bg-[#f4faf7] p-4">
                  {index < 4 ? <span className="absolute -right-3 top-1/2 hidden h-px w-6 bg-[#bcd4ca] md:block" /> : null}
                  <div className="text-sm font-semibold">{agent} Agent</div>
                  <div className="mt-3 text-xs leading-5 text-[#607069]">
                    {index === 0 && "OCR + classification"}
                    {index === 1 && "Redaction policy"}
                    {index === 2 && "Expiring links"}
                    {index === 3 && "Immutable trail"}
                    {index === 4 && "RAG answer"}
                  </div>
                </div>
              ))}
            </div>
          </Surface>
        </div>

        <div className="grid content-start gap-5">
          <Terminal3StatusPanel />
          <Surface className="p-5">
            <h2 className="text-lg font-semibold">Recently indexed</h2>
            <div className="mt-4 grid gap-3">
              {dashboard.recentDocuments.slice(0, 4).map((document) => (
                <div key={document.id} className="border-t border-[#edf2ef] pt-3">
                  <div className="font-semibold">{document.title}</div>
                  <div className="mt-1 text-xs text-[#607069]">
                    {document.category} · {document.fields.length} protected fields
                  </div>
                </div>
              ))}
              {dashboard.recentDocuments.length === 0 ? <p className="text-sm text-[#607069]">The vault is ready for the first upload.</p> : null}
            </div>
          </Surface>
        </div>
      </div>
    </AppShell>
  );
}
