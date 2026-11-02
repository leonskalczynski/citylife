import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  CircleAlert,
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
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/features/auth/components/AuthProvider";
import { getDashboard } from "@/features/dashboard/api/dashboardApi";
import { ActionQueueCard } from "@/features/dashboard/components/ActionQueueCard";
import { ActivitySparkline } from "@/features/dashboard/components/ActivitySparkline";
import { DashboardDistribution, type DistributionItem } from "@/features/dashboard/components/DashboardDistribution";
import { DashboardSection } from "@/features/dashboard/components/DashboardSection";
import { OperationalPulse } from "@/features/dashboard/components/OperationalPulse";
import { TerritoryPanel } from "@/features/dashboard/components/TerritoryPanel";
import type { Dashboard, DashboardBreakdown, DashboardIndicators } from "@/features/dashboard/types";

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

const statusColors: Record<string, string> = {
  REPORTED: "bg-[var(--ink)]",
  VALIDATED: "bg-[color-mix(in_srgb,var(--accent-ink)_55%,var(--accent))]",
  ASSIGNED: "bg-[color-mix(in_srgb,var(--ink)_45%,var(--accent))]",
  IN_PROGRESS: "bg-[color-mix(in_srgb,var(--ink)_20%,var(--accent))]",
  RESOLVED: "bg-[var(--success)]",
  REOPENED: "bg-[color-mix(in_srgb,var(--ink)_70%,var(--success))]",
  REJECTED: "bg-[var(--line-strong)]",
  CLOSED: "bg-[color-mix(in_srgb,var(--success)_58%,var(--line-strong))]",
};

const priorityColors: Record<string, string> = {
  LOW: "bg-[var(--line-strong)]",
  NORMAL: "bg-[color-mix(in_srgb,var(--accent)_55%,var(--surface-soft))]",
  HIGH: "bg-[color-mix(in_srgb,var(--accent)_82%,var(--surface-soft))]",
  URGENT: "bg-[var(--ink)]",
};

export function DashboardPage() {
  const { token, user } = useAuth();
  const hasOperationalDashboard = user?.role === "CITIZEN" || user?.role === "OPERATOR" || user?.role === "TECHNICIAN";
  const dashboardQuery = useQuery({
    queryKey: ["dashboard", user?.id],
    queryFn: ({ signal }) => getDashboard(token!, signal),
    enabled: Boolean(token && user && hasOperationalDashboard),
  });

  const role = dashboardQuery.data?.scope ?? user?.role ?? "CITIZEN";
  const firstName = user?.displayName?.split(" ")[0];

  if (user && !hasOperationalDashboard) {
    return <RoleLanding role={user.role} firstName={firstName} />;
  }

  return (
    <AppShell>
      <section className="mx-auto max-w-6xl px-5 py-8 sm:px-6 sm:py-10">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--muted)]">{formatToday()}</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{greetingFor(role, firstName)}</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">{heroLineFor(role)}</p>

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

        {dashboardQuery.data && <DashboardContent dashboard={dashboardQuery.data} role={role} />}
      </section>
    </AppShell>
  );
}

function RoleLanding({ role, firstName }: { role: string; firstName?: string }) {
  const roleName = role === "ADMIN" ? "Administración" : "Análisis";
  return (
    <AppShell>
      <section className="mx-auto max-w-4xl px-5 py-12 sm:px-6 sm:py-16">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--muted)]">{roleName}</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Hola, {firstName || "equipo"}</h1>
        <Card className="mt-8">
          <CardContent className="py-10">
            <h2 className="text-xl font-semibold">Tu cuenta está activa</h2>
            <p className="mt-3 max-w-2xl leading-7 text-[var(--muted)]">Este rol no tiene tareas operativas asignadas en Citylife. Puedes consultar tu identidad y cerrar sesión desde el menú de usuario.</p>
          </CardContent>
        </Card>
      </section>
    </AppShell>
  );
}

