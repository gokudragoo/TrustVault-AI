"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowRight, CheckCircle2, Fingerprint, KeyRound, LockKeyhole, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";
import { setVaultSession } from "@/lib/auth";
import type { LoginResponse, Terminal3Status } from "@/lib/types";
import { Button, Field, StatusDot, Surface, inputClass } from "@/components/ui";

export default function LoginPage() {
  const [status, setStatus] = useState<Terminal3Status | null>(null);
  const [accessKey, setAccessKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const session = await api<LoginResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ accessKey })
      });
      setVaultSession({ token: session.token, expiresAt: session.expiresAt });
      setStatus(session.terminal3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not unlock the vault");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-5 py-10">
      <Surface className="grid w-full max-w-5xl overflow-hidden md:grid-cols-[0.9fr_1.1fr]">
        <section className="relative bg-[#071510] p-8 text-white md:p-10">
          <div className="scanline absolute inset-y-0 left-0 w-1/2 opacity-50" />
          <Link href="/" className="relative flex items-center gap-3 font-semibold">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#0f9f6e]">
              <LockKeyhole size={22} />
            </span>
            TrustVault AI
          </Link>
          <div className="relative mt-20">
            <h1 className="text-4xl font-semibold leading-tight">Unlock the vault before sharing private data.</h1>
            <p className="mt-5 text-sm leading-7 text-[#b8d2c8]">
              The owner session protects vault APIs. After login, the backend checks Terminal3 ADK, reads the active DID, and uses that identity in every disclosure proof.
            </p>
          </div>
        </section>

        <section className="p-8 md:p-10">
          <div className="flex items-center gap-3 text-sm font-semibold text-[#08734f]">
            <ShieldCheck size={20} />
            Terminal3 Agent Auth SDK
          </div>
          <h2 className="mt-5 text-3xl font-semibold text-[#071510]">Owner session</h2>
          <p className="mt-3 text-sm leading-6 text-[#607069]">
            Sign in with the vault access key. The backend keeps OpenAI, MongoDB, and Terminal3 credentials server-side.
          </p>

          <form onSubmit={login} className="mt-8 grid gap-4">
            <Field label="Vault access key">
              <input
                className={inputClass}
                type="password"
                value={accessKey}
                onChange={(event) => setAccessKey(event.target.value)}
                placeholder="Enter the owner access key"
                autoComplete="current-password"
                required
              />
            </Field>
            {error ? <p className="rounded-2xl bg-[#fff4f1] p-3 text-sm text-[#9b3d2d]">{error}</p> : null}
            <Button disabled={loading || accessKey.length < 8}>
              <KeyRound size={18} />
              {loading ? "Unlocking vault" : "Unlock vault"}
            </Button>
          </form>

          <div className="mt-8 rounded-[22px] border border-[#dce8e2] bg-[#f6faf8] p-5">
            <div className="flex items-center gap-3">
              <StatusDot status={status?.connected ? "good" : status?.configured ? "warn" : "idle"} />
              <span className="font-semibold">
                {status?.connected ? "Connected" : status?.configured ? "Configured, not connected" : "Not checked"}
              </span>
            </div>
            <dl className="mt-5 grid gap-3 text-sm">
              <div className="flex justify-between border-t border-[#dce8e2] pt-3">
                <dt className="text-[#607069]">Environment</dt>
                <dd className="font-semibold">{status?.environment ?? "testnet"}</dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-[#dce8e2] pt-3">
                <dt className="text-[#607069]">Agent DID</dt>
                <dd className="max-w-[260px] truncate font-semibold">{status?.did ?? status?.expectedDid ?? "Waiting"}</dd>
              </div>
              <div className="flex justify-between border-t border-[#dce8e2] pt-3">
                <dt className="text-[#607069]">Wallet address</dt>
                <dd className="font-semibold">{status?.address ?? "Hidden"}</dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-[#dce8e2] pt-3">
                <dt className="text-[#607069]">Tenant policy map</dt>
                <dd className="max-w-[260px] truncate font-mono text-xs font-semibold">
                  {status?.tenant?.policyMapName ?? "Created after session"}
                </dd>
              </div>
            </dl>
            {status?.error ? <p className="mt-4 rounded-2xl bg-[#fff7e8] p-3 text-xs leading-5 text-[#8a5a13]">{status.error}</p> : null}
            {status?.tenant?.error ? <p className="mt-4 rounded-2xl bg-[#fff7e8] p-3 text-xs leading-5 text-[#8a5a13]">{status.tenant.error}</p> : null}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              variant="secondary"
              onClick={async () => {
                setLoading(true);
                setError("");
                try {
                  setStatus(await api<Terminal3Status>("/api/auth/terminal3/session", { method: "POST" }));
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Could not check Terminal3");
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading || !status}
            >
              <Fingerprint size={18} />
              {loading ? "Checking session" : "Recheck Terminal3"}
            </Button>
            <Link
              href="/dashboard"
              className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#bfd5cb] bg-white px-5 text-sm font-semibold"
            >
              Continue to dashboard
              {status?.connected ? <CheckCircle2 size={18} className="text-[#0f9f6e]" /> : <ArrowRight size={18} />}
            </Link>
          </div>
        </section>
      </Surface>
    </main>
  );
}
