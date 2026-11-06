import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, Navigate, useNavigate } from "react-router";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { register as registerAccount } from "@/features/auth/api/authApi";
import { AuthLayout } from "@/features/auth/components/AuthLayout";
import { useAuth } from "@/features/auth/components/AuthProvider";
import { registerSchema } from "@/features/auth/lib/schemas";
import { ApiClientError } from "@/lib/api";

type RegisterForm = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const { token, startSession } = useAuth();
  const navigate = useNavigate();
  const form = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });
  const [showPassword, setShowPassword] = useState(false);
  const mutation = useMutation({
    mutationFn: registerAccount,
    onSuccess: (response) => {
      startSession(response);
      navigate("/app", { replace: true });
    },
  });

  if (token) return <Navigate to="/app" replace />;

  const errorMessage = mutation.error instanceof ApiClientError
    ? mutation.error.body.message
    : mutation.error ? "No se ha podido crear la cuenta" : null;

  return (
    <AuthLayout>
      <Card>
        <CardHeader>
          <h1 className="text-3xl font-semibold tracking-tight">Crea tu cuenta</h1>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={form.handleSubmit((data) => mutation.mutate(data))} noValidate>
            <div className="space-y-2">
              <Label htmlFor="displayName">Nombre</Label>
              <Input id="displayName" autoComplete="name" required aria-invalid={Boolean(form.formState.errors.displayName)} aria-describedby={form.formState.errors.displayName ? "displayName-error" : undefined} {...form.register("displayName")} />
              {form.formState.errors.displayName && <p id="displayName-error" className="text-sm text-[var(--danger)]">{form.formState.errors.displayName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input id="email" type="email" autoComplete="email" required aria-invalid={Boolean(form.formState.errors.email)} aria-describedby={form.formState.errors.email ? "email-error" : undefined} {...form.register("email")} />
              {form.formState.errors.email && <p id="email-error" className="text-sm text-[var(--danger)]">{form.formState.errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative"><Input id="password" className="pr-12" type={showPassword ? "text" : "password"} autoComplete="new-password" required aria-invalid={Boolean(form.formState.errors.password)} aria-describedby="password-help password-error" {...form.register("password")} /><button type="button" className="absolute right-1.5 top-1.5 grid size-8 place-items-center rounded-[6px] text-[var(--muted)] hover:bg-[var(--surface-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]" aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></div>
              <p id="password-help" className="text-xs text-[var(--muted)]">Usa entre 8 y 72 caracteres.</p>
              {form.formState.errors.password && <p id="password-error" className="text-sm text-[var(--danger)]">{form.formState.errors.password.message}</p>}
            </div>
            {errorMessage && <p role="alert" className="rounded-xl bg-[var(--danger-soft)] px-4 py-3 text-sm font-medium text-[var(--danger)]">{errorMessage}</p>}
            <Button className="w-full" size="lg" type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Creando cuenta…" : "Crear cuenta"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-[var(--muted)]">
            ¿Ya tienes cuenta? <Link className="font-semibold text-[var(--accent-ink)] hover:underline" to="/login">Inicia sesión</Link>
          </p>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}

