# Registro de decisiones arquitectónicas

Los ADRs documentan decisiones relevantes y difíciles de revertir. Son breves, permanecen en el repositorio y no se reescriben para ocultar decisiones anteriores: si una decisión cambia, un nuevo ADR sustituye al anterior.

## Estados

- `Proposed`: en evaluación.
- `Accepted`: decisión vigente.
- `Superseded`: sustituida por otro ADR.

## Índice

| ADR | Estado | Decisión |
| --- | --- | --- |
| [ADR-001](ADR-001-use-postgresql.md) | Accepted | PostgreSQL y Flyway |
| [ADR-002](ADR-002-use-react.md) | Accepted | React y TypeScript para la SPA |
| [ADR-003](ADR-003-rest-api.md) | Accepted | API REST JSON documentada con OpenAPI |
| [ADR-004](ADR-004-jwt-authentication.md) | Accepted | JWT para autenticación de la SPA |
| [ADR-005](ADR-005-attachment-storage.md) | Accepted | Metadatos en PostgreSQL y binarios fuera de la base de datos |

## Crear un ADR

Usa el siguiente número disponible y un nombre descriptivo en kebab-case:

```text
ADR-005-deployment-platform.md
```

Plantilla:

```markdown
# ADR-005: Título

Status: Proposed

## Context

Problema, restricciones y fuerzas relevantes.

## Decision

Decisión concreta.

## Consequences

Beneficios, costes y limitaciones asumidas.
```

