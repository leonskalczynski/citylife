import { Navigate, Route, Routes } from "react-router";

import { ProtectedRoute } from "@/features/auth/components/ProtectedRoute";
import { DashboardPage } from "@/pages/DashboardPage";
import { HomePage } from "@/pages/HomePage";
import { LoginPage } from "@/pages/LoginPage";
import { IncidentDetailPage } from "@/pages/IncidentDetailPage";
import { MyIncidentsPage } from "@/pages/MyIncidentsPage";
import { NewIncidentPage } from "@/pages/NewIncidentPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { OperationIncidentDetailPage } from "@/pages/OperationIncidentDetailPage";
import { OperationsIncidentsPage } from "@/pages/OperationsIncidentsPage";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<DashboardPage />} />
      </Route>
      <Route element={<ProtectedRoute roles={["CITIZEN"]} />}>
        <Route path="/incidents/new" element={<NewIncidentPage />} />
        <Route path="/my-incidents" element={<MyIncidentsPage />} />
        <Route path="/incidents/:incidentId" element={<IncidentDetailPage />} />
      </Route>
      <Route element={<ProtectedRoute roles={["OPERATOR"]} />}>
        <Route path="/operations/incidents" element={<OperationsIncidentsPage />} />
        <Route path="/operations/incidents/:incidentId" element={<OperationIncidentDetailPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

