import { Card, CardContent, CardHeader } from "@/components/ui/card";

export type BreakdownDisplayItem = {
  key: string;
  label: string;
  count: number;
  barClassName: string;
};

type DashboardBreakdownProps = {
  title: string;
  items: BreakdownDisplayItem[];
  total: number;
  emptyMessage: string;
};

export function DashboardBreakdown({ title, items, total, emptyMessage }: DashboardBreakdownProps) {
  const visibleItems = items.filter((item) => item.count > 0);

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold">{title}</h2>
      </CardHeader>
      <CardContent>
        {visibleItems.length === 0 ? (
          <p className="py-8 text-center text-sm text-[var(--muted)]">{emptyMessage}</p>
        ) : (
          <ul className="space-y-4">
            {visibleItems.map((item) => {
              const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;
              return (
                <li key={item.key}>
                  <div className="flex items-baseline justify-between gap-4 text-sm">
                    <span className="font-medium text-[var(--ink)]">{item.label}</span>
                    <span className="tabular-nums text-[var(--muted)]">{item.count} · {percentage}%</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--surface-soft)]" aria-hidden="true">
                    <div className={`h-full rounded-full ${item.barClassName}`} style={{ width: `${Math.max(percentage, 2)}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
