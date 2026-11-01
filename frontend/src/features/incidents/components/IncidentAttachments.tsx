import { ImagePlus, Images, LoaderCircle } from "lucide-react";
import { useEffect, useId, useState } from "react";

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
    setFile(undefined);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <span className="rounded-md bg-slate-100 p-2 text-slate-700"><Images className="size-5" /></span>
          <div><h2 className="text-lg font-semibold">Archivos y evidencias</h2><p className="mt-1 text-sm leading-6 text-slate-600">Imágenes JPEG, PNG o WebP. Máximo 5 MB por archivo y 10 por incidencia.</p></div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {canUpload && (
          <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">Añadir una imagen</p>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
              <input id={inputId} aria-label="Seleccionar imagen" type="file" accept={ACCEPTED_TYPES.join(",")} className="sr-only" onChange={(event) => chooseFile(event.target.files?.[0])} />
              <label htmlFor={inputId} className="inline-flex h-10 cursor-pointer items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50">Seleccionar imagen</label>
              <span className="min-w-0 flex-1 truncate text-sm text-slate-600">{file?.name ?? "Ningún archivo seleccionado"}</span>
              <Button type="button" variant="outline" disabled={!file || isUploading} onClick={submit}>
                {isUploading ? <LoaderCircle className="mr-2 size-4 animate-spin" /> : <ImagePlus className="mr-2 size-4" />}
                {isUploading ? "Subiendo…" : "Subir imagen"}
              </Button>
            </div>
            {file && <p className="mt-2 text-xs text-slate-600">{formatBytes(file.size)}</p>}
            {(validationError || uploadErrorMessage) && <p role="alert" className="mt-3 text-sm text-red-700">{validationError ?? uploadErrorMessage}</p>}
          </div>
        )}

        {isLoading && <div className="grid gap-3 sm:grid-cols-2"><div className="h-48 animate-pulse rounded-md bg-slate-100" /><div className="h-48 animate-pulse rounded-md bg-slate-100" /></div>}
        {isError && <p className="text-sm text-red-700">No se han podido cargar los archivos.</p>}
        {!isLoading && !isError && attachments?.length === 0 && <p className="rounded-md bg-slate-50 px-4 py-8 text-center text-sm text-slate-600">Todavía no hay imágenes en esta incidencia.</p>}
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
    <article className="overflow-hidden rounded-md border border-slate-200 bg-white">
      <div className="aspect-[4/3] bg-slate-100">
        {source ? <a href={source} target="_blank" rel="noreferrer"><img src={source} alt={attachment.originalFileName} className="h-full w-full object-cover" /></a> : <div className="flex h-full items-center justify-center text-sm text-slate-500">{failed ? "Vista no disponible" : "Cargando imagen…"}</div>}
      </div>
      <div className="p-3"><p className="truncate text-sm font-semibold" title={attachment.originalFileName}>{attachment.originalFileName}</p><p className="mt-1 text-xs text-slate-500">{attachment.uploadedBy.displayName} · {formatBytes(attachment.sizeBytes)}</p><p className="mt-1 text-xs text-slate-500">{formatDate(attachment.createdAt)}</p></div>
    </article>
  );
}

function formatBytes(bytes: number) { return bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`; }
function formatDate(value: string) { return new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
