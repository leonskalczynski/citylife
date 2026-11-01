import type { Incident } from "@/features/incidents/types";
import { requestJson } from "@/lib/api";

export function getAssignedWork(token: string, signal?: AbortSignal) {
  return requestJson<Incident[]>("/api/work/incidents", { token, signal });
}

export function getWorkIncident(token: string, incidentId: string, signal?: AbortSignal) {
  return requestJson<Incident>(`/api/work/incidents/${incidentId}`, { token, signal });
}

export function startWork(token: string, incidentId: string) {
  return requestJson<Incident>(`/api/work/incidents/${incidentId}/start`, { method: "POST", token });
}

export function updateWorkNotes(token: string, incidentId: string, notes: string) {
  return requestJson<Incident>(`/api/work/incidents/${incidentId}/notes`, { method: "PUT", token, body: { notes } });
}

export function resolveWork(token: string, incidentId: string, summary: string) {
  return requestJson<Incident>(`/api/work/incidents/${incidentId}/resolve`, { method: "POST", token, body: { summary } });
}
