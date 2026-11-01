import { Badge } from "@/components/ui/badge";
import type { IncidentStatus } from "@/features/incidents/types";
import { cn } from "@/lib/utils";

const labels: Record<IncidentStatus, string> = {
  REPORTED: "Reportada",
  VALIDATED: "Validada",
  REJECTED: "Rechazada",
  ASSIGNED: "Asignada",
  IN_PROGRESS: "En curso",
  RESOLVED: "Resuelta",
  REOPENED: "Reabierta",
  CLOSED: "Cerrada",
};

export function IncidentStatusBadge({ status }: { status: IncidentStatus }) {
  return (
    <Badge
      className={cn(
        status === "RESOLVED" || status === "CLOSED"
          ? "bg-[var(--success-soft)] text-[var(--success)]"
          : status === "REJECTED"
            ? "bg-[var(--surface-soft)] text-[var(--muted)]"
            : "bg-[var(--accent-soft-strong)] text-[var(--accent-ink)]",
      )}
    >
      {labels[status]}
    </Badge>
  );
}
