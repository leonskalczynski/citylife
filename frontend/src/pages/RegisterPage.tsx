import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
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
          <p className="text-sm font-semibold text-teal-700">Cuenta ciudadana</p>
          <h1 className="text-3xl font-semibold tracking-tight">Crea tu cuenta</h1>
          <p className="text-sm leading-6 text-slate-600">Podrás reportar y seguir tus incidencias urbanas.</p>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={form.handleSubmit((data) => mutation.mutate(data))} noValidate>
            <div className="space-y-2">
              <Label htmlFor="displayName">Nombre</Label>
              <Input id="displayName" autoComplete="name" {...form.register("displayName")} />
              {form.formState.errors.displayName && <p className="text-sm text-red-700">{form.formState.errors.displayName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
              {form.formState.errors.email && <p className="text-sm text-red-700">{form.formState.errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" autoComplete="new-password" {...form.register("password")} />
              {form.formState.errors.password && <p className="text-sm text-red-700">{form.formState.errors.password.message}</p>}
            </div>
            {errorMessage && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{errorMessage}</p>}
            <Button className="w-full" size="lg" type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Creando cuenta…" : "Crear cuenta"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-600">
            ¿Ya tienes cuenta? <Link className="font-semibold text-teal-700 hover:underline" to="/login">Inicia sesión</Link>
          </p>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}

