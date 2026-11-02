import { useQuery } from "@tanstack/react-query";
import { Bell, BriefcaseBusiness, ChevronDown, ClipboardList, LayoutDashboard, LogOut, Plus, Wrench } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router";

import { Button } from "@/components/ui/button";
import { Brand } from "@/components/Brand";
import { useAuth } from "@/features/auth/components/AuthProvider";
import { getDashboard } from "@/features/dashboard/api/dashboardApi";
import type { CurrentUser } from "@/features/auth/types";

const roleLabels: Record<string, string> = {
  CITIZEN: "Ciudadanía",
  OPERATOR: "Operaciones",
  TECHNICIAN: "Equipo técnico",
  ADMIN: "Administración",
  ANALYST: "Análisis",
};

const workspaceLabels: Record<string, string> = {
  CITIZEN: "Ciudadanía",
  OPERATOR: "Centro de control",
  TECHNICIAN: "Unidad de campo",
};

export function AppShell({ children }: { children: ReactNode }) {
  const { user, token } = useAuth();
  const dashboardQuery = useQuery({
    queryKey: ["dashboard", user?.id],
    queryFn: ({ signal }) => getDashboard(token!, signal),
    enabled: Boolean(token && user && workspaceLabels[user.role]),
  });
  const attention = user?.role === "TECHNICIAN"
    ? dashboardQuery.data?.indicators?.awaitingStart ?? 0
    : dashboardQuery.data?.indicators?.awaitingValidation ?? 0;
  const notificationHref = user?.role === "OPERATOR"
    ? "/operations/incidents?status=REPORTED"
    : user?.role === "TECHNICIAN"
      ? "/work"
      : "/my-incidents";

  return (
    <main className="min-h-screen bg-[var(--canvas)] text-[var(--ink)]">
      <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[var(--surface)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-3 sm:px-6">
          <div className="flex items-center gap-4">
            <Brand to="/app" />
            {user && (
              <span className="hidden items-center gap-2 rounded-[7px] bg-[var(--surface-soft)] px-2.5 py-1.5 text-xs font-medium text-[var(--muted)] md:inline-flex">
                <span className="size-1.5 rounded-full bg-[var(--accent)]" aria-hidden="true" />
                {workspaceLabels[user.role] ?? roleLabels[user.role]}
              </span>
            )}
          </div>
          <nav className="flex items-center gap-1" aria-label="Navegación principal">
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link to="/app"><LayoutDashboard className="mr-2 size-4" />Panel</Link>
            </Button>
            {user?.role === "CITIZEN" && (
              <>
                <Button asChild variant="ghost" className="hidden sm:inline-flex">
                  <Link to="/my-incidents"><ClipboardList className="mr-2 size-4" />Mis incidencias</Link>
                </Button>
                <Button asChild>
                  <Link to="/incidents/new"><Plus className="mr-2 size-4" />Reportar</Link>
                </Button>
              </>
            )}
            {user?.role === "OPERATOR" && (
              <Button asChild>
                <Link to="/operations/incidents"><BriefcaseBusiness className="mr-2 size-4" />Incidencias</Link>
              </Button>
            )}
            {user?.role === "TECHNICIAN" && (
              <Button asChild>
                <Link to="/work"><Wrench className="mr-2 size-4" />Mis trabajos</Link>
              </Button>
            )}
            {user && (
              <Link
                to={notificationHref}
                className="relative grid size-9 place-items-center rounded-[7px] text-[var(--ink)] transition-colors hover:bg-[var(--surface-soft)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[color-mix(in_srgb,var(--accent)_50%,transparent)]"
                aria-label={attention > 0 ? `${attention} avisos pendientes` : "Notificaciones"}
                title={attention > 0 ? `${attention} avisos pendientes` : "Sin avisos pendientes"}
              >
                <Bell className="size-4" />
                {attention > 0 && <span className="absolute right-2 top-2 size-2 rounded-full bg-[var(--accent)] ring-2 ring-[var(--canvas)]" aria-hidden="true" />}
              </Link>
            )}
            {user && <UserMenu user={user} />}
          </nav>
        </div>
      </header>
      {children}
    </main>
  );
}

function UserMenu({ user }: { user: CurrentUser }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        className="flex items-center gap-2 rounded-[7px] p-1 text-left transition-colors hover:bg-[var(--surface-soft)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[color-mix(in_srgb,var(--accent)_50%,transparent)]"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Abrir menú de usuario"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="grid size-9 place-items-center rounded-full bg-[var(--accent-soft)] text-[11px] font-semibold tracking-wide text-[var(--accent-ink)] ring-2 ring-[var(--accent)]">{initials(user.displayName)}</span>
        <span className="hidden lg:block">
          <span className="block max-w-32 truncate text-sm font-semibold leading-5">{user.displayName}</span>
          <span className="block text-[11px] leading-4 text-[var(--muted)]">{roleLabels[user.role] ?? user.role}</span>
        </span>
        <ChevronDown className="hidden size-3.5 text-[var(--muted)] lg:block" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 w-64 rounded-[7px] border border-[var(--line)] bg-[var(--surface-raised)] p-1 shadow-[var(--shadow-panel)]" role="menu">
          <div className="px-3 py-2">
            <p className="truncate text-sm font-semibold">{user.displayName}</p>
            <p className="mt-0.5 truncate text-xs text-[var(--muted)]">{user.email}</p>
          </div>
          <div className="my-1 h-px bg-[var(--line)]" />
          <div className="px-3 py-2 text-xs font-medium text-[var(--muted)]">{roleLabels[user.role] ?? user.role}</div>
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-[4px] px-3 py-2 text-left text-sm font-medium text-[var(--ink)] transition-colors hover:bg-[var(--surface-soft)]"
            onClick={handleLogout}
            role="menuitem"
          >
            <LogOut className="size-4" />Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}
