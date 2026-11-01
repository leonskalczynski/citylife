import { useEffect, useState } from "react";

import { getSystemStatus, type SystemStatus } from "@/features/system/api/getSystemStatus";

type RequestState =
  | { kind: "loading" }
  | { kind: "success"; data: SystemStatus }
  | { kind: "error" };

export function ApiStatus() {
  const [state, setState] = useState<RequestState>({ kind: "loading" });

  useEffect(() => {
    const controller = new AbortController();

    getSystemStatus(controller.signal)
      .then((data) => setState({ kind: "success", data }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setState({ kind: "error" });
      });

    return () => controller.abort();
  }, []);

  if (state.kind === "loading") {
    return <span className="text-[var(--muted)]">Comprobando la API…</span>;
  }

  if (state.kind === "error") {
    return <span className="text-[var(--danger)]">API no disponible</span>;
  }

  return (
    <span className="inline-flex items-center gap-2 font-medium text-[var(--accent-ink)]">
      <span className="size-2 rounded-full bg-[var(--accent)]" aria-hidden="true" />
      {state.data.application} API conectada
    </span>
  );
}

