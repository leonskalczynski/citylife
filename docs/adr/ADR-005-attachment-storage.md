# ADR-005: Almacenamiento de adjuntos

Status: Accepted

## Context

Citylife necesita evidencias visuales vinculadas a incidencias, con permisos por recurso, límites claros y una solución sencilla para el MVP. Guardar binarios en PostgreSQL aumentaría el tamaño de las copias y acoplaría la entrega de imágenes a la base de datos.

## Decision

Guardar en PostgreSQL solo los metadatos y relaciones de cada adjunto. El contenido binario se almacena en un directorio configurable mediante `ATTACHMENT_STORAGE_PATH`, usando nombres internos generados. El backend es el único punto de lectura y escritura y valida autorización, firma binaria, tamaño y cantidad.

## Consequences

El desarrollo local no necesita un servicio adicional y el almacenamiento puede sustituirse detrás del mismo servicio en una fase futura. Producción debe montar un volumen persistente, incluirlo en sus copias de seguridad y coordinar la restauración con PostgreSQL. Un despliegue con varias instancias requerirá almacenamiento compartido u objetos compatible con esta abstracción.
