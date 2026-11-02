import { Link } from "react-router";

export type DistributionItem = {
  key: string;
  label: string;
  count: number;
  colorClass: string;
  href?: string;
};

type DashboardDistributionProps = {
  title: string;
  items: DistributionItem[];
  total: number;
  variant?: "segmented" | "bars";
  emptyMessage: string;
};

export function DashboardDistribution({ title, items, total, variant = "segmented", emptyMessage }: DashboardDistributionProps) {
  const visible = items.filter((item) => item.count > 0);

  return (
    <div className="rounded-[14px] border border-[var(--line)] bg-[var(--surface)] p-5">
      <h3 className="text-sm font-semibold">{title}</h3>
      {visible.length === 0 ? (
        <p className="py-8 text-center text-xs text-[var(--muted)]">{emptyMessage}</p>
      ) : variant === "segmented" ? (
        <>
          <div className="mt-5 flex h-3 overflow-hidden rounded-full bg-[var(--surface-soft)]" aria-hidden="true">
            {visible.map((item) => (
              <span key={item.key} className={item.colorClass} style={{ flexGrow: item.count }} />
            ))}
          </div>
          <ul className="mt-5 space-y-3">
            {visible.map((item) => (
              <li key={item.key}>
                <DistributionRow item={item} total={total} />
              </li>
            ))}
          </ul>
        </>
      ) : (
        <ul className="mt-5 space-y-4">
          {visible.map((item) => {
            const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;
            const content = (
              <>
                <div className="flex items-baseline justify-between gap-4 text-sm">
                  <span className="font-medium">{item.label}</span>
                  <span className="tabular-nums text-[var(--muted)]">{item.count} · {percentage}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--surface-soft)]" aria-hidden="true">
                  <span className={`block h-full rounded-full ${item.colorClass}`} style={{ width: `${Math.max(percentage, 2)}%` }} />
                </div>
              </>
            );
            return (
              <li key={item.key}>
                {item.href ? <Link className="block rounded-xl p-1 -m-1 transition-colors hover:bg-[var(--surface-soft)]" to={item.href}>{content}</Link> : content}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function DistributionRow({ item, total }: { item: DistributionItem; total: number }) {
  const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;
  const content = (
    <>
      <span className="flex min-w-0 items-center gap-2">
        <span className={`size-2.5 shrink-0 rounded-full ${item.colorClass}`} aria-hidden="true" />
        <span className="truncate font-medium">{item.label}</span>
      </span>
      <span className="shrink-0 tabular-nums text-[var(--muted)]">{item.count} · {percentage}%</span>
    </>
  );
  return item.href ? (
    <Link className="flex items-center justify-between gap-3 rounded-lg text-sm transition-opacity hover:opacity-70" to={item.href}>{content}</Link>
  ) : (
    <div className="flex items-center justify-between gap-3 text-sm">{content}</div>
  );
}
