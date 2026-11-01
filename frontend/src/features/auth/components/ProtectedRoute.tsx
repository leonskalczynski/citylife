import { Navigate, Outlet, useLocation } from "react-router";

import { useAuth } from "@/features/auth/components/AuthProvider";

export function ProtectedRoute() {
  const { token, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="grid min-h-screen place-items-center bg-[#f5f7f2] text-slate-600">Cargando sesión…</div>;
  }

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

