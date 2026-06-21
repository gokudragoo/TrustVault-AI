"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Clock, FileLock2, Fingerprint, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";
import type { PublicShareLink } from "@/lib/types";
import { StatusDot, Surface } from "@/components/ui";

export default function PublicSharePage({ params }: Readonly<{ params: Promise<{ token: string }> }>) {
  const [token, setToken] = useState("");
  const [share, setShare] = useState<PublicShareLink | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    params.then(({ token: nextToken }) => setToken(nextToken));
  }, [params]);

  useEffect(() => {
    if (!token) return;
    api<PublicShareLink>(`/api/public/shares/${token}`)
      .then(setShare)
      .catch((err) => setError(err instanceof Error ? err.message : "Disclosure unavailable"));
  }, [token]);

  return (
    <main className="min-h-screen bg-[#f6faf8] px-5 py-8 text-[#10231d]">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-full border border-[#bfd5cb] bg-white px-5 text-sm font-semibold">
          <ArrowLeft size={17} />
          TrustVault AI
        </Link>

        <section className="mt-8 grid gap-5 lg:grid-cols-[0.76fr_1fr]">
          <Surface className="!border-[#071510] !bg-[#071510] p-7 text-white">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#0f9f6e]">
                <ShieldCheck size={24} />
              </span>
              <div>
                <div className="text-sm font-semibold text-[#b8d2c8]">Selective disclosure</div>
                <h1 className="text-3xl font-semibold leading-tight">Verified masked package</h1>
              </div>
            </div>
            <p className="mt-6 text-sm leading-7 text-[#b8d2c8]">
              This link exposes only the fields approved by the vault owner. Every access is recorded as an audit event.
            </p>
            <dl className="mt-8 grid gap-4 text-sm">
              <div className="border-t border-white/10 pt-4">
                <dt className="text-[#93b9ab]">Recipient</dt>
                <dd className="mt-1 font-semibold">{share?.recipient ?? "Waiting for disclosure"}</dd>
              </div>
              <div className="border-t border-white/10 pt-4">
                <dt className="text-[#93b9ab]">Document</dt>
                <dd className="mt-1 font-semibold">{share?.documentTitle ?? "Protected vault document"}</dd>
              </div>
              <div className="border-t border-white/10 pt-4">
                <dt className="text-[#93b9ab]">Terminal3 status</dt>
                <dd className="mt-2 inline-flex items-center gap-2 font-semibold">
                  <StatusDot status={share?.terminal3Proof.sdkConnected ? "good" : "warn"} />
                  {share?.terminal3Proof.sdkConnected ? "ADK session verified" : "Policy pending verification"}
                </dd>
              </div>
            </dl>
          </Surface>

          <Surface className="p-7">
            {error ? (
              <div className="rounded-[22px] bg-[#fff4f1] p-6 text-sm leading-6 text-[#9b3d2d]">{error}</div>
            ) : share ? (
              <div className="grid gap-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-[#08734f]">
                      <FileLock2 size={18} />
                      {share.status}
                    </div>
                    <h2 className="mt-3 text-3xl font-semibold">{share.documentTitle ?? "Disclosure package"}</h2>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-[#e5f7ef] px-4 py-2 text-sm font-semibold text-[#08734f]">
                    <Clock size={16} />
                    Expires {new Date(share.expiresAt).toLocaleString()}
                  </div>
                </div>

                <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap rounded-[22px] border border-[#dce8e2] bg-[#fbfefd] p-5 text-sm leading-6">
                  {share.maskedText}
                </pre>

                <div className="rounded-[22px] bg-[#f4faf7] p-5">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Fingerprint size={18} />
                    Terminal3 proof
                  </div>
                  <dl className="mt-4 grid gap-3 text-sm">
                    <div className="flex justify-between gap-4 border-t border-[#dce8e2] pt-3">
                      <dt className="text-[#607069]">Policy hash</dt>
                      <dd className="max-w-[310px] truncate font-mono text-xs font-semibold">{share.terminal3Proof.policyHash}</dd>
                    </div>
                    <div className="flex justify-between gap-4 border-t border-[#dce8e2] pt-3">
                      <dt className="text-[#607069]">Tenant DID</dt>
                      <dd className="max-w-[310px] truncate font-semibold">{share.terminal3Proof.tenantDid ?? "pending"}</dd>
                    </div>
                    <div className="flex justify-between gap-4 border-t border-[#dce8e2] pt-3">
                      <dt className="text-[#607069]">Allowed hosts</dt>
                      <dd className="font-semibold">{share.terminal3Proof.permittedHosts.join(", ")}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            ) : (
              <div className="rounded-[22px] bg-[#f4faf7] p-8 text-sm leading-6 text-[#607069]">Loading disclosure package...</div>
            )}
          </Surface>
        </section>
      </div>
    </main>
  );
}
