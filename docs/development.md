# Desarrollo local

## Requisitos

- Node.js 20 o superior y npm.
- Java 21.
- Maven 3.8 o superior.
- Docker con Docker Compose v2.

Comprueba las herramientas:

```bash
node --version
npm --version
java -version
mvn --version
docker compose version
```

## Preparación inicial

Desde la raíz del repositorio:

```bash
cp .env.example .env
cd frontend
npm install
```

El archivo `.env` raíz configura el contenedor PostgreSQL y no debe añadirse a Git. `frontend/.env.example` documenta las variables específicas de Vite.

## Ejecutar Citylife

### 1. PostgreSQL

```bash
docker compose up -d postgres
docker compose ps
```

### 2. Backend

En otra terminal:

```bash
cd backend
mvn spring-boot:run
```

El backend escucha en `http://localhost:8080`. Al arrancar, Flyway valida y aplica las migraciones pendientes.

### 3. Frontend

En otra terminal:

```bash
cd frontend
npm run dev
```

Abre `http://localhost:5173`. Vite redirige las peticiones `/api` a `http://localhost:8080` durante el desarrollo.

## URLs útiles

| URL | Uso |
| --- | --- |
| `http://localhost:5173` | Aplicación web |
| `http://localhost:8080/api/system/status` | Comprobación frontend/backend |
| `http://localhost:8080/actuator/health` | Salud técnica del backend |
| `http://localhost:8080/swagger-ui` | Interfaz OpenAPI |
| `http://localhost:8080/v3/api-docs` | Contrato OpenAPI JSON |

## Variables de entorno

### Docker Compose

| Variable | Valor local predeterminado |
| --- | --- |
| `POSTGRES_DB` | `citylife` |
| `POSTGRES_USER` | `citylife` |
| `POSTGRES_PASSWORD` | `citylife_local_password` |
| `POSTGRES_PORT` | `5432` |

### Backend

| Variable | Valor local predeterminado |
| --- | --- |
| `DB_URL` | `jdbc:postgresql://localhost:5432/citylife` |
| `DB_USERNAME` | `citylife` |
| `DB_PASSWORD` | `citylife_local_password` |
| `CORS_ALLOWED_ORIGIN` | `http://localhost:5173` |

### Frontend

| Variable | Valor local predeterminado |
| --- | --- |
| `VITE_API_URL` | Vacío; usa el proxy de Vite |

Si frontend y backend se sirven desde orígenes distintos sin el proxy, configura `VITE_API_URL` con la URL completa de la API y permite el origen del frontend mediante `CORS_ALLOWED_ORIGIN`.

## Pruebas y build

Backend:

```bash
cd backend
mvn test
```

Frontend:

```bash
cd frontend
npm test -- --run
npm run build
```

Validación de Compose:

```bash
docker compose config
```

## Migraciones

Las migraciones viven en `backend/src/main/resources/db/migration` y siguen el formato de Flyway:

```text
V2__create_users.sql
V3__create_incidents.sql
```

No edites una migración que ya se haya compartido o aplicado. Crea una migración nueva que transforme el esquema existente.

## Datos de desarrollo

La Fase 1 todavía no incluye autenticación ni datos demo. Los usuarios reproducibles se incorporarán en la Fase 2 y sus credenciales exclusivamente locales se documentarán aquí y en el README.

## Problemas habituales

### El puerto 5432 está ocupado

Cambia `POSTGRES_PORT` en `.env` y suministra `DB_URL` en la terminal donde arranques Spring Boot, por ejemplo:

```text
POSTGRES_PORT=5433
```

```bash
cd backend
DB_URL=jdbc:postgresql://localhost:5433/citylife mvn spring-boot:run
```

### El frontend muestra “API no disponible”

Comprueba `http://localhost:8080/api/system/status`, confirma que Spring Boot sigue en ejecución y revisa que `VITE_API_URL` no contenga una URL incorrecta.

### PostgreSQL no está listo

```bash
docker compose ps
docker compose logs postgres
```

### Detener el entorno

```bash
docker compose stop
```

El volumen se conserva. `docker compose down -v` elimina los datos locales y solo debe ejecutarse cuando se quiera reiniciar completamente la base de datos.