function DashboardContent({ dashboard, role }: { dashboard: Dashboard; role: string }) {
  const { indicators, pulse, resolution } = dashboard;
  const reviewCount = role === "TECHNICIAN" ? indicators.awaitingStart : indicators.awaitingValidation;
  const reviewLabel = role === "TECHNICIAN" ? "por iniciar" : reviewCount === 1 ? "requiere revisión" : "requieren revisión";
  const incidentHref = (id: string) => role === "OPERATOR" ? `/operations/incidents/${id}` : role === "TECHNICIAN" ? `/work/${id}` : `/incidents/${id}`;
  const listHref = (params?: Record<string, string>) => {
    if (role === "OPERATOR") {
      const query = new URLSearchParams(params).toString();
      return `/operations/incidents${query ? `?${query}` : ""}`;
    }
    return role === "TECHNICIAN" ? "/work" : "/my-incidents";
  };
  const visibleActions = actionCards(role, indicators, listHref).filter((card) => card.count > 0);

  return (
    <>
      <CityPulseHero dashboard={dashboard} role={role} reviewCount={reviewCount} reviewLabel={reviewLabel} />

      <DashboardSection index="01" title={visibleActions.length > 0 ? "Qué necesita acción" : "Todo al día"} aside={<Link className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent-ink)] hover:underline" to={listHref()}>Ver {role === "TECHNICIAN" ? "trabajos" : "incidencias"} <ArrowRight className="size-3.5" /></Link>}>
        {visibleActions.length > 0 ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{visibleActions.map((card) => <ActionQueueCard key={card.label} {...card} />)}</div> : <Card><CardContent className="flex items-center gap-3 py-6"><CheckCircle2 className="size-5 text-[var(--success)]" aria-hidden="true" /><p className="font-medium">No hay tareas pendientes en este momento.</p></CardContent></Card>}
      </DashboardSection>

      {role === "OPERATOR" && <details className="mt-10 rounded-[14px] border border-[var(--line)] bg-[var(--surface)] open:pb-2">
        <summary className="cursor-pointer px-5 py-4 font-semibold focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-[color-mix(in_srgb,var(--accent)_50%,transparent)]">Ver análisis operativo</summary>
        <div className="border-t border-[var(--line)] px-5">
          <DashboardSection index="02" title="Rendimiento" aside={<span className="text-xs text-[var(--muted)]">Últimos 7 días</span>}><div className="grid gap-3 lg:grid-cols-3"><ResolutionRateCard dashboard={dashboard} /><ResolutionTimeCard resolution={resolution} /><WeeklyActivityCard dashboard={dashboard} /></div></DashboardSection>
          <DashboardSection index="03" title="Distribución" aside={<span className="text-xs text-[var(--muted)]">{dashboard.totalIncidents} {dashboard.totalIncidents === 1 ? "incidencia" : "incidencias"}</span>}>
            <div className="grid gap-3 lg:grid-cols-3">
              <DashboardDistribution title="Por estado" items={toDistributionItems(dashboard.byStatus, statusLabels, statusColors, (key) => listHref({ status: key }))} total={dashboard.totalIncidents} emptyMessage="Todavía no hay incidencias registradas." />
              <DashboardDistribution title="Por prioridad" items={toDistributionItems(dashboard.byPriority, priorityLabels, priorityColors, (key) => listHref({ priority: key }))} total={dashboard.totalIncidents} emptyMessage="Todavía no hay prioridades que mostrar." />
              <DashboardDistribution title="Por categoría" items={dashboard.byCategory.map((item) => ({ key: item.id, label: item.name, count: item.count, colorClass: "bg-[var(--accent)]", href: listHref({ categoryId: item.id }) }))} total={dashboard.totalIncidents} variant="bars" emptyMessage="Todavía no hay categorías con incidencias." />
            </div>
          </DashboardSection>
          <DashboardSection index="04" title="Dónde ocurre" aside={<span className="text-xs text-[var(--muted)]">{pulse.mapPoints.length > 0 ? "Actividad geolocalizada" : "Sin ubicaciones"}</span>}><TerritoryPanel points={pulse.mapPoints} districts={pulse.byDistrict} incidentHref={incidentHref} districtHref={(district) => listHref({ district })} /></DashboardSection>
        </div>
      </details>}
    </>
  );
}

