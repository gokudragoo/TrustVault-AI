"use client";

import { useEffect, useState } from "react";
import { Fingerprint, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import type { Terminal3Status } from "@/lib/types";
import { Button, StatusDot, Surface } from "@/components/ui";

export function Terminal3StatusPanel() {
  const [status, setStatus] = useState<Terminal3Status | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const result = await api<Terminal3Status>("/api/auth/terminal3/session", { method: "POST" });
      setStatus(result);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const mode = status?.connected ? "good" : status?.configured ? "warn" : "idle";

  return (
    <Surface className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-[#10231d]">
            <Fingerprint size={18} />
            Terminal3 Agent Identity
          </div>
          <div className="mt-3 flex items-center gap-2 text-sm text-[#607069]">
            <StatusDot status={mode} />
            {status?.connected
              ? "Encrypted ADK session active"
              : status?.configured
                ? "Sandbox key configured, session pending"
                : "Terminal3 key not configured"}
          </div>
        </div>
        <Button variant="secondary" onClick={() => load()} disabled={loading} className="px-4">
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Check
        </Button>
      </div>
      <dl className="mt-5 grid gap-3 text-sm">
        <div className="flex justify-between gap-4 border-t border-[#edf2ef] pt-3">
          <dt className="text-[#607069]">Environment</dt>
          <dd className="font-semibold">{status?.environment ?? "testnet"}</dd>
        </div>
        <div className="flex justify-between gap-4 border-t border-[#edf2ef] pt-3">
          <dt className="text-[#607069]">DID</dt>
          <dd className="max-w-[210px] truncate font-semibold">{status?.did ?? status?.expectedDid ?? "Not available"}</dd>
        </div>
        <div className="flex justify-between gap-4 border-t border-[#edf2ef] pt-3">
          <dt className="text-[#607069]">Tenant</dt>
          <dd className="max-w-[210px] truncate font-semibold">
            {status?.tenant?.claimed ? status.tenant.status ?? "claimed" : status?.tenant?.error ? "pending" : "not checked"}
          </dd>
        </div>
        {status?.tenant?.policyMapName ? (
          <div className="flex justify-between gap-4 border-t border-[#edf2ef] pt-3">
            <dt className="text-[#607069]">Policy map</dt>
            <dd className="max-w-[210px] truncate font-mono text-xs font-semibold">{status.tenant.policyMapName}</dd>
          </div>
        ) : null}
        {status?.error ? <p className="rounded-2xl bg-[#fff7e8] p-3 text-xs leading-5 text-[#8a5a13]">{status.error}</p> : null}
        {status?.tenant?.error ? <p className="rounded-2xl bg-[#fff7e8] p-3 text-xs leading-5 text-[#8a5a13]">{status.tenant.error}</p> : null}
      </dl>
    </Surface>
  );
}
