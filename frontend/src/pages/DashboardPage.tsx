import { BriefcaseBusiness, ClipboardList, Plus, ShieldCheck, UserRound } from "lucide-react";
import { Link } from "react-router";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAuth } from "@/features/auth/components/AuthProvider";
import type { Role } from "@/features/auth/types";

const roleLabels: Record<Role, string> = {
  CITIZEN: "Ciudadanía",
  OPERATOR: "Operación",
  TECHNICIAN: "Equipo técnico",
  ADMIN: "Administración",
  ANALYST: "Análisis",
};

export function DashboardPage() {
  const { user } = useAuth();

  return (
    <AppShell>
      <section className="mx-auto max-w-6xl px-6 py-14">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">Área personal</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Hola, {user?.displayName}</h1>
        <p className="mt-3 text-slate-600">Gestiona tu actividad en Citylife desde un único lugar.</p>

        {user?.role === "CITIZEN" && (
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg"><Link to="/incidents/new"><Plus className="mr-2 size-4" />Reportar incidencia</Link></Button>
            <Button asChild size="lg" variant="outline"><Link to="/my-incidents"><ClipboardList className="mr-2 size-4" />Ver mis incidencias</Link></Button>
          </div>
        )}

        {user?.role === "OPERATOR" && (
          <div className="mt-8">
            <Button asChild size="lg"><Link to="/operations/incidents"><BriefcaseBusiness className="mr-2 size-4" />Abrir bandeja de operación</Link></Button>
          </div>
        )}

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <Card>
            <CardHeader className="flex-row items-center gap-3 space-y-0">
              <UserRound className="size-5 text-slate-500" />
              <h2 className="text-lg font-semibold">Tu cuenta</h2>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div><span className="text-slate-500">Email</span><p className="font-medium">{user?.email}</p></div>
              <div><span className="text-slate-500">Perfil</span><p className="font-medium">{user ? roleLabels[user.role] : "—"}</p></div>
            </CardContent>
          </Card>
          <Card className="bg-slate-950 text-white">
            <CardHeader className="flex-row items-center gap-3 space-y-0">
              <ShieldCheck className="size-5 text-[var(--accent)]" />
              <h2 className="text-lg font-semibold">Acceso protegido</h2>
            </CardHeader>
            <CardContent className="text-sm leading-6 text-slate-300">
              La API ha verificado tu token y ha recuperado tu identidad desde el backend.
            </CardContent>
          </Card>
        </div>
      </section>
    </AppShell>
  );
}

