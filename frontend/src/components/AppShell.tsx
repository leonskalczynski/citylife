import { BriefcaseBusiness, ChevronDown, ClipboardList, LayoutDashboard, LogOut, Plus, Wrench } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { NavLink, useNavigate } from "react-router";

import { Button } from "@/components/ui/button";
import { Brand } from "@/components/Brand";
import { useAuth } from "@/features/auth/components/AuthProvider";
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
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--ink)]">
      <a
        href="#main-content"
        className="fixed left-4 top-3 z-50 -translate-y-20 rounded-[7px] bg-[var(--ink)] px-4 py-2 font-semibold text-[var(--surface)] shadow-[var(--shadow-panel)] transition-transform focus:translate-y-0"
      >
        Saltar al contenido
      </a>
      <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[var(--surface)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:gap-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Brand to="/app" className="shrink-0 [&>span:last-child]:hidden min-[430px]:[&>span:last-child]:inline" />
            {user && (
              <span className="hidden items-center gap-2 rounded-[7px] bg-[var(--surface-soft)] px-2.5 py-1.5 text-xs font-medium text-[var(--muted)] md:inline-flex">
                <span className="size-1.5 rounded-full bg-[var(--accent)]" aria-hidden="true" />
                {workspaceLabels[user.role] ?? roleLabels[user.role]}
              </span>
            )}
          </div>
          <nav className="flex shrink-0 items-center gap-1" aria-label="Navegación principal">
            <Button asChild variant="ghost" size="icon" className="sm:w-auto sm:px-4">
              <NavLink to="/app" end aria-label="Panel"><LayoutDashboard className="size-4 sm:mr-2" /><span className="hidden sm:inline">Panel</span></NavLink>
            </Button>
            {user?.role === "CITIZEN" && (
              <>
                <Button asChild variant="ghost" size="icon" className="sm:w-auto sm:px-4">
                  <NavLink to="/my-incidents" aria-label="Mis incidencias"><ClipboardList className="size-4 sm:mr-2" /><span className="hidden sm:inline">Mis incidencias</span></NavLink>
                </Button>
                <Button asChild size="icon" className="min-[520px]:w-auto min-[520px]:px-4">
                  <NavLink to="/incidents/new" aria-label="Reportar incidencia"><Plus className="size-4 min-[520px]:mr-2" /><span className="hidden min-[520px]:inline">Reportar</span></NavLink>
                </Button>
              </>
            )}
            {user?.role === "OPERATOR" && (
              <Button asChild className="px-3 sm:px-4">
                <NavLink to="/operations/incidents"><BriefcaseBusiness className="mr-2 size-4" />Incidencias</NavLink>
              </Button>
            )}
            {user?.role === "TECHNICIAN" && (
              <Button asChild className="px-3 sm:px-4">
                <NavLink to="/work"><Wrench className="mr-2 size-4" />Mis trabajos</NavLink>
              </Button>
            )}
            {user && <UserMenu user={user} />}
          </nav>
        </div>
      </header>
      <main id="main-content" tabIndex={-1}>{children}</main>
    </div>
  );
}

function UserMenu({ user }: { user: CurrentUser }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const logoutRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeWithKeyboard = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", closeWithKeyboard);
    requestAnimationFrame(() => logoutRef.current?.focus());
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", closeWithKeyboard);
    };
  }, [open]);

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <div className="relative" ref={containerRef} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false); }}>
      <button
        ref={triggerRef}
        type="button"
        className="flex items-center gap-2 rounded-[7px] p-1 text-left transition-colors hover:bg-[var(--surface-soft)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[color-mix(in_srgb,var(--accent)_50%,transparent)]"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Abrir menú de usuario"
        onClick={() => setOpen((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setOpen(true);
          }
        }}
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
            ref={logoutRef}
            type="button"
            className="flex w-full items-center gap-2 rounded-[4px] px-3 py-2 text-left text-sm font-medium text-[var(--ink)] transition-colors hover:bg-[var(--surface-soft)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[color-mix(in_srgb,var(--accent)_50%,transparent)]"
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
