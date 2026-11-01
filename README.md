# Citylife

Citylife es una plataforma para gestionar incidencias urbanas de principio a fin. Su objetivo es conectar a ciudadanía, operadores municipales y equipos técnicos mediante un flujo claro, seguro y auditable.

Una persona podrá reportar problemas como alumbrado averiado, árboles caídos, limpieza, contenedores o daños en la vía pública. Los operadores validarán y asignarán las incidencias, y los técnicos documentarán su intervención y resolución.

## Características principales

El MVP se desarrollará de forma incremental e incluirá:

- registro, inicio de sesión y autorización por roles;
- creación y consulta de incidencias por la ciudadanía;
- validación, rechazo, prioridad y asignación por operadores;
- gestión de trabajos asignados por técnicos;
- transiciones de estado controladas por el backend;
- historial auditable de cada cambio;
- fotografías y otros archivos asociados;
- filtros, paginación, mapa y métricas básicas.

Las Fases 1 a 6 están implementadas: infraestructura local, autenticación JWT, flujos de ciudadanía, operación y trabajo técnico, además de un historial auditable. Cada transición guarda estado anterior y nuevo, actor, fecha y motivo cuando corresponde; los tres perfiles pueden consultar una timeline adaptada a sus permisos.

## Tecnologías y propósito

| Tecnología | Uso en Citylife |
| --- | --- |
| React + TypeScript | Interfaz web tipada y organizada por funcionalidad |
| Vite | Servidor de desarrollo y build del frontend |
| Tailwind CSS + shadcn/ui | Estilos y componentes accesibles y reutilizables |
| React Router | Navegación de la SPA |
| Spring Boot + Java 21 | API REST y reglas de negocio |
| Spring Data JPA | Acceso a datos relacionales |
| Spring Security | Autenticación y autorización por roles |
| PostgreSQL | Persistencia transaccional y auditable |
| Flyway | Migraciones versionadas de la base de datos |
| OpenAPI | Documentación y exploración de la API |
| Docker Compose | PostgreSQL reproducible en desarrollo local |
| JUnit, Vitest y Testing Library | Pruebas de comportamiento de backend y frontend |

## Arquitectura resumida

```text
React + TypeScript
        |
        | REST/JSON
        v
Spring Boot
        |
        | JPA + Flyway
        v
PostgreSQL
```

Citylife es un monolito modular: mantiene una única aplicación backend desplegable, pero separa el código por funcionalidades. React nunca accede directamente a PostgreSQL y el backend es la fuente de verdad para permisos, validaciones y cambios de estado.

## Inicio rápido

Requisitos: Node.js 20+, Java 21, Maven 3.8+ y Docker Compose.

```bash
cp .env.example .env
set -a
source .env
set +a

docker compose up -d postgres

cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=local

# En otra terminal
cd frontend
npm install
npm run dev
```

Abre `http://localhost:5173`. Consulta la guía de desarrollo para configurar variables, ejecutar pruebas y resolver problemas habituales.

Usuarios demo del perfil `local`:

| Rol | Email |
| --- | --- |
| Ciudadanía | `citizen@example.com` |
| Operación | `operator@example.com` |
| Técnico | `technician@example.com` |
| Administración | `admin@example.com` |

Todos usan la contraseña configurada en `DEMO_USER_PASSWORD`; `.env.example` contiene únicamente un valor de desarrollo que debe cambiarse fuera del entorno local.

El perfil `local` también crea categorías urbanas, tres incidencias reportadas y un trabajo asignado a `technician@example.com` cuando el ciudadano demo todavía no tiene avisos.

## API implementada

| Método y ruta | Uso |
| --- | --- |
| `POST /api/auth/register` | Registrar una cuenta ciudadana |
| `POST /api/auth/login` | Iniciar sesión y obtener un JWT |
| `GET /api/users/me` | Consultar el usuario autenticado |
| `GET /api/categories` | Listar categorías activas |
| `POST /api/incidents` | Reportar una incidencia como ciudadano |
| `GET /api/incidents/my` | Listar las incidencias propias |
| `GET /api/incidents/{id}` | Consultar una incidencia propia |
| `GET /api/operations/incidents` | Buscar y filtrar incidencias como operador |
| `GET /api/operations/incidents/{id}` | Consultar el detalle operativo |
| `POST /api/operations/incidents/{id}/validate` | Validar una incidencia reportada |
| `POST /api/operations/incidents/{id}/reject` | Rechazar indicando un motivo |
| `POST /api/operations/incidents/{id}/priority` | Establecer prioridad |
| `POST /api/operations/incidents/{id}/assign` | Asignar departamento y técnico opcional |
| `GET /api/departments` | Consultar departamentos activos |
| `GET /api/technicians` | Consultar técnicos disponibles |
| `GET /api/work/incidents` | Listar los trabajos del técnico autenticado |
| `GET /api/work/incidents/{id}` | Consultar un trabajo propio |
| `POST /api/work/incidents/{id}/start` | Iniciar una intervención asignada |
| `PUT /api/work/incidents/{id}/notes` | Documentar la intervención |
| `POST /api/work/incidents/{id}/resolve` | Resolver con un resumen obligatorio |
| `GET /api/incidents/{id}/history` | Consultar el historial de una incidencia propia |
| `GET /api/operations/incidents/{id}/history` | Consultar el historial como operador |
| `GET /api/work/incidents/{id}/history` | Consultar el historial de un trabajo asignado |

## Documentación

- [Arquitectura](docs/architecture.md)
- [Desarrollo local](docs/development.md)
- [Despliegue](docs/deployment.md)
- [Cómo contribuir](CONTRIBUTING.md)
- [Registro de decisiones arquitectónicas](docs/adr/README.md)
- [Plan incremental del proyecto](docs/architecture/project-plan.md)

Durante el desarrollo, Swagger UI está disponible en `http://localhost:8080/swagger-ui` y el estado de la aplicación en `http://localhost:8080/actuator/health`.

