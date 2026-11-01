# ADR-001: PostgreSQL

## Context

Citylife necesita relaciones, integridad referencial, consultas filtradas y un historial auditable.

## Decision

Usar PostgreSQL como base de datos relacional y Flyway para versionar el esquema.

## Consequences

El desarrollo local requiere PostgreSQL, simplificado con Docker Compose. Los tests aislados pueden usar H2 cuando no validen comportamiento específico de PostgreSQL.

