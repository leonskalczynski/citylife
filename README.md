# Citylife

Citylife es una plataforma universitaria para gestionar incidencias urbanas. Este repositorio contiene un monolito modular en Spring Boot, una SPA en React y PostgreSQL para desarrollo local.

## Estado actual

La Fase 1 deja preparada la infraestructura y una conexión mínima frontend/backend. Autenticación, incidencias y roles se implementarán de forma incremental en fases posteriores.

## Arquitectura

```text
React + TypeScript (localhost:5173)
                |
                | REST /api
                v
Spring Boot (localhost:8080)
                |
                | JPA + Flyway
                v
PostgreSQL (localhost:5432)
```

- `frontend/`: SPA React con Vite, Tailwind CSS, React Router y base de shadcn/ui.
- `backend/`: API REST Java 21 con Spring Boot.
- `docs/`: propuesta de arquitectura, modelo inicial y decisiones.
- `compose.yaml`: PostgreSQL local.

## Requisitos

- Node.js 20 o superior
- Java 21
- Maven 3.8 o superior
- Docker con Docker Compose

## Arranque local

1. Opcionalmente copia `.env.example` a `.env` y cambia las credenciales locales.
2. Levanta PostgreSQL:

   ```bash
   docker compose up -d postgres
   ```

3. Arranca el backend:

   ```bash
   cd backend
   mvn spring-boot:run
   ```

4. En otra terminal, arranca el frontend:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

Abre `http://localhost:5173`. La pantalla consulta `GET /api/system/status` y muestra si la API está disponible.

## Variables de entorno

Backend:

| Variable | Valor local por defecto |
| --- | --- |
| `DB_URL` | `jdbc:postgresql://localhost:5432/citylife` |
| `DB_USERNAME` | `citylife` |
| `DB_PASSWORD` | `citylife_local_password` |
| `CORS_ALLOWED_ORIGIN` | `http://localhost:5173` |

Frontend:

| Variable | Valor local por defecto |
| --- | --- |
| `VITE_API_URL` | vacío; Vite redirige `/api` a `http://localhost:8080` |

## Verificación

```bash
cd backend && mvn test
cd frontend && npm test -- --run
cd frontend && npm run build
```

Swagger UI estará disponible en `http://localhost:8080/swagger-ui` y el estado técnico de Spring Boot en `http://localhost:8080/actuator/health`.

Todavía no existen usuarios demo; se añadirán con autenticación en la Fase 2 para evitar credenciales o datos que no puedan utilizarse aún.

## Documentación

- [Propuesta técnica](docs/architecture/project-plan.md)
- [Contexto C4](docs/architecture/c4-context.md)
- [Contenedores C4](docs/architecture/c4-containers.md)
- [Decisiones arquitectónicas](docs/adr/)

