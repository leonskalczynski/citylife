import type { ReactNode } from "react";
import { Brand } from "@/components/Brand";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[var(--canvas)] px-5 py-10 sm:px-8">
      <div className="w-full max-w-md">
        <Brand className="mb-8" />
        {children}
      </div>
    </main>
  );
}
