# ADR-004: JWT para la SPA

Status: Proposed

## Context

La futura SPA necesita autenticarse contra una API REST y aplicar autorización por rol en el servidor.

## Decision

En la Fase 2 se usarán access tokens JWT de vida corta y contraseñas con BCrypt. El mecanismo de persistencia y renovación se decidirá al implementar la amenaza concreta, evitando guardar tokens de larga duración en `localStorage`.

## Consequences

El backend será la fuente de verdad de permisos. Esta decisión aún no añade código ni secretos a la Fase 1.

