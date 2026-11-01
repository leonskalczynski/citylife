import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";

export function ActionQueueCard({ label, count, context, href, icon, accent = false }: { label: string; count: number; context: string; href: string; icon: ReactNode; accent?: boolean }) {
  return (
    <Link
      to={href}
      className="group relative flex min-h-40 flex-col rounded-2xl bg-[var(--surface)] p-5 transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
    >
      <div className="flex items-start justify-between gap-3">
        <span className={`grid size-10 place-items-center rounded-xl ${accent && count > 0 ? "bg-[var(--accent)] text-[var(--ink)]" : "bg-[var(--surface-soft)] text-[var(--muted)]"} transition-colors group-hover:bg-[var(--accent-soft-strong)] group-hover:text-[var(--accent-ink)]`} aria-hidden="true">
          {icon}
        </span>
        <ArrowUpRight className="size-4 text-[var(--muted)] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </div>
      <p className="mt-5 text-3xl font-semibold tracking-tight tabular-nums">{count}</p>
      <p className="mt-1 text-sm font-semibold">{label}</p>
      <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{context}</p>
    </Link>
  );
}
