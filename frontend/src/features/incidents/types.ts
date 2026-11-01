export type IncidentStatus = "REPORTED" | "VALIDATED" | "REJECTED" | "ASSIGNED" | "IN_PROGRESS" | "RESOLVED" | "REOPENED" | "CLOSED";
export type Priority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export type Category = {
  id: string;
  code: string;
  name: string;
};

export type Incident = {
  id: string;
  title: string;
  description: string;
  category: Category;
  status: IncidentStatus;
  priority: Priority;
  latitude?: number;
  longitude?: number;
  address?: string;
  district?: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateIncidentInput = {
  title: string;
  description: string;
  categoryId: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  district?: string;
};
