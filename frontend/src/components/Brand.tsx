import { Link } from "react-router";

import { cn } from "@/lib/utils";

export function Brand({ to = "/", inverse = false, className }: { to?: string; inverse?: boolean; className?: string }) {
  return (
    <Link className={cn("flex items-center gap-2.5 font-bold tracking-tight", inverse ? "text-[var(--surface)]" : "text-[var(--ink)]", className)} to={to}>
      <span className="grid size-9 place-items-center rounded-xl bg-[var(--accent)]">
        <img className="size-5 brightness-0" src="/tree_icon.svg" alt="" aria-hidden="true" />
      </span>
      <span className="text-xl">Citylife</span>
    </Link>
  );
}
