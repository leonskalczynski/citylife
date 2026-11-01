import { ArrowRight, Building2, MapPinned, Wrench } from "lucide-react";
import { Link } from "react-router";

import { Button } from "@/components/ui/button";
import { Brand } from "@/components/Brand";
import { ApiStatus } from "@/features/system/components/ApiStatus";

const capabilities = [
  { icon: MapPinned, title: "Reporta" },
  { icon: Building2, title: "Coordina" },
  { icon: Wrench, title: "Resuelve" },
];

export function HomePage() {
  return (
    <main className="min-h-screen bg-[var(--canvas)] text-[var(--ink)]">
      <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-6 sm:px-6">
        <Brand />
        <div className="text-sm"><ApiStatus /></div>
      </header>

      <section className="mx-auto max-w-6xl px-5 pb-16 pt-14 sm:px-6 sm:pb-24 sm:pt-24">
        <h1 className="max-w-4xl text-[clamp(2.75rem,7vw,6rem)] font-semibold leading-[0.98] tracking-[-0.05em]">
          Una ciudad mejor empieza por <span className="text-[var(--accent-ink)]">escuchar</span>.
        </h1>
        <div className="mt-10">
          <Button size="lg" asChild>
            <Link to="/login">
              Acceder a Citylife <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-3 px-5 pb-20 sm:px-6 md:grid-cols-3">
        {capabilities.map(({ icon: Icon, title }) => (
          <article key={title} className="flex items-center gap-4 rounded-2xl bg-[var(--surface)] px-6 py-5">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[var(--accent-soft-strong)] text-[var(--accent-ink)]">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <h2 className="text-lg font-semibold">{title}</h2>
          </article>
        ))}
      </section>
    </main>
  );
}
