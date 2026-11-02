import type { TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn("min-h-32 w-full rounded-[7px] border border-[var(--control-line)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--ink)] shadow-[0_1px_2px_oklch(0.218_0.012_275_/_0.04)] outline-none transition duration-150 placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:ring-[3px] focus:ring-[color-mix(in_srgb,var(--accent)_50%,transparent)] aria-[invalid=true]:border-[var(--danger)]", className)}
      {...props}
    />
  );
}
