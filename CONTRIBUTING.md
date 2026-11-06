# Contribuir a Urban Pulse

Gracias por contribuir. Urban Pulse prioriza cambios pequeños, explícitos y fáciles de revisar. La simplicidad y la claridad tienen preferencia sobre patrones sofisticados que todavía no aporten valor.

## Antes de empezar

1. Lee [la arquitectura](docs/architecture.md) y los [ADRs](docs/adr/README.md).
2. Sigue [la guía de desarrollo](docs/development.md) para preparar el entorno.
3. Comprueba el estado actual del repositorio y evita modificar trabajo no relacionado.
4. Limita cada cambio a una funcionalidad o decisión coherente.

## Principios

- Aplica KISS y YAGNI.
- Organiza el código por funcionalidad, no en grandes carpetas técnicas globales.
- Mantén las reglas de negocio y permisos en el backend.
- Usa DTOs en la API; no expongas entidades JPA.
- No añadas dependencias sin explicar el problema concreto que resuelven.
- No crees interfaces, capas o abstracciones con una sola implementación si no aportan claridad.
- Mantén los datos externos como enriquecimiento opcional: su fallo no debe impedir crear una incidencia.

## Flujo recomendado

1. Crea una rama descriptiva, por ejemplo `feat/incident-creation`.
2. Implementa únicamente el alcance solicitado y sus pruebas relevantes.
3. Actualiza la documentación o el contrato OpenAPI si cambia el comportamiento público.
4. Ejecuta las verificaciones de backend y frontend.
5. Revisa que no se hayan incluido secretos, artefactos generados ni cambios ajenos.

## Convenciones de código

### Backend

- Java 21 y convenciones estándar de Spring Boot.
- Paquetes por dominio: `auth`, `users`, `incidents`, `categories`, `departments`, `audit` y `shared`.
- Controladores pequeños, servicios responsables de reglas de negocio y repositorios limitados al acceso a datos.
- Transiciones de estado mediante operaciones explícitas; nunca mediante una actualización genérica de `status`.
- Migraciones Flyway inmutables: crea una nueva migración para modificar un esquema ya compartido.

### Frontend

- TypeScript estricto y componentes funcionales.
- Código relacionado agrupado en `features/<feature>`.
- Componentes visuales sin llamadas `fetch` directas; utiliza la capa API de la feature.
- Reutiliza shadcn/ui antes de crear componentes base alternativos.
- Prueba comportamientos visibles, no detalles internos de implementación.

## Commits

Usa mensajes breves de estilo Conventional Commits:

```text
feat(auth): implement JWT login
feat(incidents): add incident creation
fix(incidents): reject invalid status transition
test(incidents): cover assignment permissions
docs(architecture): document authentication decision
```

## Checklist antes de entregar

```bash
cd backend && mvn test
cd frontend && npm test -- --run
cd frontend && npm run build
docker compose config
```

- Las pruebas relevantes pasan.
- La build del frontend termina correctamente.
- Los errores no exponen stack traces ni información sensible.
- No se registran passwords, JWT completos o secretos.
- Los cambios de base de datos incluyen una migración Flyway.
- README, guías o ADRs se han actualizado cuando corresponde.

## Decisiones arquitectónicas

Crea un ADR cuando una decisión sea difícil de revertir, afecte a varios módulos o cambie una restricción importante. Usa el siguiente formato corto:

```markdown
# ADR-NNN: Título

Status: Proposed | Accepted | Superseded

## Context
## Decision
## Consequences
```

