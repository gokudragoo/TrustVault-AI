import Link from "next/link";
import { ArrowRight, FileLock2, Fingerprint, History, KeyRound, ShieldCheck, Sparkles } from "lucide-react";

const capabilities = [
  {
    title: "Terminal3 agent identity",
    text: "Every protected action carries DID-backed agent context and a policy hash.",
    icon: Fingerprint
  },
  {
    title: "Selective disclosure",
    text: "Share income, PAN, or medical summaries while masking unrelated private data.",
    icon: KeyRound
  },
  {
    title: "Encrypted vault",
    text: "Files are stored with AES-256-GCM encryption and indexed for private AI answers.",
    icon: FileLock2
  },
  {
    title: "Audit trail",
    text: "Uploads, questions, shares, and revocations are captured as traceable agent events.",
    icon: History
  }
];

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f6faf8] text-[#10231d]">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
        <Link href="/" className="flex items-center gap-3 font-semibold">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#071510] text-white">
            <ShieldCheck size={22} />
          </span>
          TrustVault AI
        </Link>
        <div className="hidden items-center gap-7 text-sm font-medium text-[#526a61] md:flex">
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/vault">Vault</Link>
          <Link href="/permissions">Permissions</Link>
          <Link href="/audit">Audit</Link>
        </div>
        <Link
          href="/login"
          className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-full bg-[#0f9f6e] px-5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(15,159,110,0.24)]"
        >
          Open App
          <ArrowRight size={17} />
        </Link>
      </nav>

      <section className="relative mx-auto grid min-h-[calc(100vh-88px)] max-w-7xl items-center gap-10 px-5 pb-12 pt-8 lg:grid-cols-[1fr_1.02fr]">
        <div className="relative z-10">
          <h1 className="max-w-4xl text-5xl font-semibold leading-[1.02] text-[#071510] md:text-7xl">
            AI document work without exposing the whole document.
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-[#526a61]">
            TrustVault AI combines an encrypted document vault, privacy-aware AI agents, Terminal3 agent authentication,
            selective disclosure, expiring links, and audit logs for high-stakes personal documents.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/dashboard"
              className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#071510] px-6 text-sm font-semibold text-white"
            >
              Launch workspace
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/permissions"
              className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#bfd5cb] bg-white px-6 text-sm font-semibold"
            >
              Build a disclosure
              <KeyRound size={18} />
            </Link>
          </div>
        </div>

        <div className="relative">
          <div className="soft-grid absolute inset-0 rounded-[34px] opacity-60" />
          <div className="relative overflow-hidden rounded-[34px] border border-[#dce8e2] bg-white shadow-[0_30px_90px_rgba(18,54,41,0.13)]">
            <div className="scanline absolute left-0 top-0 h-full w-1/2 opacity-70" />
            <div className="grid gap-0 md:grid-cols-[0.74fr_1fr]">
              <div className="bg-[#071510] p-6 text-white">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Sparkles size={18} />
                  AI Vault Assistant
                </div>
                <div className="mt-10 space-y-4">
                  {["Document Agent", "Privacy Agent", "Sharing Agent", "Audit Agent"].map((item, index) => (
                    <div key={item} className="flex items-center justify-between border-b border-white/10 pb-4">
                      <span className="text-sm text-[#d7e8df]">{item}</span>
                      <span className="rounded-full bg-[#0f9f6e]/20 px-2.5 py-1 text-xs text-[#90f2c9]">
                        {index === 1 ? "redacting" : "ready"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[#607069]">Rahul Income Certificate</p>
                    <h2 className="mt-1 text-2xl font-semibold">Selective disclosure</h2>
                  </div>
                  <span className="rounded-full bg-[#e5f7ef] px-3 py-1 text-xs font-semibold text-[#08734f]">
                    T3 verified
                  </span>
                </div>
                <div className="mt-7 space-y-3">
                  {[
                    ["Income", "Allowed"],
                    ["PAN", "Allowed"],
                    ["Aadhaar", "Hidden"],
                    ["Address", "Hidden"]
                  ].map(([label, state]) => (
                    <div key={label} className="flex items-center justify-between rounded-2xl bg-[#f4faf7] px-4 py-3">
                      <span className="font-medium">{label}</span>
                      <span className={state === "Allowed" ? "text-[#08734f]" : "text-[#8a5a13]"}>{state}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-7 rounded-3xl bg-[#071510] p-5 text-white">
                  <div className="text-xs uppercase tracking-[0.18em] text-[#95b8aa]">Policy hash</div>
                  <div className="mt-3 font-mono text-sm text-[#d8f2e8]">9f3e2a5c...24h expiry</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-5 pb-16 md:grid-cols-4">
        {capabilities.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.title} className="rounded-[22px] border border-[#dce8e2] bg-white/80 p-5">
              <Icon className="text-[#0f9f6e]" size={24} />
              <h2 className="mt-5 text-lg font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-[#607069]">{item.text}</p>
            </article>
          );
        })}
      </section>
    </main>
  );
}
