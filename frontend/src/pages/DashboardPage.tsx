import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Inbox,
  Plus,
  RefreshCw,
  Timer,
  TrendingUp,
  UserRound,
  Wrench,
} from "lucide-react";
import { Link } from "react-router";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAuth } from "@/features/auth/components/AuthProvider";
import { getDashboard } from "@/features/dashboard/api/dashboardApi";
import { DashboardBreakdown } from "@/features/dashboard/components/DashboardBreakdown";
import { DashboardMetricCard } from "@/features/dashboard/components/DashboardMetricCard";
import type { Dashboard, DashboardBreakdown as DashboardBreakdownValue, DashboardIndicators } from "@/features/dashboard/types";

const statusLabels: Record<string, string> = {
  REPORTED: "Reportada",
  VALIDATED: "Validada",
  REJECTED: "Rechazada",
  ASSIGNED: "Asignada",
  IN_PROGRESS: "En curso",
  RESOLVED: "Resuelta",
  REOPENED: "Reabierta",
  CLOSED: "Cerrada",
};

const priorityLabels: Record<string, string> = {
  LOW: "Baja",
  NORMAL: "Normal",
  HIGH: "Alta",
  URGENT: "Urgente",
};

const priorityColors: Record<string, string> = {
  LOW: "bg-[var(--line-strong)]",
  NORMAL: "bg-[color-mix(in_srgb,var(--accent)_55%,var(--surface-soft))]",
  HIGH: "bg-[color-mix(in_srgb,var(--accent)_80%,var(--surface-soft))]",
  URGENT: "bg-[var(--accent)]",
};

const roleCopy = {
  CITIZEN: { title: "Mi panel" },
  OPERATOR: { title: "Resumen de la operación" },
  TECHNICIAN: { title: "Tu carga de trabajo" },
} as const;

export function DashboardPage() {
  const { token, user } = useAuth();
  const dashboardQuery = useQuery({
    queryKey: ["dashboard", user?.id],
    queryFn: ({ signal }) => getDashboard(token!, signal),
    enabled: Boolean(token && user),
  });

  const role = dashboardQuery.data?.scope ?? user?.role ?? "CITIZEN";
  const copy = roleCopy[role as keyof typeof roleCopy] ?? roleCopy.CITIZEN;

  return (
    <AppShell>
      <section className="mx-auto max-w-6xl px-5 py-10 sm:px-6 sm:py-14">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{copy.title}</h1>
          <RoleActions role={role} />
        </div>

        {dashboardQuery.isLoading && <DashboardSkeleton />}

        {dashboardQuery.isError && (
          <Card className="mt-8">
            <CardContent className="flex flex-col items-start gap-4 py-8 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-semibold text-[var(--danger)]">No se ha podido cargar el panel.</p>
              <Button type="button" variant="outline" onClick={() => dashboardQuery.refetch()}>
                <RefreshCw className="mr-2 size-4" />Reintentar
              </Button>
            </CardContent>
          </Card>
        )}

        {dashboardQuery.data && <DashboardContent dashboard={dashboardQuery.data} />}
      </section>
    </AppShell>
  );
}

function RoleActions({ role }: { role: string }) {
  if (role === "OPERATOR") {
    return <Button asChild size="lg"><Link to="/operations/incidents"><BriefcaseBusiness className="mr-2 size-4" />Abrir bandeja<ArrowRight className="ml-2 size-4" /></Link></Button>;
  }
  if (role === "TECHNICIAN") {
    return <Button asChild size="lg"><Link to="/work"><Wrench className="mr-2 size-4" />Ver mis trabajos<ArrowRight className="ml-2 size-4" /></Link></Button>;
  }
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <Button asChild size="lg"><Link to="/incidents/new"><Plus className="mr-2 size-4" />Reportar incidencia</Link></Button>
      <Button asChild size="lg" variant="outline"><Link to="/my-incidents"><ClipboardList className="mr-2 size-4" />Mis incidencias</Link></Button>
    </div>
  );
}

function DashboardContent({ dashboard }: { dashboard: Dashboard }) {
  const metrics = metricCards(dashboard);
  const resolutionRate = dashboard.totalIncidents > 0 ? Math.round((dashboard.indicators.resolved / dashboard.totalIncidents) * 100) : 0;

  return (
    <>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric, index) => <DashboardMetricCard key={metric.label} {...metric} emphasis={index === 0} />)}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <ResolutionCard dashboard={dashboard} />
        <OperationalCard dashboard={dashboard} resolutionRate={resolutionRate} />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <DashboardBreakdown
          title="Por estado"
          items={toStatusItems(dashboard.byStatus)}
          total={dashboard.totalIncidents}
          emptyMessage="Todavía no hay incidencias registradas."
        />
        <DashboardBreakdown
          title="Por prioridad"
          items={toPriorityItems(dashboard.byPriority)}
          total={dashboard.totalIncidents}
          emptyMessage="Todavía no hay prioridades que mostrar."
        />
      </div>

      <div className="mt-5">
        <DashboardBreakdown
          title="Por categoría"
          items={dashboard.byCategory.map((item) => ({
            key: item.id,
            label: item.name,
            count: item.count,
            barClassName: "bg-[var(--accent)]",
          }))}
          total={dashboard.totalIncidents}
          emptyMessage="Todavía no hay categorías con incidencias."
        />
      </div>
    </>
  );
}