function CityPulseHero({ dashboard, role, reviewCount, reviewLabel }: { dashboard: Dashboard; role: string; reviewCount: number; reviewLabel: string }) {
  const { pulse, indicators } = dashboard;
  return (
    <Card className="city-grid relative mt-8 overflow-hidden">
      <div className="relative p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
              <span className="size-2 rounded-full bg-[var(--accent)]" aria-hidden="true" />
              Resumen actualizado · {workspaceFor(role)}
            </div>
            <div className="mt-5 flex flex-wrap items-end gap-x-4 gap-y-1">
              <span className="text-5xl font-semibold leading-none tracking-[-0.04em] tabular-nums sm:text-6xl">{pulse.activeIncidents}</span>
              <div className="pb-1">
                <p className="text-lg font-semibold">incidencias activas</p>
                <p className="text-sm text-[var(--muted)]">{pulse.createdToday > 0 ? `${pulse.createdToday} ${pulse.createdToday === 1 ? "nueva" : "nuevas"} hoy` : "Sin nuevas hoy"} · {pulse.createdLast7Days} esta semana</p>
              </div>
            </div>
            <div className="mt-7 flex flex-wrap items-center gap-x-3 gap-y-2">
              <HeroStat value={reviewCount} label={reviewLabel} />
              <span className="h-1 w-1 rounded-full bg-[var(--line-strong)]" aria-hidden="true" />
              <HeroStat value={pulse.resolvedToday} label={pulse.resolvedToday === 1 ? "resuelta hoy" : "resueltas hoy"} />
              <span className="h-1 w-1 rounded-full bg-[var(--line-strong)]" aria-hidden="true" />
              <HeroStat value={indicators.urgentOpen} label={indicators.urgentOpen === 1 ? "urgente abierta" : "urgentes abiertas"} emphasis={indicators.urgentOpen > 0} />
            </div>
          </div>
          <div className="flex flex-col items-start gap-2 lg:items-end">
            <RoleAction role={role} />
          </div>
        </div>
        <OperationalPulse events={pulse.recentEvents} incidentHref={(id) => role === "OPERATOR" ? `/operations/incidents/${id}` : role === "TECHNICIAN" ? `/work/${id}` : `/incidents/${id}`} />
      </div>
    </Card>
  );
}

function HeroStat({ value, label, emphasis = false }: { value: number; label: string; emphasis?: boolean }) {
  return (
    <span className="inline-flex items-baseline gap-1.5 text-sm text-[var(--muted)]">
      <span className={`text-base font-semibold tabular-nums ${emphasis ? "text-[var(--ink)]" : "text-[var(--ink)]"}`}>{value}</span>
      {label}
    </span>
  );
}

function RoleAction({ role }: { role: string }) {
  if (role === "OPERATOR") {
    return <Button asChild size="lg"><Link to="/operations/incidents"><BriefcaseBusiness className="mr-2 size-4" />Abrir bandeja<ArrowRight className="ml-2 size-4" /></Link></Button>;
  }
  if (role === "TECHNICIAN") {
    return <Button asChild size="lg"><Link to="/work"><Wrench className="mr-2 size-4" />Ver mis trabajos<ArrowRight className="ml-2 size-4" /></Link></Button>;
  }
  return (
    <div className="flex flex-wrap gap-2">
      <Button asChild size="lg"><Link to="/incidents/new"><Plus className="mr-2 size-4" />Reportar incidencia</Link></Button>
      <Button asChild size="lg" variant="ghost"><Link to="/my-incidents"><ClipboardList className="mr-2 size-4" />Mis incidencias</Link></Button>
    </div>
  );
}

