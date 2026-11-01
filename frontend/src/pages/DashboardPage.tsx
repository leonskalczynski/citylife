import { LogOut, ShieldCheck, UserRound } from "lucide-react";
import { useNavigate } from "react-router";

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
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <main className="min-h-screen bg-[#f5f7f2] text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3 font-bold">
            <span className="grid size-10 place-items-center rounded-xl bg-teal-700 text-white">C</span>
            <span className="text-xl">Citylife</span>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 size-4" /> Cerrar sesión
          </Button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-14">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-teal-700">Área personal</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Hola, {user?.displayName}</h1>
        <p className="mt-3 text-slate-600">Tu sesión está activa. Las incidencias llegarán en la siguiente fase.</p>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <Card>
            <CardHeader className="flex-row items-center gap-3 space-y-0">
              <UserRound className="size-5 text-teal-700" />
              <h2 className="text-lg font-semibold">Tu cuenta</h2>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div><span className="text-slate-500">Email</span><p className="font-medium">{user?.email}</p></div>
              <div><span className="text-slate-500">Perfil</span><p className="font-medium">{user ? roleLabels[user.role] : "—"}</p></div>
            </CardContent>
          </Card>
          <Card className="bg-slate-950 text-white">
            <CardHeader className="flex-row items-center gap-3 space-y-0">
              <ShieldCheck className="size-5 text-teal-300" />
              <h2 className="text-lg font-semibold">Acceso protegido</h2>
            </CardHeader>
            <CardContent className="text-sm leading-6 text-slate-300">
              La API ha verificado tu token y ha recuperado tu identidad desde el backend.
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}

