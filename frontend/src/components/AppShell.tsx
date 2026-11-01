import { ClipboardList, LogOut, Plus } from "lucide-react";
import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/components/AuthProvider";

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <main className="min-h-screen bg-[#f5f7f2] text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-6">
          <Link className="flex items-center gap-3 font-bold" to="/app">
            <span className="grid size-10 place-items-center rounded-xl bg-teal-700 text-white">C</span>
            <span className="text-xl">Citylife</span>
          </Link>
          <div className="flex items-center gap-2">
            {user?.role === "CITIZEN" && (
              <>
                <Button asChild variant="outline" className="hidden sm:inline-flex">
                  <Link to="/my-incidents"><ClipboardList className="mr-2 size-4" />Mis incidencias</Link>
                </Button>
                <Button asChild>
                  <Link to="/incidents/new"><Plus className="mr-2 size-4" />Reportar</Link>
                </Button>
              </>
            )}
            <Button variant="outline" onClick={handleLogout} aria-label="Cerrar sesión">
              <LogOut className="size-4 sm:mr-2" /><span className="hidden sm:inline">Salir</span>
            </Button>
          </div>
        </div>
      </header>
      {children}
    </main>
  );
}
