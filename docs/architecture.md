# Arquitectura de Citylife

## Objetivos

La arquitectura busca que Citylife sea fácil de comprender, probar y ampliar durante un proyecto universitario. Se favorecen separación de responsabilidades, código explícito y evolución incremental.

Los requisitos arquitectónicos principales son:

- las reglas de negocio y permisos viven en el backend;
- la incidencia es la entidad central del sistema;
- las transiciones de estado son controladas y auditables;
- PostgreSQL es la fuente de datos persistentes;
- las fuentes externas enriquecen datos, pero no bloquean operaciones esenciales;
- ADMIN y ANALYST podrán añadirse sin convertir el MVP en un sistema distribuido.

## Vista de contenedores

```text
┌───────────────────────────────┐
│ Navegador                     │
│ React + TypeScript + Vite     │
└───────────────┬───────────────┘
                │ REST/JSON sobre /api
┌───────────────▼───────────────┐
│ API Spring Boot               │
│ Autorización y negocio        │
└───────────────┬───────────────┘
        ┌───────┴────────┐
        │                │
        │ JPA + Flyway   │ archivos
┌───────▼────────┐  ┌────▼──────────────┐
│ PostgreSQL     │  │ Almacenamiento    │
│ Metadatos      │  │ binario local     │
└────────────────┘  └───────────────────┘
```

Los diagramas C4 detallados están en [contexto](architecture/c4-context.md) y [contenedores](architecture/c4-containers.md).

## Backend: monolito modular

El backend es una sola aplicación y una sola unidad de despliegue. Sus paquetes se organizan por funcionalidad:

```text
com.citylife/
├── auth/              # Registro, login y tokens
├── users/             # Identidad, perfiles y roles
├── incidents/         # Incidencias y ciclo de vida
├── categories/        # Catálogo de categorías
├── departments/       # Departamentos y técnicos
├── audit/             # Historial visible y auditable
├── system/            # Estado técnico de la API
└── shared/            # Configuración y elementos realmente compartidos
```

Cada módulo añadirá controladores, servicios, repositorios, modelos y DTOs solo cuando sean necesarios. No se crearán subcapas vacías por uniformidad.

Responsabilidades:

- los controladores traducen HTTP a casos de uso y DTOs;
- los servicios aplican permisos, validaciones y reglas de negocio;
- los repositorios encapsulan consultas y persistencia;
- las entidades JPA representan el modelo persistente y no salen por la API;
- un manejador global producirá errores JSON consistentes.

## Frontend: SPA por funcionalidades

```text
src/
├── app/               # Router y configuración global
├── components/ui/     # Componentes base shadcn/ui
├── features/          # API, hooks, tipos y UI de cada dominio
├── pages/             # Composición de pantallas por ruta
├── lib/               # Infraestructura HTTP y utilidades
└── test/              # Configuración común de pruebas
```

Los componentes de presentación no conocen PostgreSQL ni contienen reglas sensibles. TanStack Query gestiona caché, estados de carga e invalidaciones para autenticación, categorías e incidencias; React Hook Form y Zod validan los formularios antes de enviarlos.

Los mapas se implementan como componentes compartidos con React Leaflet. OpenStreetMap suministra las teselas y la atribución se muestra en cada mapa. Las coordenadas forman parte del contrato de incidencia; la geolocalización del navegador solo se solicita por acción explícita y nunca es obligatoria para reportar.

## Modelo de dominio inicial

| Entidad | Responsabilidad |
| --- | --- |
| `User` | Identidad, credenciales y rol |
| `Incident` | Datos actuales y estado de una incidencia |
| `Category` | Clasificación gestionable |
| `Department` | Unidad responsable |
| `StatusChange` | Transición auditable con actor, fecha y motivo |
| `Attachment` | Metadatos de fotografías y archivos |

En la Fase 7 están materializados `User`, `Category`, `Department`, `Incident`, `IncidentStatusChange` y `Attachment`. PostgreSQL conserva metadatos e integridad referencial de los adjuntos; el contenido binario reside fuera de la base de datos. Una incidencia ciudadana siempre se crea en estado `REPORTED` y prioridad `NORMAL`; esos valores no forman parte del DTO de creación.

La asignación actual puede mantenerse en `Incident.assignedTo` durante el MVP. Una entidad `Assignment` separada se añadirá solo si aparece información o comportamiento propio que no pueda representarse mediante la incidencia y su historial.

## Ciclo de vida

```text
REPORTED → VALIDATED → ASSIGNED → IN_PROGRESS → RESOLVED → CLOSED
    └────→ REJECTED                    └──────→ REOPENED
```

El frontend solicita acciones concretas como validar, rechazar, asignar o resolver. El backend comprueba el rol, la propiedad o asignación y la transición permitida antes de modificar el estado. Cada transición se guarda en la misma transacción que el cambio de la incidencia, con estado anterior y nuevo, actor, fecha y motivo opcional.

## API y seguridad

- API REST JSON bajo `/api`.
- OpenAPI disponible durante desarrollo.
- DTOs y validación de entradas en los límites HTTP.
- JWT HMAC de vida corta y BCrypt para autenticación.
- El frontend conserva el access token en `sessionStorage`; no existen refresh tokens en el MVP actual.
- autorización por rol y por recurso en Spring Security.
- CORS limitado al origen configurado.
- la geolocalización requiere permiso del navegador y, fuera de `localhost`, un origen HTTPS;
- secretos y credenciales mediante variables de entorno.
- Flyway es la única fuente de cambios de esquema; Hibernate usa `ddl-auto: validate`.
- Los adjuntos se sirven solo tras autorizar el recurso; se aceptan firmas reales JPEG, PNG y WebP, con 5 MB por archivo y 10 archivos por incidencia.

## Calidad y pruebas

- pruebas unitarias de servicios para transiciones, permisos y reglas;
- pruebas MVC o de integración para contratos HTTP importantes;
- H2 para pruebas no específicas de PostgreSQL;
- PostgreSQL real o Testcontainers cuando el comportamiento dependa de PostgreSQL;
- Vitest y Testing Library para comportamiento visible del frontend.

## Decisiones y evolución

Las decisiones aceptadas se registran en el [índice de ADRs](adr/README.md). El alcance previsto y las fases se encuentran en el [plan técnico](architecture/project-plan.md).

