import { Card, CardContent, CardHeader } from "@/components/ui/card";

export type BreakdownDisplayItem = {
  key: string;
  label: string;
  count: number;
  barClassName: string;
};

type DashboardBreakdownProps = {
  title: string;
  description: string;
  items: BreakdownDisplayItem[];
  total: number;
  emptyMessage: string;
};

export function DashboardBreakdown({ title, description, items, total, emptyMessage }: DashboardBreakdownProps) {
  const visibleItems = items.filter((item) => item.count > 0);

  return (
    <Card className="shadow-none">
      <CardHeader>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-slate-600">{description}</p>
      </CardHeader>
      <CardContent>
        {visibleItems.length === 0 ? (
          <p className="rounded-md bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">{emptyMessage}</p>
        ) : (
          <ul className="space-y-4">
            {visibleItems.map((item) => {
              const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;
              return (
                <li key={item.key}>
                  <div className="flex items-baseline justify-between gap-4 text-sm">
                    <span className="font-medium text-slate-700">{item.label}</span>
                    <span className="tabular-nums text-slate-500">{item.count} · {percentage}%</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
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