function actionCards(role: string, indicators: DashboardIndicators, listHref: (params?: Record<string, string>) => string) {
  if (role === "OPERATOR") {
    return [
      { label: "Pendientes de validar", count: indicators.awaitingValidation, context: "Esperando revisión municipal", href: listHref({ status: "REPORTED" }), icon: <Inbox className="size-5" />, accent: true },
      { label: "Pendientes de asignar", count: indicators.awaitingAssignment, context: "Validadas sin destino operativo", href: listHref({ status: "VALIDATED" }), icon: <UserRound className="size-5" /> },
      { label: "Sin técnico", count: indicators.assignedWithoutTechnician, context: "Asignadas sin una persona responsable", href: listHref({ status: "ASSIGNED", withoutTechnician: "true" }), icon: <Wrench className="size-5" /> },
      { label: "Urgentes abiertas", count: indicators.urgentOpen, context: "Prioridad máxima sin cerrar", href: listHref({ priority: "URGENT" }), icon: <CircleAlert className="size-5" />, accent: true },
    ];
  }
  if (role === "TECHNICIAN") {
    return [
      { label: "Por iniciar", count: indicators.awaitingStart, context: "Asignadas pendientes de comenzar", href: listHref(), icon: <Clock3 className="size-5" />, accent: true },
      { label: "En curso", count: indicators.inProgress, context: "Intervenciones abiertas ahora", href: listHref(), icon: <TrendingUp className="size-5" /> },
      { label: "Urgentes abiertas", count: indicators.urgentOpen, context: "Prioridad máxima sin resolver", href: listHref(), icon: <CircleAlert className="size-5" />, accent: true },
    ];
  }
  return [
    { label: "Pendientes de revisión", count: indicators.awaitingValidation, context: "En espera de revisión municipal", href: listHref(), icon: <Inbox className="size-5" />, accent: true },
    { label: "En curso", count: indicators.activeWork, context: "Validadas o en intervención", href: listHref(), icon: <TrendingUp className="size-5" /> },
    { label: "Urgentes abiertas", count: indicators.urgentOpen, context: "Prioridad máxima sin resolver", href: listHref(), icon: <CircleAlert className="size-5" />, accent: true },
  ];
}

function ResolutionRateCard({ dashboard }: { dashboard: Dashboard }) {
  const { totalIncidents, indicators, pulse } = dashboard;
  const totalResolved = indicators.resolved;
  const rate = totalIncidents > 0 ? Math.round((totalResolved / totalIncidents) * 100) : 0;
  const weeklyRate = pulse.createdLast7Days > 0 ? Math.round((pulse.resolvedLast7Days / pulse.createdLast7Days) * 100) : 0;
  const previousRate = pulse.createdPrevious7Days > 0 ? Math.round((pulse.resolvedPrevious7Days / pulse.createdPrevious7Days) * 100) : 0;
  const delta = weeklyRate - previousRate;

  return (
    <div className="flex flex-col rounded-[14px] border border-[var(--line)] bg-[var(--surface)] p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">Tasa de resolución</h3>
        <CheckCircle2 className="size-4 text-[var(--success)]" aria-hidden="true" />
      </div>
      <p className="mt-5 text-4xl font-semibold leading-none tracking-[-0.04em] tabular-nums">{rate}%</p>
      <p className="mt-3 text-xs text-[var(--muted)]">{totalResolved} de {totalIncidents} {totalIncidents === 1 ? "incidencia cerrada" : "incidencias cerradas"}</p>
      <div className="mt-auto pt-6">
        <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-soft)]" aria-hidden="true">
          <span className="block h-full rounded-full bg-[var(--success)]" style={{ width: `${Math.max(rate, 2)}%` }} />
        </div>
        <p className={`mt-3 text-xs ${delta > 0 ? "text-[var(--success)]" : "text-[var(--muted)]"}`}>
          {pulse.createdPrevious7Days > 0 ? `${delta >= 0 ? "+" : ""}${delta} pp de ritmo semanal` : `${pulse.resolvedLast7Days} ${pulse.resolvedLast7Days === 1 ? "resuelta" : "resueltas"} esta semana`}
        </p>
      </div>
    </div>
  );
}

