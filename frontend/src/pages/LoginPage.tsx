import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
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
          <p className="text-sm font-semibold text-teal-700">Bienvenido de nuevo</p>
          <h1 className="text-3xl font-semibold tracking-tight">Inicia sesión</h1>
          <p className="text-sm leading-6 text-slate-600">Usa tu cuenta de Citylife para continuar.</p>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={form.handleSubmit((data) => mutation.mutate(data))} noValidate>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
              {form.formState.errors.email && <p className="text-sm text-red-700">{form.formState.errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" autoComplete="current-password" {...form.register("password")} />
              {form.formState.errors.password && <p className="text-sm text-red-700">{form.formState.errors.password.message}</p>}
            </div>
            {errorMessage && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{errorMessage}</p>}
            <Button className="w-full" size="lg" type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Accediendo…" : "Acceder"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-600">
            ¿Aún no tienes cuenta? <Link className="font-semibold text-teal-700 hover:underline" to="/register">Regístrate</Link>
          </p>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}

