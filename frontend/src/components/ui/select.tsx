import type { SelectHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn("h-11 w-full rounded-xl border-2 border-[var(--line)] bg-[var(--surface)] px-3 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--accent)] focus:ring-[3px] focus:ring-[color-mix(in_srgb,var(--accent)_25%,transparent)]", className)}
      {...props}
    />
  );
}
