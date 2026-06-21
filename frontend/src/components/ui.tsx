import clsx from "clsx";
import type { ReactNode } from "react";

export function Surface({
  children,
  className
}: Readonly<{
  children: ReactNode;
  className?: string;
}>) {
  return (
    <section
      className={clsx(
        "relative overflow-hidden rounded-[22px] border border-[#dce8e2] bg-white/86 shadow-[0_22px_70px_rgba(18,54,41,0.08)]",
        className
      )}
    >
      {children}
    </section>
  );
}

export function Button({
  children,
  variant = "primary",
  className,
  ...props
}: Readonly<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "ghost" | "danger";
  }
>) {
  return (
    <button
      {...props}
      className={clsx(
        "focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-55",
        variant === "primary" && "bg-[#0f9f6e] text-white shadow-[0_14px_30px_rgba(15,159,110,0.24)] hover:bg-[#0b7f58]",
        variant === "secondary" && "border border-[#bfd5cb] bg-white text-[#10231d] hover:bg-[#f1f8f4]",
        variant === "ghost" && "text-[#315147] hover:bg-[#edf7f2]",
        variant === "danger" && "border border-[#f0c7bf] bg-[#fff4f1] text-[#a3432e] hover:bg-[#ffe7e0]",
        className
      )}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  children
}: Readonly<{
  label: string;
  children: ReactNode;
}>) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-[#26483d]">
      {label}
      {children}
    </label>
  );
}

export const inputClass =
  "focus-ring min-h-11 rounded-2xl border border-[#cdded6] bg-white px-4 text-sm text-[#10231d] outline-none transition placeholder:text-[#8ca199] focus:border-[#0f9f6e]";

export function StatusDot({ status }: Readonly<{ status: "good" | "warn" | "bad" | "idle" }>) {
  return (
    <span
      className={clsx(
        "inline-flex h-2.5 w-2.5 rounded-full",
        status === "good" && "bg-[#0f9f6e]",
        status === "warn" && "bg-[#d79528]",
        status === "bad" && "bg-[#d14b39]",
        status === "idle" && "bg-[#9badb4]"
      )}
    />
  );
}
