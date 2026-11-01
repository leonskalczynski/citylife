import type { DashboardActivityDay } from "@/features/dashboard/types";

export function ActivitySparkline({ activity }: { activity: DashboardActivityDay[] }) {
  const width = 188;
  const height = 54;
  const padding = 4;
  const max = Math.max(1, ...activity.flatMap((day) => [day.created, day.resolved]));
  const x = (index: number) => padding + (index * (width - padding * 2)) / Math.max(activity.length - 1, 1);
  const y = (value: number) => height - padding - (value / max) * (height - padding * 2);
  const points = (key: "created" | "resolved") => activity.map((day, index) => `${x(index)},${y(day[key])}`).join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-14 w-full" role="img" aria-label="Actividad de los últimos siete días">
      <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="var(--line)" strokeWidth="1" />
      <polyline points={points("created")} fill="none" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={points("resolved")} fill="none" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {activity.map((day, index) => (
        <circle key={day.date} cx={x(index)} cy={y(day.resolved)} r="2.5" fill="var(--surface)" stroke="var(--success)" strokeWidth="1.5" />
      ))}
    </svg>
  );
}
