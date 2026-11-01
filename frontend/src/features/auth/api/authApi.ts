import { requestJson } from "@/lib/api";
import type { AuthResponse, CurrentUser, LoginInput, RegisterInput } from "@/features/auth/types";

export function login(input: LoginInput) {
  return requestJson<AuthResponse>("/api/auth/login", { method: "POST", body: input });
}

export function register(input: RegisterInput) {
  return requestJson<AuthResponse>("/api/auth/register", { method: "POST", body: input });
}

export function getCurrentUser(token: string, signal?: AbortSignal) {
  return requestJson<CurrentUser>("/api/users/me", { token, signal });
}

