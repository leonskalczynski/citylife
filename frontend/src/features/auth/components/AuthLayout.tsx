import type { ReactNode } from "react";
import { Brand } from "@/components/Brand";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="grid min-h-screen bg-[var(--canvas)] lg:grid-cols-[0.85fr_1.15fr]">
      <section className="hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <Brand inverse />
        <div className="max-w-lg">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-slate-400">Una ciudad conectada</p>
          <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight">
            Cada incidencia cuenta. Cada solución también.
          </h1>
          <p className="mt-5 leading-7 text-slate-300">
            Accede al espacio común de ciudadanía, operación y equipos técnicos.
          </p>
        </div>
        <p className="text-sm text-slate-500">Citylife · Gestión urbana auditable</p>
      </section>
      <section className="flex items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <Brand className="mb-8 lg:hidden" />
          {children}
        </div>
      </section>
    </main>
  );
}

