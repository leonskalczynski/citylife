import type { TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn("min-h-32 w-full rounded-xl border-2 border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--ink)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:ring-[3px] focus:ring-[color-mix(in_srgb,var(--accent)_25%,transparent)]", className)}
      {...props}
    />
  );
}
