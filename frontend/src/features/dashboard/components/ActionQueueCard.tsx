import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";

export function ActionQueueCard({ label, count, href, icon, accent = false }: { label: string; count: number; href: string; icon: ReactNode; accent?: boolean }) {
  return (
    <Link
      to={href}
      className="group relative flex min-h-32 flex-col rounded-[14px] border border-[var(--line)] bg-[var(--surface)] p-5 transition-colors duration-150 hover:bg-[var(--surface-soft)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[color-mix(in_srgb,var(--accent)_50%,transparent)]"
    >
      <div className="flex items-start justify-between gap-3">
        <span className={`grid size-10 place-items-center rounded-[7px] ${accent && count > 0 ? "bg-[var(--accent-soft)] text-[var(--accent-ink)]" : "bg-[var(--surface-soft)] text-[var(--muted)]"} transition-colors group-hover:bg-[var(--accent-soft-strong)] group-hover:text-[var(--accent-ink)]`} aria-hidden="true">
          {icon}
        </span>
        <ArrowUpRight className="size-4 text-[var(--muted)] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </div>
      <p className="mt-4 text-4xl font-semibold tracking-tight tabular-nums">{count}</p>
      <p className="mt-1 text-sm font-semibold">{label}</p>
    </Link>
  );
}
