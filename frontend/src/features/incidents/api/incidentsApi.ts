import type { Attachment, Category, CreateIncidentInput, Incident, IncidentStatusChange } from "@/features/incidents/types";
import { requestJson, uploadFile } from "@/lib/api";

export function getCategories(token: string, signal?: AbortSignal) {
  return requestJson<Category[]>("/api/categories", { token, signal });
}

export function getMyIncidents(token: string, signal?: AbortSignal) {
  return requestJson<Incident[]>("/api/incidents/my", { token, signal });
}

export function getIncident(token: string, incidentId: string, signal?: AbortSignal) {
  return requestJson<Incident>(`/api/incidents/${incidentId}`, { token, signal });
}

export function getIncidentHistory(token: string, incidentId: string, signal?: AbortSignal) {
  return requestJson<IncidentStatusChange[]>(`/api/incidents/${incidentId}/history`, { token, signal });
}

export function createIncident(token: string, input: CreateIncidentInput) {
  return requestJson<Incident>("/api/incidents", { method: "POST", token, body: input });
}

export function getIncidentAttachments(token: string, incidentId: string, signal?: AbortSignal) {
  return requestJson<Attachment[]>(`/api/incidents/${incidentId}/attachments`, { token, signal });
}

export function uploadIncidentAttachment(token: string, incidentId: string, file: File) {
  return uploadFile<Attachment>(`/api/incidents/${incidentId}/attachments`, file, token);
}
