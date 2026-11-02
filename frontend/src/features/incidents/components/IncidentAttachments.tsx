import { ImagePlus, Images, LoaderCircle } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { Attachment } from "@/features/incidents/types";
import { ApiClientError, requestBlob } from "@/lib/api";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

type IncidentAttachmentsProps = {
  attachments?: Attachment[];
  token: string;
  isLoading: boolean;
  isError: boolean;
  canUpload?: boolean;
  isUploading?: boolean;
  uploadError?: unknown;
  onUpload?: (file: File) => void;
};

export function IncidentAttachments({ attachments, token, isLoading, isError, canUpload = false, isUploading = false, uploadError, onUpload }: IncidentAttachmentsProps) {
  const inputId = useId();
  const [file, setFile] = useState<File>();
  const wasUploading = useRef(false);
  const [validationError, setValidationError] = useState<string>();
  const uploadErrorMessage = uploadError ? (uploadError instanceof ApiClientError ? uploadError.body.message : "No se ha podido subir la imagen") : undefined;

  const chooseFile = (selected?: File) => {
    setValidationError(undefined);
    if (!selected) return setFile(undefined);
    if (!ACCEPTED_TYPES.includes(selected.type)) {
      setFile(undefined);
      return setValidationError("Selecciona una imagen JPEG, PNG o WebP.");
    }
    if (selected.size > MAX_FILE_SIZE) {
      setFile(undefined);
      return setValidationError("La imagen no puede superar 5 MB.");
    }
    setFile(selected);
  };

  const submit = () => {
    if (!file || !onUpload) return;
    onUpload(file);
  };

  useEffect(() => {
    if (wasUploading.current && !isUploading && !uploadError) setFile(undefined);
    wasUploading.current = isUploading;
  }, [isUploading, uploadError]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-[var(--accent-soft-strong)] text-[var(--accent-ink)]"><Images className="size-5" /></span>
          <h2 className="text-lg font-semibold">Archivos y evidencias</h2>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {canUpload && (
          <div className="rounded-2xl bg-[var(--surface-soft)] p-4">
            <p className="mb-3 text-xs text-[var(--muted)]">JPEG, PNG o WebP · máximo 5 MB.</p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input id={inputId} aria-label="Seleccionar imagen" type="file" accept={ACCEPTED_TYPES.join(",")} className="sr-only" onChange={(event) => chooseFile(event.target.files?.[0])} />
              <label htmlFor={inputId} className="inline-flex h-10 cursor-pointer items-center justify-center rounded-xl bg-[var(--accent-soft-strong)] px-4 text-sm font-semibold text-[var(--accent-ink)] transition-colors hover:bg-[var(--accent)]">Seleccionar imagen</label>
              <span className="min-w-0 flex-1 truncate text-sm text-[var(--muted)]">{file?.name ?? "Ningún archivo seleccionado"}</span>
              <Button type="button" variant="outline" disabled={!file || isUploading} onClick={submit}>
                {isUploading ? <LoaderCircle className="mr-2 size-4 animate-spin" /> : <ImagePlus className="mr-2 size-4" />}
                {isUploading ? "Subiendo…" : "Subir imagen"}
              </Button>
            </div>
            {file && <p className="mt-2 text-xs text-[var(--muted)]">{formatBytes(file.size)}</p>}
            {(validationError || uploadErrorMessage) && <p role="alert" className="mt-3 text-sm text-[var(--danger)]">{validationError ?? uploadErrorMessage}</p>}
          </div>
        )}

        {isLoading && <div className="grid gap-3 sm:grid-cols-2"><div className="h-48 animate-pulse rounded-xl bg-[var(--surface-soft)]" /><div className="h-48 animate-pulse rounded-xl bg-[var(--surface-soft)]" /></div>}
        {isError && <p className="text-sm text-[var(--danger)]">No se han podido cargar los archivos.</p>}
        {!isLoading && !isError && attachments?.length === 0 && <p className="py-8 text-center text-sm text-[var(--muted)]">Todavía no hay imágenes en esta incidencia.</p>}
        {attachments && attachments.length > 0 && <div className="grid gap-4 sm:grid-cols-2">{attachments.map((attachment) => <AttachmentCard key={attachment.id} attachment={attachment} token={token} />)}</div>}
      </CardContent>
    </Card>
  );
}

function AttachmentCard({ attachment, token }: { attachment: Attachment; token: string }) {
  const [source, setSource] = useState<string>();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let objectUrl: string | undefined;
    requestBlob(`/api/attachments/${attachment.id}/content`, token, controller.signal)
      .then((blob) => { objectUrl = URL.createObjectURL(blob); setSource(objectUrl); })
      .catch((error) => { if (error instanceof DOMException && error.name === "AbortError") return; setFailed(true); });
    return () => { controller.abort(); if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [attachment.id, token]);

  return (
    <article className="overflow-hidden rounded-2xl bg-[var(--surface-soft)]">
      <div className="aspect-[4/3] bg-[var(--line)]">
        {source ? <a href={source} target="_blank" rel="noreferrer" aria-label={`Abrir ${attachment.originalFileName} en una pestaña nueva`}><img src={source} alt={attachment.originalFileName} className="h-full w-full object-cover" /></a> : <div className="flex h-full items-center justify-center text-sm text-[var(--muted)]">{failed ? "Vista no disponible" : "Cargando imagen…"}</div>}
      </div>
      <div className="p-4"><p className="truncate text-sm font-semibold" title={attachment.originalFileName}>{attachment.originalFileName}</p><p className="mt-1 text-xs text-[var(--muted)]">{attachment.uploadedBy.displayName} · {formatBytes(attachment.sizeBytes)}</p><p className="mt-1 text-xs text-[var(--muted)]">{formatDate(attachment.createdAt)}</p></div>
    </article>
  );
}

function formatBytes(bytes: number) { return bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`; }
function formatDate(value: string) { return new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
