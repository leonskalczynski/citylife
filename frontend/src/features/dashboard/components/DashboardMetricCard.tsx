import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";

type DashboardMetricCardProps = {
  label: string;
  value: number | string;
  hint: string;
  icon: ReactNode;
  emphasis?: boolean;
};

export function DashboardMetricCard({ label, value, hint, icon, emphasis = false }: DashboardMetricCardProps) {
  return (
    <Card className={emphasis ? "border-slate-900 bg-slate-950 text-white" : undefined}>
      <CardContent className="py-5">
        <div className="flex items-start justify-between gap-3">
          <p className={`text-sm font-semibold ${emphasis ? "text-slate-300" : "text-slate-600"}`}>{label}</p>
          <span className={`grid size-9 place-items-center rounded-md ${emphasis ? "bg-white/10 text-[var(--accent)]" : "bg-slate-100 text-slate-600"}`} aria-hidden="true">
            {icon}
          </span>
        </div>
        <p className={`mt-4 text-4xl font-semibold tracking-tight ${emphasis ? "text-white" : "text-slate-950"}`}>{value}</p>
        <p className={`mt-2 text-xs leading-5 ${emphasis ? "text-slate-400" : "text-slate-500"}`}>{hint}</p>
      </CardContent>
    </Card>
  );
}