function metricCards(dashboard: Dashboard) {
  const { indicators, totalIncidents } = dashboard;
  if (dashboard.scope === "OPERATOR") {
    return [
      { label: "Incidencias registradas", value: totalIncidents, icon: <ClipboardList className="size-4" /> },
      { label: "Pendientes de validar", value: indicators.awaitingValidation, icon: <Inbox className="size-4" /> },
      { label: "Pendientes de asignar", value: indicators.awaitingAssignment, icon: <UserRound className="size-4" /> },
      { label: "Urgentes abiertas", value: indicators.urgentOpen, icon: <Clock3 className="size-4" /> },
    ];
  }
  if (dashboard.scope === "TECHNICIAN") {
    return [
      { label: "Trabajos asignados", value: totalIncidents, icon: <Wrench className="size-4" /> },
      { label: "Por iniciar", value: indicators.awaitingStart, icon: <Clock3 className="size-4" /> },
      { label: "En curso", value: indicators.inProgress, icon: <TrendingUp className="size-4" /> },
      { label: "Resueltas", value: indicators.resolved, icon: <CheckCircle2 className="size-4" /> },
    ];
  }
  return [
    { label: "Tus incidencias", value: totalIncidents, icon: <ClipboardList className="size-4" /> },
    { label: "Pendientes", value: indicators.awaitingValidation, icon: <Inbox className="size-4" /> },
    { label: "En curso", value: indicators.activeWork, icon: <TrendingUp className="size-4" /> },
    { label: "Resueltas", value: indicators.resolved, icon: <CheckCircle2 className="size-4" /> },
  ];
}

function ResolutionCard({ dashboard }: { dashboard: Dashboard }) {
  const { resolution } = dashboard;
  const hasAverage = resolution.averageSeconds !== null;
  const progress = resolution.minimumSamples > 0
    ? Math.min(100, Math.round((resolution.sampleSize / resolution.minimumSamples) * 100))
    : 100;

  return (
    <Card className="bg-[var(--accent)]">
      <CardHeader>
        <p className="flex items-center gap-2 text-sm font-semibold text-[var(--ink)]"><Timer className="size-4" />Tiempo medio de resolución</p>
      </CardHeader>
      <CardContent>
        {hasAverage ? (
          <p className="text-4xl font-semibold tracking-tight text-[var(--ink)]">{formatDuration(resolution.averageSeconds!)}</p>
        ) : (
          <>
            <p className="text-2xl font-semibold tracking-tight text-[var(--ink)]">Aún no hay datos suficientes</p>
            <p className="mt-3 text-sm leading-6 text-[var(--accent-ink)]">{resolution.sampleSize} de {resolution.minimumSamples} resoluciones necesarias.</p>
          </>
        )}
        <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--ink)_12%,transparent)]" aria-hidden="true">
          <div className="h-full rounded-full bg-[var(--ink)]" style={{ width: `${progress}%` }} />
        </div>
      </CardContent>
    </Card>
  );
}

function OperationalCard({ dashboard, resolutionRate }: { dashboard: Dashboard; resolutionRate: number }) {
  const rows = operationalRows(dashboard.scope, dashboard.indicators, resolutionRate);
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <h2 className="text-lg font-semibold">Indicadores operativos</h2>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {rows.map((row) => (
            <div key={row.label} className="rounded-xl bg-[var(--surface-soft)] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">{row.label}</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--ink)]">{row.value}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function operationalRows(scope: Dashboard["scope"], indicators: DashboardIndicators, resolutionRate: number) {
  if (scope === "OPERATOR") {
    return [
      { label: "En ejecución", value: indicators.activeWork },
      { label: "Sin técnico", value: indicators.assignedWithoutTechnician },
      { label: "Resueltas", value: indicators.resolved },
      { label: "Tasa de resolución", value: `${resolutionRate}%` },
    ];
  }
  if (scope === "TECHNICIAN") {
    return [
      { label: "Carga activa", value: indicators.activeWork },
      { label: "Urgentes abiertas", value: indicators.urgentOpen },
      { label: "Resueltas", value: indicators.resolved },
      { label: "Tasa de resolución", value: `${resolutionRate}%` },
    ];
  }
  return [
    { label: "En curso", value: indicators.activeWork },
    { label: "Urgentes abiertas", value: indicators.urgentOpen },
    { label: "Rechazadas", value: indicators.rejected },
    { label: "Tasa de resolución", value: `${resolutionRate}%` },
  ];
}

function toStatusItems(values: DashboardBreakdownValue[]) {
  return values.map((item) => ({
    key: item.key,
    label: statusLabels[item.key] ?? item.key,
    count: item.count,
    barClassName: "bg-[var(--accent)]",
  }));
}

function toPriorityItems(values: DashboardBreakdownValue[]) {
  return values.map((item) => ({
    key: item.key,
    label: priorityLabels[item.key] ?? item.key,
    count: item.count,
    barClassName: priorityColors[item.key] ?? "bg-[var(--line-strong)]",
  }));
}

function formatDuration(seconds: number) {
  if (seconds < 60) return `${seconds} s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} min`;
  const hours = seconds / 3600;
  if (hours < 24) {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    return minutes > 0 ? `${wholeHours} h ${minutes} min` : `${wholeHours} h`;
  }
  const days = Math.floor(hours / 24);
  const remainingHours = Math.round(hours - days * 24);
  return remainingHours > 0 ? `${days} d ${remainingHours} h` : `${days} d`;
}

function DashboardSkeleton() {
  return (
    <div className="mt-8 space-y-5" aria-label="Cargando panel">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-32 animate-pulse rounded-2xl bg-[var(--surface)]" />)}
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="h-56 animate-pulse rounded-2xl bg-[var(--surface)]" />
        <div className="h-56 animate-pulse rounded-2xl bg-[var(--surface)] lg:col-span-2" />
      </div>
    </div>
  );
}
