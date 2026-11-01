import type { Role } from "@/features/auth/types";

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

export type Dashboard = {
  scope: Role;
  totalIncidents: number;
  byStatus: DashboardBreakdown[];
  byCategory: DashboardCategoryBreakdown[];
  byPriority: DashboardBreakdown[];
  resolution: DashboardResolution;
  indicators: DashboardIndicators;
};
