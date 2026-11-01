import { Link } from "react-router";

import { cn } from "@/lib/utils";

export function Brand({ to = "/", inverse = false, className }: { to?: string; inverse?: boolean; className?: string }) {
  return (
    <Link className={cn("flex items-center gap-3 font-bold tracking-tight", inverse ? "text-white" : "text-slate-950", className)} to={to}>
      <span className={cn("grid size-9 place-items-center rounded-md border", inverse ? "border-white/20 bg-white/5" : "border-slate-200 bg-white")}>
        <img className="size-5" src="/tree_icon.svg" alt="" aria-hidden="true" />
      </span>
      <span className="text-xl">Citylife</span>
    </Link>
  );
}
