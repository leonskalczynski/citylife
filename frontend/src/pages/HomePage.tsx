import { ArrowRight, Building2, MapPinned, Wrench } from "lucide-react";
import { Link } from "react-router";

import { Button } from "@/components/ui/button";
import { Brand } from "@/components/Brand";

const capabilities = [
  { icon: MapPinned, title: "Reporta", description: "Envía un aviso y consulta su progreso." },
  { icon: Building2, title: "Coordina", description: "Prioriza y asigna la respuesta municipal." },
  { icon: Wrench, title: "Resuelve", description: "Documenta el trabajo realizado en campo." },
];

export function HomePage() {
  return (
    <main className="min-h-screen bg-[var(--canvas)] text-[var(--ink)]">
      <header className="border-b border-[var(--line)] bg-[var(--surface)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-3 sm:px-6">
        <Brand />
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 pb-12 pt-16 sm:px-6 sm:pb-16 sm:pt-20">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Gestión urbana colaborativa</p>
        <h1 className="mt-4 max-w-3xl text-[clamp(2rem,5vw,3.75rem)] font-semibold leading-[1.06] tracking-[-0.035em]">
          Una ciudad mejor empieza por <span className="text-[var(--accent)]">escuchar</span>.
        </h1>
        <p className="mt-5 max-w-2xl text-sm leading-6 text-[var(--muted)]">Reporta incidencias, coordina la respuesta municipal y sigue cada resolución desde un único espacio de trabajo.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button size="lg" asChild>
            <Link to="/login">
              Acceder a Citylife <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
          <Button size="lg" asChild variant="outline"><Link to="/register">Crear cuenta</Link></Button>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-3 px-5 pb-20 sm:px-6 md:grid-cols-3">
        {capabilities.map(({ icon: Icon, title, description }) => (
          <article key={title} className="flex items-center gap-4 rounded-[14px] border border-[var(--line)] bg-[var(--surface)] px-6 py-5">
            <span className="grid size-10 shrink-0 place-items-center rounded-[7px] bg-[var(--accent-soft)] text-[var(--accent-ink)]">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <div><h2 className="text-base font-semibold">{title}</h2><p className="mt-1 text-sm text-[var(--muted)]">{description}</p></div>
          </article>
        ))}
      </section>
    </main>
  );
}
