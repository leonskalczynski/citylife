import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays, CheckCircle2, MapPin, Play, UserRound } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { Link, useParams } from "react-router";
import { z } from "zod";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/features/auth/components/AuthProvider";
import { getWorkIncident, getWorkIncidentAttachments, getWorkIncidentHistory, resolveWork, startWork, updateWorkNotes, uploadWorkIncidentAttachment } from "@/features/incidents/api/workApi";
import { IncidentAttachments } from "@/features/incidents/components/IncidentAttachments";
import { IncidentLocationCard } from "@/features/incidents/components/IncidentLocationCard";
import { IncidentStatusBadge } from "@/features/incidents/components/IncidentStatusBadge";
import { IncidentTimeline } from "@/features/incidents/components/IncidentTimeline";
import { resolveWorkSchema, workNotesSchema } from "@/features/incidents/lib/workSchemas";
import type { Incident } from "@/features/incidents/types";
import { ApiClientError } from "@/lib/api";

type NotesForm = z.infer<typeof workNotesSchema>;
type ResolveForm = z.infer<typeof resolveWorkSchema>;

export function WorkIncidentDetailPage() {
  const { token } = useAuth();
  const { incidentId = "" } = useParams();
  const queryClient = useQueryClient();
  const incidentQuery = useQuery({ queryKey: ["work-incident", incidentId], queryFn: ({ signal }) => getWorkIncident(token!, incidentId, signal) });
  const historyQuery = useQuery({ queryKey: ["work-incident-history", incidentId], queryFn: ({ signal }) => getWorkIncidentHistory(token!, incidentId, signal) });
  const attachmentsQuery = useQuery({ queryKey: ["work-incident-attachments", incidentId], queryFn: ({ signal }) => getWorkIncidentAttachments(token!, incidentId, signal) });
  const notesForm = useForm<NotesForm>({ resolver: zodResolver(workNotesSchema), defaultValues: { notes: "" } });
  const resolveForm = useForm<ResolveForm>({ resolver: zodResolver(resolveWorkSchema), defaultValues: { summary: "" } });

  useEffect(() => {
    if (incidentQuery.data) notesForm.reset({ notes: incidentQuery.data.technicianNotes ?? "" });
  }, [incidentQuery.data]);

  const updateIncident = (incident: Incident) => {
    queryClient.setQueryData(["work-incident", incidentId], incident);
    queryClient.invalidateQueries({ queryKey: ["assigned-work"] });
    queryClient.invalidateQueries({ queryKey: ["work-incident-history", incidentId] });
  };
  const startMutation = useMutation({ mutationFn: () => startWork(token!, incidentId), onSuccess: updateIncident });
  const notesMutation = useMutation({ mutationFn: (data: NotesForm) => updateWorkNotes(token!, incidentId, data.notes), onSuccess: updateIncident });
  const resolveMutation = useMutation({ mutationFn: (data: ResolveForm) => resolveWork(token!, incidentId, data.summary), onSuccess: updateIncident });
  const attachmentMutation = useMutation({ mutationFn: (file: File) => uploadWorkIncidentAttachment(token!, incidentId, file), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["work-incident-attachments", incidentId] }) });
  const actionError = [startMutation.error, notesMutation.error, resolveMutation.error].find(Boolean);

  return (
    <AppShell>
      <section className="mx-auto max-w-6xl px-5 py-10 sm:px-6 sm:py-14">
        <Link className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent-ink)] hover:underline" to="/work"><ArrowLeft className="size-4" />Volver a mis trabajos</Link>
        {incidentQuery.isLoading && <div className="mt-8 h-96 animate-pulse rounded-2xl bg-[var(--surface)]" />}
        {incidentQuery.isError && <Card className="mt-8"><CardContent className="py-12 text-center text-[var(--danger)]">No se ha podido cargar este trabajo.</CardContent></Card>}
        {incidentQuery.data && (
          <>
            <header className="mt-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
              <div><div className="flex flex-wrap items-center gap-2"><IncidentStatusBadge status={incidentQuery.data.status} /><span className="text-sm text-[var(--muted)]">#{incidentQuery.data.id.slice(0, 8)}</span></div><h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{incidentQuery.data.title}</h1><p className="mt-3 text-[var(--muted)]">{incidentQuery.data.category.name}</p></div>
              <div className="rounded-xl bg-[var(--surface-soft)] px-4 py-3 text-sm"><span className="text-[var(--muted)]">Prioridad</span><p className="font-semibold">{priorityLabel(incidentQuery.data.priority)}</p></div>
            </header>

            {actionError && <p role="alert" className="mt-6 rounded-xl bg-[var(--danger-soft)] px-4 py-3 text-sm font-medium text-[var(--danger)]">{actionError instanceof ApiClientError ? actionError.body.message : "No se ha podido completar la acción"}</p>}

            <div className="mt-8 grid gap-6 lg:grid-cols-[1.35fr_0.9fr]">
              <div className="space-y-5">
                <Card><CardHeader><h2 className="text-lg font-semibold">Descripción</h2></CardHeader><CardContent><p className="whitespace-pre-wrap leading-7 text-[var(--ink)]">{incidentQuery.data.description}</p></CardContent></Card>
                <Card><CardHeader><h2 className="text-lg font-semibold">Datos del trabajo</h2></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2"><Detail icon={<UserRound />} label="Departamento" value={incidentQuery.data.department?.name ?? "Sin departamento"} /><Detail icon={<CalendarDays />} label="Última actualización" value={formatDate(incidentQuery.data.updatedAt)} />{(incidentQuery.data.address || incidentQuery.data.district) && <Detail icon={<MapPin />} label="Ubicación" value={[incidentQuery.data.address, incidentQuery.data.district].filter(Boolean).join(" · ")} />}</CardContent></Card>
                <IncidentLocationCard incident={incidentQuery.data} />
                <IncidentAttachments attachments={attachmentsQuery.data} token={token!} isLoading={attachmentsQuery.isLoading} isError={attachmentsQuery.isError} canUpload isUploading={attachmentMutation.isPending} uploadError={attachmentMutation.error} onUpload={(file) => attachmentMutation.mutate(file)} />
                {incidentQuery.data.technicianNotes && (incidentQuery.data.status === "RESOLVED" || incidentQuery.data.status === "CLOSED") && <Card><CardHeader><h2 className="text-lg font-semibold">Notas de intervención</h2></CardHeader><CardContent><p className="whitespace-pre-wrap leading-7 text-[var(--ink)]">{incidentQuery.data.technicianNotes}</p></CardContent></Card>}
                {incidentQuery.data.resolutionSummary && <Card className="bg-[var(--accent-soft)]"><CardHeader><h2 className="flex items-center gap-2 text-lg font-semibold"><CheckCircle2 className="size-5 text-[var(--accent-ink)]" />Resolución</h2></CardHeader><CardContent><p className="whitespace-pre-wrap leading-7 text-[var(--ink)]">{incidentQuery.data.resolutionSummary}</p>{incidentQuery.data.resolvedAt && <p className="mt-3 text-sm text-[var(--muted)]">Resuelta el {formatDate(incidentQuery.data.resolvedAt)}</p>}</CardContent></Card>}
                <IncidentTimeline changes={historyQuery.data} isLoading={historyQuery.isLoading} isError={historyQuery.isError} />
              </div>

              <aside className="space-y-5">
                {incidentQuery.data.status === "ASSIGNED" && <Card><CardHeader><h2 className="text-lg font-semibold">Comenzar intervención</h2></CardHeader><CardContent><Button className="w-full" onClick={() => startMutation.mutate()} disabled={startMutation.isPending}><Play className="mr-2 size-4" />Iniciar trabajo</Button></CardContent></Card>}

                {(incidentQuery.data.status === "ASSIGNED" || incidentQuery.data.status === "IN_PROGRESS") && <Card><CardHeader><h2 className="text-lg font-semibold">Notas de intervención</h2></CardHeader><CardContent><form className="space-y-3" onSubmit={notesForm.handleSubmit((data) => notesMutation.mutate(data))}><Label htmlFor="notes">Notas</Label><Textarea id="notes" className="min-h-36" placeholder="Estado encontrado, medidas provisionales, materiales necesarios…" {...notesForm.register("notes")} />{notesForm.formState.errors.notes && <p className="text-sm text-[var(--danger)]">{notesForm.formState.errors.notes.message}</p>}<Button type="submit" variant="outline" className="w-full" disabled={notesMutation.isPending}>Guardar notas</Button></form></CardContent></Card>}

                {incidentQuery.data.status === "IN_PROGRESS" && <Card><CardHeader><h2 className="text-lg font-semibold">Resolver incidencia</h2></CardHeader><CardContent><form className="space-y-3" onSubmit={resolveForm.handleSubmit((data) => resolveMutation.mutate(data))}><Label htmlFor="summary">Resolución</Label><Textarea id="summary" className="min-h-32" placeholder="Describe la reparación o actuación completada…" {...resolveForm.register("summary")} />{resolveForm.formState.errors.summary && <p className="text-sm text-[var(--danger)]">{resolveForm.formState.errors.summary.message}</p>}<Button type="submit" className="w-full" disabled={resolveMutation.isPending}>Marcar como resuelta</Button></form></CardContent></Card>}
              </aside>
            </div>
          </>
        )}
      </section>
    </AppShell>
  );
}

function Detail({ icon, label, value }: { icon: ReactNode; label: string; value: string }) { return <div className="flex gap-3"><span className="mt-0.5 [&>svg]:size-4 [&>svg]:text-[var(--muted)]">{icon}</span><div><p className="text-sm text-[var(--muted)]">{label}</p><p className="mt-0.5 text-sm font-medium text-[var(--ink)]">{value}</p></div></div>; }
function priorityLabel(priority: Incident["priority"]) { return { LOW: "Baja", NORMAL: "Normal", HIGH: "Alta", URGENT: "Urgente" }[priority]; }
function formatDate(value: string) { return new Intl.DateTimeFormat("es-ES", { dateStyle: "long", timeStyle: "short" }).format(new Date(value)); }
