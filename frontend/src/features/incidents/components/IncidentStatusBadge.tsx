import { Badge } from "@/components/ui/badge";
import type { IncidentStatus } from "@/features/incidents/types";

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
  return <Badge>{labels[status]}</Badge>;
}
