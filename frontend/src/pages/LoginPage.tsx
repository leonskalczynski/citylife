import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, Navigate, useLocation, useNavigate } from "react-router";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/features/auth/api/authApi";
import { AuthLayout } from "@/features/auth/components/AuthLayout";
import { useAuth } from "@/features/auth/components/AuthProvider";
import { loginSchema } from "@/features/auth/lib/schemas";
import { ApiClientError } from "@/lib/api";

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { token, startSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const form = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });
  const [showPassword, setShowPassword] = useState(false);
  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (response) => {
      startSession(response);
      const destination = (location.state as { from?: string } | null)?.from ?? "/app";
      navigate(destination, { replace: true });
    },
  });

  if (token) return <Navigate to="/app" replace />;

  const errorMessage = mutation.error instanceof ApiClientError
    ? mutation.error.body.message
    : mutation.error ? "No se ha podido iniciar sesión" : null;

  return (
    <AuthLayout>
      <Card>
        <CardHeader>
          <h1 className="text-3xl font-semibold tracking-tight">Inicia sesión</h1>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={form.handleSubmit((data) => mutation.mutate(data))} noValidate>
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input id="email" type="email" autoComplete="email" required aria-invalid={Boolean(form.formState.errors.email)} aria-describedby={form.formState.errors.email ? "email-error" : undefined} {...form.register("email")} />
              {form.formState.errors.email && <p id="email-error" className="text-sm text-[var(--danger)]">{form.formState.errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative"><Input id="password" className="pr-12" type={showPassword ? "text" : "password"} autoComplete="current-password" required aria-invalid={Boolean(form.formState.errors.password)} aria-describedby={form.formState.errors.password ? "password-error" : undefined} {...form.register("password")} /><button type="button" className="absolute right-1.5 top-1.5 grid size-8 place-items-center rounded-[6px] text-[var(--muted)] hover:bg-[var(--surface-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]" aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></div>
              {form.formState.errors.password && <p id="password-error" className="text-sm text-[var(--danger)]">{form.formState.errors.password.message}</p>}
            </div>
            {errorMessage && <p role="alert" className="rounded-xl bg-[var(--danger-soft)] px-4 py-3 text-sm font-medium text-[var(--danger)]">{errorMessage}</p>}
            <Button className="w-full" size="lg" type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Accediendo…" : "Acceder"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-[var(--muted)]">
            ¿Aún no tienes cuenta? <Link className="font-semibold text-[var(--accent-ink)] hover:underline" to="/register">Regístrate</Link>
          </p>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}

