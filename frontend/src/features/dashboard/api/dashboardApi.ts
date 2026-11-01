import type { Dashboard } from "@/features/dashboard/types";
import { requestJson } from "@/lib/api";

export function getDashboard(token: string, signal?: AbortSignal) {
  return requestJson<Dashboard>("/api/dashboard", { token, signal });
}
