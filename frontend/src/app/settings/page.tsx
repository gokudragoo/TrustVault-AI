"use client";

import { useEffect, useState } from "react";
import { Bell, KeyRound, Save, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button, Field, Surface, inputClass } from "@/components/ui";
import { api } from "@/lib/api";
import type { AppSettings } from "@/lib/types";

const fallback: AppSettings = {
  notifications: true,
  defaultExpiryHours: 24,
  requireTerminal3ForShares: false,
  redactionStrictness: "strict"
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(fallback);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api<AppSettings>("/api/settings").then(setSettings).catch(() => setSettings(fallback));
  }, []);

  async function save() {
    const next = await api<AppSettings>("/api/settings", {
      method: "PATCH",
      body: JSON.stringify(settings)
    });
    setSettings(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  return (
    <AppShell title="Settings" subtitle="Tune privacy defaults, notifications, disclosure expiry, and Terminal3 enforcement mode.">
      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <Surface className="p-6">
          <h2 className="text-2xl font-semibold">Privacy defaults</h2>
          <div className="mt-6 grid gap-5">
            <Field label="Default share expiry in hours">
              <input
                className={inputClass}
                type="number"
                min={1}
                max={720}
                value={settings.defaultExpiryHours}
                onChange={(event) => setSettings((current) => ({ ...current, defaultExpiryHours: Number(event.target.value) }))}
              />
            </Field>
            <Field label="Redaction strictness">
              <select
                className={inputClass}
                value={settings.redactionStrictness}
                onChange={(event) => setSettings((current) => ({ ...current, redactionStrictness: event.target.value as AppSettings["redactionStrictness"] }))}
              >
                <option value="strict">Strict</option>
                <option value="balanced">Balanced</option>
              </select>
            </Field>
            <label className="flex items-center justify-between gap-4 rounded-[22px] border border-[#dce8e2] bg-white p-4">
              <span>
                <span className="flex items-center gap-2 font-semibold">
                  <Bell size={18} />
                  Notifications
                </span>
                <span className="mt-1 block text-sm text-[#607069]">Notify when links are viewed, expired, or revoked.</span>
              </span>
              <input
                type="checkbox"
                checked={settings.notifications}
                onChange={(event) => setSettings((current) => ({ ...current, notifications: event.target.checked }))}
                className="h-5 w-5 accent-[#0f9f6e]"
              />
            </label>
            <label className="flex items-center justify-between gap-4 rounded-[22px] border border-[#dce8e2] bg-white p-4">
              <span>
                <span className="flex items-center gap-2 font-semibold">
                  <KeyRound size={18} />
                  Require Terminal3 for shares
                </span>
                <span className="mt-1 block text-sm text-[#607069]">When enabled, disclosure creation should wait for a live Terminal3 ADK session.</span>
              </span>
              <input
                type="checkbox"
                checked={settings.requireTerminal3ForShares}
                onChange={(event) => setSettings((current) => ({ ...current, requireTerminal3ForShares: event.target.checked }))}
                className="h-5 w-5 accent-[#0f9f6e]"
              />
            </label>
            <Button onClick={save}>
              <Save size={18} />
              {saved ? "Saved" : "Save settings"}
            </Button>
          </div>
        </Surface>

        <Surface className="p-6">
          <ShieldCheck className="text-[#0f9f6e]" size={28} />
          <h2 className="mt-5 text-xl font-semibold">Production checklist</h2>
          <ul className="mt-5 grid gap-3 text-sm leading-6 text-[#607069]">
            <li>Use a unique `ENCRYPTION_MASTER_KEY` in production.</li>
            <li>Set `T3N_API_KEY` and `T3N_DID` on the backend host.</li>
            <li>Set `OPENAI_API_KEY` only on the backend host.</li>
            <li>Set `NEXT_PUBLIC_API_BASE_URL` to the Render backend URL on Vercel.</li>
          </ul>
        </Surface>
      </div>
    </AppShell>
  );
}
