# Propuesta técnica de Citylife

## Estructura del proyecto

```text
citylife/
├── backend/                 # Spring Boot, organizado por funcionalidad
├── frontend/                # React, organizado por feature
├── docs/
│   ├── architecture/        # Vista general y diagramas
│   └── adr/                 # Decisiones breves
└── compose.yaml             # Servicios locales
```

El backend será un monolito modular. Cada funcionalidad contendrá sus controladores, servicios, repositorios, modelos y DTOs cuando los necesite; no se crearán capas vacías por anticipado.

Módulos previstos: `auth`, `users`, `incidents`, `categories`, `departments`, `assignments`, `audit` y `shared`. `notifications` se añadirá cuando exista un caso de uso concreto.

## Modelo inicial de base de datos

El modelo se implementará con las funcionalidades que lo necesiten, no en la fase de infraestructura.

| Tabla | Responsabilidad | Relaciones principales |
| --- | --- | --- |
| `users` | Identidad, credenciales y rol | creador/técnico de incidencias |
| `categories` | Clasificación de incidencias | muchas incidencias |
| `departments` | Unidad responsable | muchas incidencias y técnicos |
| `incidents` | Núcleo del sistema | creador, categoría, departamento, técnico |
| `incident_status_changes` | Historial auditable | incidencia y usuario responsable |
| `attachments` | Metadatos de archivos | incidencia y usuario |

Para el MVP, la asignación actual puede vivir en `incidents.assigned_to_id`. Se añadirá una tabla `assignments` solo si se necesita conservar historial específico distinto del historial de estado.

Enums iniciales: `Role`, `IncidentStatus` y `Priority`. Las relaciones de negocio se normalizan con claves foráneas; los valores auditables se conservarán aunque cambie la asignación actual.

## Rutas principales del frontend

| Ruta | Audiencia | Fase |
| --- | --- | --- |
| `/` | Pública | 1 |
| `/login`, `/register` | Pública | 2 |
| `/incidents/new`, `/my-incidents`, `/incidents/:id` | Ciudadanía | 3 |
| `/operations/incidents`, `/operations/incidents/:id` | Operador | 4 |
| `/work`, `/work/:id` | Técnico | 5 |

Las áreas de administración y analítica quedan fuera del MVP inicial.

## API REST del MVP

- Autenticación: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/users/me`.
- Incidencias ciudadanas: `POST /api/incidents`, `GET /api/incidents/my`, `GET /api/incidents/{id}`.
- Operación: `GET /api/incidents` con paginación/filtros y comandos `validate`, `reject`, `priority`, `assign`.
- Trabajo técnico: `GET /api/work/incidents` y comandos `start`, `notes`, `resolve`.
- Auditoría: `GET /api/incidents/{id}/history`.
- Catálogos: `GET /api/categories`, `GET /api/departments`, `GET /api/technicians`.

Los cambios de estado serán comandos explícitos, validados en servicios del backend. Un `PUT` general nunca podrá cambiar arbitrariamente el estado.

## Orden de implementación

1. Infraestructura local y comunicación base (completada).
2. Autenticación JWT, roles y usuario actual (completada).
3. Flujo ciudadano mínimo (completada).
4. Operación: listado, filtros, validación, rechazo y asignación (completada).
5. Trabajo técnico y resolución (completada).
6. Historial auditable y timeline (siguiente).
7. Adjuntos con límites de tipo y tamaño.
8. Mapa y geolocalización.
9. Dashboard básico.

## Fuera del MVP

Administración completa, analítica avanzada, geocodificación automática, datos meteorológicos o de tráfico, activos urbanos, detección de duplicados, clasificación con IA, RAG, hotspots e informes exportables. Se integrarán detrás de servicios propios y nunca bloquearán la creación de una incidencia.

