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

const statusColors: Record<string, string> = {
  REPORTED: "bg-amber-500",
  VALIDATED: "bg-sky-500",
  REJECTED: "bg-rose-500",
  ASSIGNED: "bg-indigo-500",
  IN_PROGRESS: "bg-blue-500",
  RESOLVED: "bg-emerald-500",
  REOPENED: "bg-orange-500",
  CLOSED: "bg-slate-500",
};

const priorityLabels: Record<string, string> = {
  LOW: "Baja",
  NORMAL: "Normal",
  HIGH: "Alta",
  URGENT: "Urgente",
};

const priorityColors: Record<string, string> = {
  LOW: "bg-slate-400",
  NORMAL: "bg-sky-500",
  HIGH: "bg-amber-500",
  URGENT: "bg-rose-500",
};

const categoryColors = ["bg-emerald-500", "bg-sky-500", "bg-amber-500", "bg-violet-500", "bg-rose-500", "bg-teal-500"];

const roleCopy = {
  CITIZEN: {
    eyebrow: "Mi panel",
    title: "El pulso de tus avisos",
    subtitle: "Consulta cuántas incidencias has registrado y cómo avanza su resolución.",
  },
  OPERATOR: {
    eyebrow: "Panel de operación",
    title: "Resumen de la operación",
    subtitle: "Una lectura rápida del volumen, las colas de trabajo y la evolución de las incidencias.",
  },
  TECHNICIAN: {
    eyebrow: "Panel técnico",
    title: "Tu carga de trabajo",
    subtitle: "Revisa tus intervenciones activas, las que están por comenzar y tu histórico resuelto.",
  },
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
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">{copy.eyebrow}</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{copy.title}</h1>
            <p className="mt-3 max-w-2xl text-slate-600">{copy.subtitle}</p>
          </div>
          <RoleActions role={role} />
        </div>

        {dashboardQuery.isLoading && <DashboardSkeleton />}

        {dashboardQuery.isError && (
          <Card className="mt-8 border-red-200 shadow-none">
            <CardContent className="flex flex-col items-start gap-4 py-8 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-red-900">No se ha podido cargar el panel.</p>
                <p className="mt-1 text-sm text-red-700">Comprueba la conexión con la API e inténtalo de nuevo.</p>
              </div>
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
          description="Distribución actual del ciclo de vida."
          items={toStatusItems(dashboard.byStatus)}
          total={dashboard.totalIncidents}
          emptyMessage="Todavía no hay incidencias registradas."
        />
        <DashboardBreakdown
          title="Por prioridad"
          description="Nivel de atención de las incidencias registradas."
          items={toPriorityItems(dashboard.byPriority)}
          total={dashboard.totalIncidents}
          emptyMessage="Todavía no hay prioridades que mostrar."
        />
      </div>

      <div className="mt-5">
        <DashboardBreakdown
          title="Por categoría"
          description="Qué tipo de problemas concentra la actividad."
          items={dashboard.byCategory.map((item, index) => ({
            key: item.id,
            label: item.name,
            count: item.count,
            barClassName: categoryColors[index % categoryColors.length],
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
      { label: "Incidencias registradas", value: totalIncidents, hint: "Volumen total del municipio", icon: <ClipboardList className="size-4" /> },
      { label: "Pendientes de validar", value: indicators.awaitingValidation, hint: "Avisos recibidos sin revisar", icon: <Inbox className="size-4" /> },
      { label: "Pendientes de asignar", value: indicators.awaitingAssignment, hint: "Validadas sin destino operativo", icon: <UserRound className="size-4" /> },
      { label: "Urgentes abiertas", value: indicators.urgentOpen, hint: "Prioridad urgente sin cerrar", icon: <Clock3 className="size-4" /> },
    ];
  }
  if (dashboard.scope === "TECHNICIAN") {
    return [
      { label: "Trabajos asignados", value: totalIncidents, hint: "Incidencias bajo tu responsabilidad", icon: <Wrench className="size-4" /> },
      { label: "Por iniciar", value: indicators.awaitingStart, hint: "Asignadas pendientes de comenzar", icon: <Clock3 className="size-4" /> },
      { label: "En curso", value: indicators.inProgress, hint: "Intervenciones abiertas ahora", icon: <TrendingUp className="size-4" /> },
      { label: "Resueltas", value: indicators.resolved, hint: "Trabajos completados", icon: <CheckCircle2 className="size-4" /> },
    ];
  }
  return [
    { label: "Tus incidencias", value: totalIncidents, hint: "Avisos que has registrado", icon: <ClipboardList className="size-4" /> },
    { label: "Pendientes", value: indicators.awaitingValidation, hint: "En espera de revisión municipal", icon: <Inbox className="size-4" /> },
    { label: "En curso", value: indicators.activeWork, hint: "Validadas o en intervención", icon: <TrendingUp className="size-4" /> },
    { label: "Resueltas", value: indicators.resolved, hint: "Trabajos completados", icon: <CheckCircle2 className="size-4" /> },
  ];
}

function ResolutionCard({ dashboard }: { dashboard: Dashboard }) {
  const { resolution } = dashboard;
  const hasAverage = resolution.averageSeconds !== null;
  const progress = resolution.minimumSamples > 0
    ? Math.min(100, Math.round((resolution.sampleSize / resolution.minimumSamples) * 100))
    : 100;

  return (
    <Card className="border-slate-900 bg-slate-950 text-white shadow-none">
      <CardHeader>
        <p className="flex items-center gap-2 text-sm font-semibold text-slate-300"><Timer className="size-4 text-[var(--accent)]" />Tiempo medio de resolución</p>
      </CardHeader>
      <CardContent>
        {hasAverage ? (
          <>
            <p className="text-4xl font-semibold tracking-tight">{formatDuration(resolution.averageSeconds!)}</p>
            <p className="mt-3 text-sm leading-6 text-slate-400">Calculado sobre {resolution.sampleSize} incidencias resueltas.</p>
          </>
        ) : (
          <>
            <p className="text-2xl font-semibold tracking-tight">Aún no hay datos suficientes</p>
            <p className="mt-3 text-sm leading-6 text-slate-400">{resolution.sampleSize} de {resolution.minimumSamples} resoluciones necesarias para calcular una media fiable.</p>
          </>
        )}
        <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
          <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${progress}%` }} />
        </div>
      </CardContent>
    </Card>
  );
}

function OperationalCard({ dashboard, resolutionRate }: { dashboard: Dashboard; resolutionRate: number }) {
  const rows = operationalRows(dashboard.scope, dashboard.indicators, resolutionRate);
  return (
    <Card className="shadow-none lg:col-span-2">
      <CardHeader>
        <h2 className="text-lg font-semibold">Indicadores operativos</h2>
        <p className="text-sm text-slate-600">{operationalDescription(dashboard.scope)}</p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          {rows.map((row) => (
            <div key={row.label} className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{row.label}</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{row.value}</p>
              <p className="mt-1 text-xs text-slate-500">{row.hint}</p>
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
      { label: "En ejecución", value: indicators.activeWork, hint: "Asignadas o en intervención" },
      { label: "Sin técnico", value: indicators.assignedWithoutTechnician, hint: "Asignadas a un departamento sin persona" },
      { label: "Resueltas", value: indicators.resolved, hint: "Incidencias completadas" },
      { label: "Tasa de resolución", value: `${resolutionRate}%`, hint: "Resueltas sobre el total registrado" },
    ];
  }
  if (scope === "TECHNICIAN") {
    return [
      { label: "Carga activa", value: indicators.activeWork, hint: "Trabajos pendientes o en curso" },
      { label: "Urgentes abiertas", value: indicators.urgentOpen, hint: "Prioridad urgente sin resolver" },
      { label: "Resueltas", value: indicators.resolved, hint: "Trabajos completados" },
      { label: "Tasa de resolución", value: `${resolutionRate}%`, hint: "Resueltas sobre tus trabajos" },
    ];
  }
  return [
    { label: "En curso", value: indicators.activeWork, hint: "Avisos en gestión municipal" },
    { label: "Urgentes abiertas", value: indicators.urgentOpen, hint: "Prioridad urgente sin resolver" },
    { label: "Rechazadas", value: indicators.rejected, hint: "Avisos descartados con motivo" },
    { label: "Tasa de resolución", value: `${resolutionRate}%`, hint: "Resueltas sobre tus avisos" },
  ];
}

function operationalDescription(scope: Dashboard["scope"]) {
  if (scope === "OPERATOR") return "Colas y carga actual para priorizar la revisión diaria.";
  if (scope === "TECHNICIAN") return "Estado de los trabajos que tienes asignados.";
  return "Cómo avanzan los avisos que has registrado.";
}

function toStatusItems(values: DashboardBreakdownValue[]) {
  return values.map((item) => ({
    key: item.key,
    label: statusLabels[item.key] ?? item.key,
    count: item.count,
    barClassName: statusColors[item.key] ?? "bg-slate-400",
  }));
}

function toPriorityItems(values: DashboardBreakdownValue[]) {
  return values.map((item) => ({
    key: item.key,
    label: priorityLabels[item.key] ?? item.key,
    count: item.count,
    barClassName: priorityColors[item.key] ?? "bg-slate-400",
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
        {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-40 animate-pulse rounded-lg border border-slate-200 bg-white" />)}
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="h-56 animate-pulse rounded-lg border border-slate-200 bg-white" />
        <div className="h-56 animate-pulse rounded-lg border border-slate-200 bg-white lg:col-span-2" />
      </div>
    </div>
  );
}
