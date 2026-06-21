"use client";

import { useEffect, useState } from "react";
import { History, ShieldAlert, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Surface, StatusDot } from "@/components/ui";
import { api } from "@/lib/api";
import type { AgentRun, AuditEvent } from "@/lib/types";

export default function AuditPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [agents, setAgents] = useState<AgentRun[]>([]);

  useEffect(() => {
    api<AuditEvent[]>("/api/audit").then(setEvents).catch(() => setEvents([]));
    api<AgentRun[]>("/api/agents").then(setAgents).catch(() => setAgents([]));
  }, []);

  return (
    <AppShell title="Audit logs" subtitle="Trace every agent action, document intake, AI answer, disclosure package, and revocation event.">
      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <Surface className="p-6">
          <div className="flex items-center gap-3">
            <History className="text-[#0f9f6e]" size={24} />
            <h2 className="text-2xl font-semibold">Event ledger</h2>
          </div>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#dce8e2] text-xs uppercase tracking-[0.14em] text-[#607069]">
                  <th className="py-3 pr-4 font-semibold">Actor</th>
                  <th className="py-3 pr-4 font-semibold">Action</th>
                  <th className="py-3 pr-4 font-semibold">Resource</th>
                  <th className="py-3 pr-4 font-semibold">Status</th>
                  <th className="py-3 pr-4 font-semibold">Time</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id} className="border-b border-[#edf2ef]">
                    <td className="py-4 pr-4 font-semibold">{event.actor}</td>
                    <td className="py-4 pr-4">{event.action}</td>
                    <td className="py-4 pr-4 text-[#607069]">{event.resource}</td>
                    <td className="py-4 pr-4">
                      <span className="inline-flex items-center gap-2 font-semibold">
                        <StatusDot status={event.status === "allowed" ? "good" : event.status === "pending" ? "warn" : "bad"} />
                        {event.status}
                      </span>
                    </td>
                    <td className="py-4 pr-4 text-[#607069]">{new Date(event.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {events.length === 0 ? <p className="mt-6 rounded-[22px] bg-[#f4faf7] p-6 text-sm text-[#607069]">No audit events yet.</p> : null}
          </div>
        </Surface>

        <Surface className="p-6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="text-[#0f9f6e]" size={23} />
            <h2 className="text-xl font-semibold">Agent runs</h2>
          </div>
          <div className="mt-5 grid gap-4">
            {agents.map((run) => (
              <div key={run.id} className="border-t border-[#edf2ef] pt-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="font-semibold">{run.agent}</div>
                  <span className="inline-flex items-center gap-2 text-sm">
                    <StatusDot status={run.status === "success" ? "good" : run.status === "warning" ? "warn" : "bad"} />
                    {run.status}
                  </span>
                </div>
                <div className="mt-2 text-sm text-[#607069]">{run.action}</div>
                <div className="mt-2 text-xs text-[#8a9d95]">{new Date(run.createdAt).toLocaleString()}</div>
              </div>
            ))}
            {agents.length === 0 ? (
              <div className="rounded-[22px] bg-[#f4faf7] p-5 text-sm leading-6 text-[#607069]">
                <ShieldAlert size={20} className="mb-3 text-[#d79528]" />
                Agent run history will appear after uploads, AI questions, and disclosure generation.
              </div>
            ) : null}
          </div>
        </Surface>
      </div>
    </AppShell>
  );
}
