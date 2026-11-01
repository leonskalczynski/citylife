import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, MapPin } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router";
import { z } from "zod";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/features/auth/components/AuthProvider";
import { createIncident, getCategories } from "@/features/incidents/api/incidentsApi";
import { createIncidentSchema } from "@/features/incidents/lib/schemas";
import { ApiClientError } from "@/lib/api";

type IncidentForm = z.infer<typeof createIncidentSchema>;

export function NewIncidentPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const form = useForm<IncidentForm>({
    resolver: zodResolver(createIncidentSchema),
    defaultValues: { title: "", description: "", categoryId: "", address: "", district: "" },
  });
  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: ({ signal }) => getCategories(token!, signal),
  });
  const mutation = useMutation({
    mutationFn: (data: IncidentForm) => createIncident(token!, data),
    onSuccess: (incident) => {
      queryClient.invalidateQueries({ queryKey: ["my-incidents"] });
      navigate(`/incidents/${incident.id}`, { replace: true, state: { created: true } });
    },
  });

  const apiError = mutation.error instanceof ApiClientError ? mutation.error.body.message : null;

  return (
    <AppShell>
      <section className="mx-auto max-w-3xl px-5 py-10 sm:px-6 sm:py-14">
        <Link className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent-ink)] hover:underline" to="/my-incidents">
          <ArrowLeft className="size-4" /> Volver a mis incidencias
        </Link>
        <div className="mt-6">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">Nueva incidencia</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Cuéntanos qué ocurre</h1>
          <p className="mt-3 text-slate-600">Describe el problema con claridad. Podrás seguir su estado desde tu área personal.</p>
        </div>

        <Card className="mt-8">
          <CardHeader>
            <h2 className="text-xl font-semibold">Datos de la incidencia</h2>
            <p className="text-sm text-slate-600">Los campos marcados con * son obligatorios.</p>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={form.handleSubmit((data) => mutation.mutate(data))} noValidate>
              <Field label="Título *" error={form.formState.errors.title?.message} htmlFor="title">
                <Input id="title" placeholder="Ej. Farola apagada junto al parque" {...form.register("title")} />
              </Field>

              <Field label="Descripción *" error={form.formState.errors.description?.message} htmlFor="description">
                <Textarea id="description" placeholder="Explica dónde está el problema y desde cuándo lo observas…" {...form.register("description")} />
              </Field>

              <Field label="Categoría *" error={form.formState.errors.categoryId?.message} htmlFor="categoryId">
                <Select id="categoryId" disabled={categories.isLoading} {...form.register("categoryId")}>
                  <option value="">{categories.isLoading ? "Cargando categorías…" : "Selecciona una categoría"}</option>
                  {categories.data?.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </Select>
              </Field>

              <div className="rounded-md border border-slate-200 bg-slate-50 p-5">
                <div className="mb-4 flex items-center gap-2">
                  <MapPin className="size-5 text-slate-500" />
                  <h3 className="font-semibold">Ubicación opcional</h3>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Dirección" htmlFor="address" error={form.formState.errors.address?.message}>
                    <Input id="address" placeholder="Calle y número" {...form.register("address")} />
                  </Field>
                  <Field label="Distrito" htmlFor="district" error={form.formState.errors.district?.message}>
                    <Input id="district" placeholder="Ej. Centro" {...form.register("district")} />
                  </Field>
                  <Field label="Latitud" htmlFor="latitude" error={form.formState.errors.latitude?.message}>
                    <Input id="latitude" type="number" step="any" placeholder="40.4168" {...form.register("latitude", { setValueAs: optionalNumber })} />
                  </Field>
                  <Field label="Longitud" htmlFor="longitude" error={form.formState.errors.longitude?.message}>
                    <Input id="longitude" type="number" step="any" placeholder="-3.7038" {...form.register("longitude", { setValueAs: optionalNumber })} />
                  </Field>
                </div>
                <p className="mt-3 text-xs text-slate-500">El selector visual de mapa se incorporará en una fase posterior.</p>
              </div>

              {categories.isError && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-800">No se han podido cargar las categorías.</p>}
              {apiError && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-800">{apiError}</p>}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={() => navigate("/my-incidents")}>Cancelar</Button>
                <Button type="submit" disabled={mutation.isPending || categories.isError}>
                  {mutation.isPending ? "Enviando…" : "Reportar incidencia"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </section>
    </AppShell>
  );
}

function Field({ label, htmlFor, error, children }: { label: string; htmlFor: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error && <p className="text-sm text-red-700">{error}</p>}
    </div>
  );
}

function optionalNumber(value: unknown) {
  return value === "" || value === null ? undefined : Number(value);
}
