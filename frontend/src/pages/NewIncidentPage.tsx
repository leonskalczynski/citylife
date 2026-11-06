import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, MapPin } from "lucide-react";
import { cloneElement, type ReactElement } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router";
import { z } from "zod";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/features/auth/components/AuthProvider";
import { createIncident, getCategories } from "@/features/incidents/api/incidentsApi";
import { IncidentLocationPicker } from "@/features/incidents/components/IncidentLocationPicker";
import { createIncidentSchema } from "@/features/incidents/lib/schemas";
import { ApiClientError } from "@/lib/api";

type IncidentForm = z.infer<typeof createIncidentSchema>;

export function NewIncidentPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const form = useForm<IncidentForm>({
    resolver: zodResolver(createIncidentSchema),
    defaultValues: { title: "", description: "", categoryId: "", address: "", district: "", latitude: undefined, longitude: undefined },
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
  const latitude = form.watch("latitude");
  const longitude = form.watch("longitude");
  const position = latitude != null && longitude != null ? { latitude, longitude } : undefined;

  const setPosition = (next?: { latitude: number; longitude: number }) => {
    form.setValue("latitude", next?.latitude, { shouldDirty: true, shouldValidate: true });
    form.setValue("longitude", next?.longitude, { shouldDirty: true, shouldValidate: true });
  };

  return (
    <AppShell>
      <section className="mx-auto max-w-3xl px-5 py-10 sm:px-6 sm:py-14">
        <Link className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent-ink)] hover:underline" to="/my-incidents">
          <ArrowLeft className="size-4" /> Volver a mis incidencias
        </Link>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">Cuéntanos qué ocurre</h1>

        <Card className="mt-8">
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

              <details className="rounded-2xl bg-[var(--surface-soft)] p-5">
                <summary className="flex cursor-pointer list-none items-center gap-2 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"><MapPin className="size-5 text-[var(--muted)]" />Ubicación opcional</summary>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Dirección" htmlFor="address" error={form.formState.errors.address?.message}>
                    <Input id="address" placeholder="Calle y número" {...form.register("address")} />
                  </Field>
                  <Field label="Distrito" htmlFor="district" error={form.formState.errors.district?.message}>
                    <Input id="district" placeholder="Ej. Centro" {...form.register("district")} />
                  </Field>
                  <Field label="Latitud" htmlFor="latitude" error={form.formState.errors.latitude?.message}>
                    <Input id="latitude" inputMode="decimal" placeholder="40.4168" {...form.register("latitude", { setValueAs: optionalNumber })} />
                  </Field>
                  <Field label="Longitud" htmlFor="longitude" error={form.formState.errors.longitude?.message}>
                    <Input id="longitude" inputMode="decimal" placeholder="-3.7038" {...form.register("longitude", { setValueAs: optionalNumber })} />
                  </Field>
                </div>
                <div className="mt-5"><IncidentLocationPicker value={position} onChange={setPosition} /></div>
              </details>

              {categories.isError && <p role="alert" className="rounded-xl bg-[var(--danger-soft)] px-4 py-3 text-sm font-medium text-[var(--danger)]">No se han podido cargar las categorías.</p>}
              {apiError && <p role="alert" className="rounded-xl bg-[var(--danger-soft)] px-4 py-3 text-sm font-medium text-[var(--danger)]">{apiError}</p>}

              <div className="flex justify-end">
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

function Field({ label, htmlFor, error, children }: { label: string; htmlFor: string; error?: string; children: ReactElement<Record<string, unknown>> }) {
  const errorId = `${htmlFor}-error`;
  const control = cloneElement(children, { "aria-invalid": Boolean(error), "aria-describedby": error ? errorId : undefined, "aria-required": label.includes("*") });
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {control}
      {error && <p id={errorId} className="text-sm text-[var(--danger)]">{error}</p>}
    </div>
  );
}

function optionalNumber(value: unknown) {
  return value === "" || value === null ? undefined : Number(value);
}
