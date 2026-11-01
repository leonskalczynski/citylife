import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { getCurrentUser } from "@/features/auth/api/authApi";
import { clearStoredToken, getStoredToken, storeToken } from "@/features/auth/lib/session";
import type { AuthResponse, CurrentUser } from "@/features/auth/types";
import { ApiClientError } from "@/lib/api";

type AuthContextValue = {
  token: string | null;
  user: CurrentUser | null;
  isLoading: boolean;
  startSession: (response: AuthResponse) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [sessionUser, setSessionUser] = useState<CurrentUser | null>(null);
  const queryClient = useQueryClient();
  const currentUserQuery = useQuery({
    queryKey: ["current-user", token],
    queryFn: ({ signal }) => getCurrentUser(token!, signal),
    enabled: Boolean(token),
  });

  const logout = () => {
    clearStoredToken();
    setToken(null);
    setSessionUser(null);
    queryClient.removeQueries({ queryKey: ["current-user"] });
  };

  useEffect(() => {
    if (currentUserQuery.error instanceof ApiClientError && currentUserQuery.error.body.status === 401) {
      logout();
    }
  }, [currentUserQuery.error]);

  const value = useMemo<AuthContextValue>(() => ({
    token,
    user: currentUserQuery.data ?? sessionUser,
    isLoading: Boolean(token) && currentUserQuery.isLoading && !sessionUser,
    startSession: (response) => {
      storeToken(response.accessToken);
      setToken(response.accessToken);
      setSessionUser(response.user);
      queryClient.setQueryData(["current-user", response.accessToken], response.user);
    },
    logout,
  }), [currentUserQuery.data, currentUserQuery.isLoading, queryClient, sessionUser, token]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}

