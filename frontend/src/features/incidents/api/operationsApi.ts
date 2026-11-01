import type { Department, Incident, OperationFilters, PageResponse, Priority, UserSummary } from "@/features/incidents/types";
import { requestJson } from "@/lib/api";

export function getOperationIncidents(token: string, filters: OperationFilters, signal?: AbortSignal) {
  const params = new URLSearchParams({ page: String(filters.page), size: String(filters.size) });
  Object.entries(filters).forEach(([key, value]) => {
    if (key !== "page" && key !== "size" && value) params.set(key, String(value));
  });
  return requestJson<PageResponse<Incident>>(`/api/operations/incidents?${params}`, { token, signal });
}

export function getOperationIncident(token: string, incidentId: string, signal?: AbortSignal) {
  return requestJson<Incident>(`/api/operations/incidents/${incidentId}`, { token, signal });
}

export function validateIncident(token: string, incidentId: string) {
  return requestJson<Incident>(`/api/operations/incidents/${incidentId}/validate`, { method: "POST", token });
}

export function rejectIncident(token: string, incidentId: string, reason: string) {
  return requestJson<Incident>(`/api/operations/incidents/${incidentId}/reject`, { method: "POST", token, body: { reason } });
}

export function changeIncidentPriority(token: string, incidentId: string, priority: Priority) {
  return requestJson<Incident>(`/api/operations/incidents/${incidentId}/priority`, { method: "POST", token, body: { priority } });
}

export function assignIncident(token: string, incidentId: string, departmentId: string, technicianId?: string) {
  return requestJson<Incident>(`/api/operations/incidents/${incidentId}/assign`, {
    method: "POST",
    token,
    body: { departmentId, technicianId: technicianId || null },
  });
}

export function getDepartments(token: string, signal?: AbortSignal) {
  return requestJson<Department[]>("/api/departments", { token, signal });
}

export function getTechnicians(token: string, signal?: AbortSignal) {
  return requestJson<UserSummary[]>("/api/technicians", { token, signal });
}
