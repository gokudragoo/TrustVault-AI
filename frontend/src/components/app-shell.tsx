"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  FileLock2,
  Gauge,
  History,
  KeyRound,
  LayoutDashboard,
  Link2,
  LockKeyhole,
  Settings,
  ShieldCheck,
  UploadCloud
} from "lucide-react";
import clsx from "clsx";
import type { ReactNode } from "react";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/upload", label: "Upload", icon: UploadCloud },
  { href: "/vault", label: "Vault", icon: FileLock2 },
  { href: "/assistant", label: "AI Assistant", icon: Bot },
  { href: "/permissions", label: "Permissions", icon: KeyRound },
  { href: "/shares", label: "Shared Links", icon: Link2 },
  { href: "/audit", label: "Audit Logs", icon: History },
  { href: "/settings", label: "Settings", icon: Settings }
];

export function AppShell({
  children,
  title,
  subtitle,
  action
}: Readonly<{
  children: ReactNode;
  title: string;
  subtitle: string;
  action?: ReactNode;
}>) {
  const pathname = usePathname();

  return (
    <main className="min-h-screen bg-[#f6faf8] text-[#10231d]">
      <div className="grid min-h-screen lg:grid-cols-[286px_1fr]">
        <aside className="border-b border-[#dce8e2] bg-[#071510] text-white lg:border-b-0 lg:border-r">
          <div className="flex min-h-0 flex-col p-4 sm:p-5 lg:sticky lg:top-0 lg:h-full lg:min-h-screen">
            <Link href="/" className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#0f9f6e]">
                <LockKeyhole size={23} />
              </span>
              <span>
                <span className="block text-lg font-semibold">TrustVault AI</span>
                <span className="block text-xs text-[#93b9ab]">Terminal3 privacy agent</span>
              </span>
            </Link>

            <nav className="mt-5 grid grid-cols-2 gap-1.5 sm:grid-cols-4 lg:mt-9 lg:grid-cols-1">
              {nav.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={clsx(
                      "focus-ring flex min-w-0 items-center gap-2.5 rounded-2xl px-3 py-2.5 text-[13px] font-medium transition lg:gap-3 lg:px-3.5 lg:py-3 lg:text-sm",
                      active ? "bg-white !text-[#071510]" : "text-[#cfe0d8] hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <Icon className="shrink-0" size={18} />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-7 hidden rounded-[22px] border border-white/10 bg-white/[0.06] p-4 lg:mt-auto lg:block">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <ShieldCheck size={18} />
                Agent Auth SDK
              </div>
              <p className="mt-2 text-xs leading-5 text-[#a8c6ba]">
                Session, DID, policy hash, allowed-host grants, and audit intent are tracked per disclosure.
              </p>
            </div>
          </div>
        </aside>

        <section className="min-w-0">
          <header className="flex flex-col gap-5 border-b border-[#dce8e2] bg-white/72 px-5 py-5 backdrop-blur md:flex-row md:items-center md:justify-between lg:px-9">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#688078]">
                <Gauge size={15} />
                Live workspace
              </div>
              <h1 className="text-3xl font-semibold leading-tight text-[#071510]">{title}</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#607069]">{subtitle}</p>
            </div>
            {action}
          </header>
          <div className="px-5 py-6 lg:px-9">{children}</div>
        </section>
      </div>
    </main>
  );
}
