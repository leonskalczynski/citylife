import { BriefcaseBusiness, ClipboardList, LayoutDashboard, LogOut, Plus, Wrench } from "lucide-react";
import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router";

import { Button } from "@/components/ui/button";
import { Brand } from "@/components/Brand";
import { useAuth } from "@/features/auth/components/AuthProvider";

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <main className="min-h-screen bg-[var(--canvas)] text-[var(--ink)]">
      <header className="sticky top-0 z-20 bg-[color-mix(in_srgb,var(--canvas)_90%,transparent)] backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-6">
          <Brand to="/app" />
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
              <Button asChild variant="ghost">
                <Link to="/operations/incidents"><BriefcaseBusiness className="mr-2 size-4" />Incidencias</Link>
              </Button>
            )}
            {user?.role === "TECHNICIAN" && (
              <Button asChild variant="ghost">
                <Link to="/work"><Wrench className="mr-2 size-4" />Mis trabajos</Link>
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Cerrar sesión">
              <LogOut className="size-4" />
            </Button>
          </nav>
        </div>
      </header>
      {children}
    </main>
  );
}
