export type IncidentStatus = "REPORTED" | "VALIDATED" | "REJECTED" | "ASSIGNED" | "IN_PROGRESS" | "RESOLVED" | "REOPENED" | "CLOSED";
export type Priority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export type Category = {
  id: string;
  code: string;
  name: string;
};

export type Department = {
  id: string;
  code: string;
  name: string;
};

export type UserSummary = {
  id: string;
  displayName: string;
  email: string;
  role: string;
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
  createdBy: UserSummary;
  department?: Department;
  assignedTo?: UserSummary;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
};

export type PageResponse<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export type OperationFilters = {
  search?: string;
  status?: IncidentStatus;
  priority?: Priority;
  categoryId?: string;
  departmentId?: string;
  district?: string;
  page: number;
  size: number;
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
