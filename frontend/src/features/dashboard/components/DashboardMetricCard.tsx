import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";

type DashboardMetricCardProps = {
  label: string;
  value: number | string;
  icon: ReactNode;
  emphasis?: boolean;
};

export function DashboardMetricCard({ label, value, icon, emphasis = false }: DashboardMetricCardProps) {
  return (
    <Card className={emphasis ? "bg-[var(--accent)]" : undefined}>
      <CardContent className="py-5">
        <div className="flex items-start justify-between gap-3">
          <p className={`text-sm font-semibold ${emphasis ? "text-[var(--ink)]" : "text-[var(--muted)]"}`}>{label}</p>
          <span className={`grid size-9 place-items-center rounded-xl ${emphasis ? "bg-[color-mix(in_srgb,var(--ink)_10%,transparent)] text-[var(--ink)]" : "bg-[var(--surface-soft)] text-[var(--muted)]"}`} aria-hidden="true">
            {icon}
          </span>
        </div>
        <p className="mt-4 text-4xl font-semibold tracking-tight text-[var(--ink)]">{value}</p>
      </CardContent>
    </Card>
  );
}