function ResolutionTimeCard({ resolution }: { resolution: Dashboard["resolution"] }) {
  const hasAverage = resolution.averageSeconds !== null;
  const remaining = Math.max(resolution.minimumSamples - resolution.sampleSize, 0);
  return (
    <div className="flex flex-col rounded-[14px] border border-[var(--line)] bg-[var(--surface)] p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">Tiempo medio de resolución</h3>
        <Timer className="size-4 text-[var(--muted)]" aria-hidden="true" />
      </div>
      {hasAverage ? (
        <>
          <p className="mt-5 text-4xl font-semibold leading-none tracking-[-0.04em] tabular-nums">{formatDuration(resolution.averageSeconds!)}</p>
          <p className="mt-3 text-xs text-[var(--muted)]">Basado en {resolution.sampleSize} resoluciones</p>
          <div className="mt-auto pt-6">
            <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-soft)]" aria-hidden="true">
              <span className="block h-full rounded-full bg-[var(--accent)]" style={{ width: "100%" }} />
            </div>
          </div>
        </>
      ) : (
        <>
          <p className="mt-5 text-lg font-semibold leading-6">Aún no hay datos suficientes</p>
          <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{resolution.sampleSize} de {resolution.minimumSamples} resoluciones necesarias.</p>
          <div className="mt-auto pt-6">
            <div className="flex gap-1.5" aria-hidden="true">
              {Array.from({ length: resolution.minimumSamples }).map((_, index) => (
                <span key={index} className={`h-1.5 flex-1 rounded-full ${index < resolution.sampleSize ? "bg-[var(--accent)]" : "bg-[var(--surface-soft)]"}`} />
              ))}
            </div>
            <p className="mt-3 text-xs text-[var(--muted)]">{remaining === 1 ? "Falta 1 resolución para calcular la media." : `Faltan ${remaining} resoluciones para calcular la media.`}</p>
          </div>
        </>
      )}
    </div>
  );
}

function WeeklyActivityCard({ dashboard }: { dashboard: Dashboard }) {
  const { pulse } = dashboard;
  const delta = pulse.createdLast7Days - pulse.createdPrevious7Days;
  return (
    <div className="flex flex-col rounded-[14px] border border-[var(--line)] bg-[var(--surface)] p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">Actividad</h3>
        <div className="flex items-center gap-3 text-[10px] font-medium text-[var(--muted)]">
          <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-[var(--ink)]" />Nuevas</span>
          <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-[var(--success)]" />Resueltas</span>
        </div>
      </div>
      <div className="mt-4"><ActivitySparkline activity={pulse.activity} /></div>
      <div className="mt-auto flex items-end justify-between gap-3 pt-4">
        <p className="text-xs text-[var(--muted)]"><span className="font-semibold text-[var(--ink)]">{pulse.createdLast7Days}</span> {pulse.createdLast7Days === 1 ? "nueva" : "nuevas"} · <span className="font-semibold text-[var(--ink)]">{pulse.resolvedLast7Days}</span> {pulse.resolvedLast7Days === 1 ? "resuelta" : "resueltas"}</p>
        <p className={`text-xs font-medium ${delta > 0 ? "text-[var(--success)]" : "text-[var(--muted)]"}`}>{delta > 0 ? `+${delta} vs. anterior` : delta < 0 ? `${delta} vs. anterior` : "Sin cambios"}</p>
      </div>
    </div>
  );
}

function toDistributionItems(values: DashboardBreakdown[], labels: Record<string, string>, colors: Record<string, string>, href: (key: string) => string): DistributionItem[] {
  return values.map((item) => ({
    key: item.key,
    label: labels[item.key] ?? item.key,
    count: item.count,
    colorClass: colors[item.key] ?? "bg-[var(--line-strong)]",
    href: href(item.key),
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

function greetingFor(role: string, firstName?: string) {
  const hour = new Date().getHours();
  const salutation = hour < 12 ? "Buenos días" : hour < 20 ? "Buenas tardes" : "Buenas noches";
  if (role === "OPERATOR") return `${salutation}, equipo`;
  return `${salutation}, ${firstName || "ciudad"}`;
}

function heroLineFor(role: string) {
  if (role === "OPERATOR") return "Así está la ciudad hoy.";
  if (role === "TECHNICIAN") return "Tu jornada de campo, de un vistazo.";
  return "Así avanzan tus avisos.";
}

function workspaceFor(role: string) {
  if (role === "OPERATOR") return "Centro de control";
  if (role === "TECHNICIAN") return "Unidad de campo";
  return "Ciudadanía";
}

function formatToday() {
  return new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "long" }).format(new Date());
}

function DashboardSkeleton() {
  return (
    <div className="mt-8 space-y-5" role="status" aria-label="Cargando panel">
      <span className="sr-only">Cargando panel…</span>
      <div className="h-[28rem] animate-pulse rounded-2xl bg-[var(--surface)]" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-40 animate-pulse rounded-2xl bg-[var(--surface)]" />)}
      </div>
    </div>
  );
}
