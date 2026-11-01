import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn("inline-flex items-center rounded-md border border-[color-mix(in_srgb,var(--accent)_32%,#d1d5db)] bg-[color-mix(in_srgb,var(--accent)_10%,white)] px-2 py-0.5 text-xs font-semibold text-[var(--accent-ink)]", className)}
      {...props}
    />
  );
}
