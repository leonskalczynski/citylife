import { getJson } from "@/lib/api";

export type SystemStatus = {
  application: string;
  status: "UP";
};

export function getSystemStatus(signal?: AbortSignal) {
  return getJson<SystemStatus>("/api/system/status", signal);
}

