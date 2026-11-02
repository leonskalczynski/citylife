import { Navigate, Outlet, useLocation } from "react-router";

import { useAuth } from "@/features/auth/components/AuthProvider";
import type { Role } from "@/features/auth/types";

export function ProtectedRoute({ roles }: { roles?: Role[] }) {
  const { token, user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="grid min-h-screen place-items-center bg-[var(--canvas)] text-[var(--muted)]" role="status">Cargando sesión…</div>;
  }

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/app" replace />;
  }

  return <Outlet />;
}

