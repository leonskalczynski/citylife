import type { Role } from "@/features/auth/types";
import type { IncidentStatus, Priority } from "@/features/incidents/types";

export type DashboardBreakdown = {
  key: string;
  count: number;
};

export type DashboardCategoryBreakdown = {
  id: string;
  name: string;
  count: number;
};

export type DashboardResolution = {
  sampleSize: number;
  minimumSamples: number;
  averageSeconds: number | null;
};

export type DashboardIndicators = {
  awaitingValidation: number;
  awaitingAssignment: number;
  awaitingStart: number;
  inProgress: number;
  activeWork: number;
  urgentOpen: number;
  resolved: number;
  rejected: number;
  assignedWithoutTechnician: number;
};

export type DashboardActivityDay = {
  date: string;
  created: number;
  resolved: number;
};

export type DashboardEvent = {
  incidentId: string;
  title: string;
  status: IncidentStatus;
  priority: Priority;
  categoryName: string;
  district: string;
  actorName: string;
  changedAt: string;
};

export type DashboardDistrict = {
  district: string;
  count: number;
};

export type DashboardMapPoint = {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  status: IncidentStatus;
  priority: Priority;
  categoryName: string;
};

export type DashboardPulse = {
  activeIncidents: number;
  createdToday: number;
  resolvedToday: number;
  createdLast7Days: number;
  resolvedLast7Days: number;
  createdPrevious7Days: number;
  resolvedPrevious7Days: number;
  activity: DashboardActivityDay[];
  recentEvents: DashboardEvent[];
  byDistrict: DashboardDistrict[];
  mapPoints: DashboardMapPoint[];
};

export type Dashboard = {
  scope: Role;
  totalIncidents: number;
  byStatus: DashboardBreakdown[];
  byCategory: DashboardCategoryBreakdown[];
  byPriority: DashboardBreakdown[];
  resolution: DashboardResolution;
  indicators: DashboardIndicators;
  pulse: DashboardPulse;
};
