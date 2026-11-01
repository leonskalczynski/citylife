# ADR-003: API REST

## Context

Frontend y backend deben estar desacoplados y todas las reglas importantes deben residir en el backend.

## Decision

Exponer una API REST JSON documentada con OpenAPI. Usar endpoints de comando para transiciones de estado.

## Consequences

Los contratos son explícitos, testables y reutilizables. El frontend nunca accede directamente a PostgreSQL.

