import { ArrowRight, Building2, MapPinned, Wrench } from "lucide-react";
import { Link } from "react-router";

import { Button } from "@/components/ui/button";
import { Brand } from "@/components/Brand";
import { ApiStatus } from "@/features/system/components/ApiStatus";

const capabilities = [
  { icon: MapPinned, title: "Reporta", text: "Registra una incidencia con su ubicación y contexto." },
  { icon: Building2, title: "Coordina", text: "Centraliza la validación, prioridad y asignación." },
  { icon: Wrench, title: "Resuelve", text: "Acompaña el trabajo técnico hasta su resolución." },
];

export function HomePage() {
  return (
    <main className="min-h-screen bg-[var(--canvas)] text-slate-950">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Brand />
        <span className="rounded-md border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-widest text-slate-600">
          Fase 9
        </span>
      </header>

      <section className="mx-auto grid max-w-6xl gap-14 px-6 pb-20 pt-14 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:pt-24">
        <div>
          <p className="mb-5 text-sm font-bold uppercase tracking-[0.22em] text-slate-500">
            Gestión urbana conectada
          </p>
          <h1 className="max-w-3xl text-5xl font-semibold leading-[1.05] tracking-[-0.045em] sm:text-6xl">
            Una ciudad mejor empieza por escuchar lo que ocurre.
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-600">
            Citylife conecta ciudadanía, operadores y equipos técnicos para gestionar incidencias urbanas de forma clara, trazable y eficiente.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Button size="lg" asChild>
              <Link to="/login">
                Acceder a Citylife <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            <div className="text-sm"><ApiStatus /></div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-950 p-8 text-white shadow-lg shadow-slate-900/10 sm:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Flujo previsto</p>
          <ol className="mt-8 space-y-6">
            {["Incidencia reportada", "Validación y asignación", "Intervención técnica", "Resolución auditada"].map((item, index) => (
              <li key={item} className="flex items-center gap-4">
                <span className="grid size-9 shrink-0 place-items-center rounded-full border border-white/20 bg-white/10 text-sm font-bold">{index + 1}</span>
                <span className="text-lg text-slate-100">{item}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-t border-slate-200/80 bg-white/70">
        <div className="mx-auto grid max-w-6xl gap-px px-6 py-12 md:grid-cols-3">
          {capabilities.map(({ icon: Icon, title, text }) => (
            <article key={title} className="py-6 md:px-8 md:first:pl-0">
              <Icon className="size-6 text-slate-700" aria-hidden="true" />
              <h2 className="mt-5 text-lg font-semibold">{title}</h2>
              <p className="mt-2 leading-7 text-slate-600">{text}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

