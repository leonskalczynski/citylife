import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays, MapPin, UserRound } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { Link, useParams } from "react-router";
import { z } from "zod";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/features/auth/components/AuthProvider";
import { assignIncident, changeIncidentPriority, getDepartments, getOperationIncident, getOperationIncidentAttachments, getOperationIncidentHistory, getTechnicians, rejectIncident, validateIncident } from "@/features/incidents/api/operationsApi";
import { IncidentAttachments } from "@/features/incidents/components/IncidentAttachments";
import { IncidentStatusBadge } from "@/features/incidents/components/IncidentStatusBadge";
import { IncidentTimeline } from "@/features/incidents/components/IncidentTimeline";
import { assignmentSchema, prioritySchema, rejectIncidentSchema } from "@/features/incidents/lib/operationSchemas";
import type { Incident } from "@/features/incidents/types";
import { ApiClientError } from "@/lib/api";

type RejectForm = z.infer<typeof rejectIncidentSchema>;
type PriorityForm = z.infer<typeof prioritySchema>;
type AssignmentForm = z.infer<typeof assignmentSchema>;

export function OperationIncidentDetailPage() {
  const { token } = useAuth();
  const { incidentId = "" } = useParams();
  const queryClient = useQueryClient();
  const incidentQuery = useQuery({ queryKey: ["operation-incident", incidentId], queryFn: ({ signal }) => getOperationIncident(token!, incidentId, signal) });
  const historyQuery = useQuery({ queryKey: ["operation-incident-history", incidentId], queryFn: ({ signal }) => getOperationIncidentHistory(token!, incidentId, signal) });
  const attachmentsQuery = useQuery({ queryKey: ["operation-incident-attachments", incidentId], queryFn: ({ signal }) => getOperationIncidentAttachments(token!, incidentId, signal) });
  const departments = useQuery({ queryKey: ["departments"], queryFn: ({ signal }) => getDepartments(token!, signal) });
  const technicians = useQuery({ queryKey: ["technicians"], queryFn: ({ signal }) => getTechnicians(token!, signal) });
  const rejectForm = useForm<RejectForm>({ resolver: zodResolver(rejectIncidentSchema), defaultValues: { reason: "" } });
  const priorityForm = useForm<PriorityForm>({ resolver: zodResolver(prioritySchema), defaultValues: { priority: "NORMAL" } });
  const assignmentForm = useForm<AssignmentForm>({ resolver: zodResolver(assignmentSchema), defaultValues: { departmentId: "", technicianId: "" } });

  useEffect(() => {
    if (!incidentQuery.data) return;
    priorityForm.reset({ priority: incidentQuery.data.priority });
    assignmentForm.reset({ departmentId: incidentQuery.data.department?.id ?? "", technicianId: incidentQuery.data.assignedTo?.id ?? "" });
  }, [incidentQuery.data]);

  const updateIncident = (incident: Incident) => {
    queryClient.setQueryData(["operation-incident", incidentId], incident);
    queryClient.invalidateQueries({ queryKey: ["operation-incidents"] });
    queryClient.invalidateQueries({ queryKey: ["operation-incident-history", incidentId] });
  };
  const validateMutation = useMutation({ mutationFn: () => validateIncident(token!, incidentId), onSuccess: updateIncident });
  const rejectMutation = useMutation({ mutationFn: (data: RejectForm) => rejectIncident(token!, incidentId, data.reason), onSuccess: updateIncident });
  const priorityMutation = useMutation({ mutationFn: (data: PriorityForm) => changeIncidentPriority(token!, incidentId, data.priority), onSuccess: updateIncident });
  const assignmentMutation = useMutation({ mutationFn: (data: AssignmentForm) => assignIncident(token!, incidentId, data.departmentId, data.technicianId), onSuccess: updateIncident });
  const actionError = [validateMutation.error, rejectMutation.error, priorityMutation.error, assignmentMutation.error].find(Boolean);

  return (
    <AppShell>
      <section className="mx-auto max-w-6xl px-5 py-10 sm:px-6 sm:py-14">
        <Link className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent-ink)] hover:underline" to="/operations/incidents"><ArrowLeft className="size-4" />Volver a la bandeja</Link>
        {incidentQuery.isLoading && <div className="mt-8 h-96 animate-pulse rounded-lg border border-slate-200 bg-white" />}
        {incidentQuery.isError && <Card className="mt-8"><CardContent className="py-12 text-center text-red-700">No se ha podido cargar la incidencia.</CardContent></Card>}
        {incidentQuery.data && (
          <>
            <div className="mt-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
              <div><div className="flex flex-wrap items-center gap-2"><IncidentStatusBadge status={incidentQuery.data.status} /><span className="text-sm text-slate-500">#{incidentQuery.data.id.slice(0, 8)}</span></div><h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{incidentQuery.data.title}</h1><p className="mt-3 text-slate-600">{incidentQuery.data.category.name}</p></div>
              <div className="rounded-md border border-slate-200 bg-white px-4 py-3 text-sm"><span className="text-slate-500">Prioridad</span><p className="font-semibold">{priorityLabel(incidentQuery.data.priority)}</p></div>
            </div>

            {actionError && <p role="alert" className="mt-6 rounded-md bg-red-50 p-3 text-sm text-red-800">{actionError instanceof ApiClientError ? actionError.body.message : "No se ha podido completar la acción"}</p>}

            <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
              <div className="space-y-5">
                <Card><CardHeader><h2 className="text-lg font-semibold">Descripción</h2></CardHeader><CardContent><p className="whitespace-pre-wrap leading-7 text-slate-700">{incidentQuery.data.description}</p></CardContent></Card>
                <Card><CardHeader><h2 className="text-lg font-semibold">Contexto</h2></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2"><Detail icon={<UserRound />} label="Ciudadano" value={`${incidentQuery.data.createdBy.displayName} · ${incidentQuery.data.createdBy.email}`} /><Detail icon={<CalendarDays />} label="Reportada" value={formatDate(incidentQuery.data.createdAt)} />{(incidentQuery.data.address || incidentQuery.data.district) && <Detail icon={<MapPin />} label="Ubicación" value={[incidentQuery.data.address, incidentQuery.data.district].filter(Boolean).join(" · ")} />}</CardContent></Card>
                <IncidentAttachments attachments={attachmentsQuery.data} token={token!} isLoading={attachmentsQuery.isLoading} isError={attachmentsQuery.isError} />
                {incidentQuery.data.rejectionReason && <Card className="border-red-200"><CardHeader><h2 className="text-lg font-semibold text-red-900">Motivo del rechazo</h2></CardHeader><CardContent className="text-sm text-red-800">{incidentQuery.data.rejectionReason}</CardContent></Card>}
                <IncidentTimeline changes={historyQuery.data} isLoading={historyQuery.isLoading} isError={historyQuery.isError} />
              </div>

              <aside className="space-y-5">
                {incidentQuery.data.status === "REPORTED" && <Card><CardHeader><h2 className="text-lg font-semibold">Revisión</h2><p className="text-sm text-slate-600">Valida el aviso o recházalo indicando el motivo.</p></CardHeader><CardContent className="space-y-5"><Button className="w-full" onClick={() => validateMutation.mutate()} disabled={validateMutation.isPending}>Validar incidencia</Button><div className="border-t border-slate-200 pt-5"><form className="space-y-3" onSubmit={rejectForm.handleSubmit((data) => rejectMutation.mutate(data))}><Label htmlFor="reason">Motivo del rechazo</Label><Textarea id="reason" className="min-h-24" {...rejectForm.register("reason")} />{rejectForm.formState.errors.reason && <p className="text-sm text-red-700">{rejectForm.formState.errors.reason.message}</p>}<Button type="submit" variant="outline" className="w-full border-red-300 text-red-800 hover:bg-red-50" disabled={rejectMutation.isPending}>Rechazar incidencia</Button></form></div></CardContent></Card>}

                {incidentQuery.data.status !== "REJECTED" && incidentQuery.data.status !== "CLOSED" && <Card><CardHeader><h2 className="text-lg font-semibold">Prioridad</h2></CardHeader><CardContent><form className="space-y-3" onSubmit={priorityForm.handleSubmit((data) => priorityMutation.mutate(data))}><Label htmlFor="priority">Nivel de atención</Label><Select id="priority" {...priorityForm.register("priority")}><option value="LOW">Baja</option><option value="NORMAL">Normal</option><option value="HIGH">Alta</option><option value="URGENT">Urgente</option></Select><Button type="submit" variant="outline" className="w-full" disabled={priorityMutation.isPending}>Guardar prioridad</Button></form></CardContent></Card>}

                {(incidentQuery.data.status === "VALIDATED" || incidentQuery.data.status === "ASSIGNED") && <Card><CardHeader><h2 className="text-lg font-semibold">Asignación</h2><p className="text-sm text-slate-600">El departamento es obligatorio; el técnico puede asignarse después.</p></CardHeader><CardContent><form className="space-y-4" onSubmit={assignmentForm.handleSubmit((data) => assignmentMutation.mutate(data))}><div className="space-y-2"><Label htmlFor="departmentId">Departamento</Label><Select id="departmentId" {...assignmentForm.register("departmentId")}><option value="">Selecciona un departamento</option>{departments.data?.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</Select>{assignmentForm.formState.errors.departmentId && <p className="text-sm text-red-700">{assignmentForm.formState.errors.departmentId.message}</p>}</div><div className="space-y-2"><Label htmlFor="technicianId">Técnico</Label><Select id="technicianId" {...assignmentForm.register("technicianId")}><option value="">Sin técnico todavía</option>{technicians.data?.map((technician) => <option key={technician.id} value={technician.id}>{technician.displayName}</option>)}</Select></div><Button type="submit" className="w-full" disabled={assignmentMutation.isPending}>Guardar asignación</Button></form></CardContent></Card>}

                <Card className="shadow-none"><CardContent className="space-y-3 py-5 text-sm"><InfoRow label="Departamento" value={incidentQuery.data.department?.name ?? "Sin asignar"} /><InfoRow label="Técnico" value={incidentQuery.data.assignedTo?.displayName ?? "Sin asignar"} /></CardContent></Card>
              </aside>
            </div>
          </>
        )}
      </section>
    </AppShell>
  );
}

function Detail({ icon, label, value }: { icon: ReactNode; label: string; value: string }) { return <div className="flex gap-3"><span className="mt-0.5 [&>svg]:size-4 [&>svg]:text-slate-500">{icon}</span><div><p className="text-sm text-slate-500">{label}</p><p className="mt-0.5 text-sm font-medium text-slate-900">{value}</p></div></div>; }
function InfoRow({ label, value }: { label: string; value: string }) { return <div className="flex justify-between gap-4"><span className="text-slate-500">{label}</span><span className="text-right font-medium">{value}</span></div>; }
function priorityLabel(priority: Incident["priority"]) { return { LOW: "Baja", NORMAL: "Normal", HIGH: "Alta", URGENT: "Urgente" }[priority]; }
function formatDate(value: string) { return new Intl.DateTimeFormat("es-ES", { dateStyle: "long", timeStyle: "short" }).format(new Date(value)); }
