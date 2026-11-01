import type { ReactNode } from "react";

export function DashboardSection({ index, title, aside, children }: { index: string; title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <span className="text-[11px] font-bold tracking-[0.2em] text-[var(--muted)]">{index}</span>
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        </div>
        {aside}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}
