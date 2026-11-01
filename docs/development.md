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
set -a
source .env
set +a
cd frontend
npm install
```

El archivo `.env` raíz configura PostgreSQL y las variables del backend; no debe añadirse a Git. El comando `source` exporta esas variables a la terminal actual. `frontend/.env.example` documenta las variables específicas de Vite.

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
mvn spring-boot:run -Dspring-boot.run.profiles=local
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
| `CORS_ALLOWED_ORIGINS` | Lista separada por comas; `localhost` y `127.0.0.1` en local |
| `JWT_SECRET_BASE64` | Obligatoria; secreto HMAC codificado en Base64 |
| `JWT_TTL` | `15m` en `.env.example` |
| `DEMO_USER_PASSWORD` | Contraseña común para usuarios demo del perfil `local` |
| `ATTACHMENT_STORAGE_PATH` | Directorio de binarios; `./data/attachments` respecto al backend por defecto |

### Frontend

| Variable | Valor local predeterminado |
| --- | --- |
| `VITE_API_URL` | Vacío; usa el proxy de Vite |

Si frontend y backend se sirven desde orígenes distintos sin el proxy, configura `VITE_API_URL` con la URL completa de la API y permite el origen del frontend mediante `CORS_ALLOWED_ORIGINS`.

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

El perfil `local` crea estos usuarios si todavía no existen:

| Rol | Email |
| --- | --- |
| `CITIZEN` | `citizen@example.com` |
| `OPERATOR` | `operator@example.com` |
| `TECHNICIAN` | `technician@example.com` |
| `ADMIN` | `admin@example.com` |

La contraseña es el valor de `DEMO_USER_PASSWORD`. El inicializador no se ejecuta sin el perfil `local` y nunca reemplaza cuentas existentes.

También se crean siete categorías y, si `citizen@example.com` no tiene avisos, tres incidencias reportadas y una asignada al técnico demo. Los inicializadores son idempotentes y solo se ejecutan con el perfil `local`.

Flyway crea cuatro departamentos de desarrollo. El usuario `operator@example.com` puede revisar las incidencias demo y asignarlas a `technician@example.com`.

## Autenticación local

- `POST /api/auth/register` crea únicamente cuentas `CITIZEN`.
- `POST /api/auth/login` devuelve un access token JWT de corta duración.
- `GET /api/users/me` devuelve la identidad autenticada.
- El frontend conserva el token en `sessionStorage` y lo elimina al cerrar sesión.
- El backend verifica firma, expiración y rol en cada petición protegida.

## Flujo ciudadano

- `/incidents/new` permite crear una incidencia con categoría, descripción y ubicación opcional.
- `/my-incidents` lista exclusivamente las incidencias del usuario autenticado.
- `/incidents/:id` muestra el detalle y el estado actual.
- `POST /api/incidents` solo acepta usuarios `CITIZEN` y siempre establece `REPORTED` y `NORMAL` en el backend.
- El acceso a una incidencia ajena responde `404` para no revelar su existencia.

## Flujo de operación

- `/operations/incidents` ofrece búsqueda, filtros y paginación ejecutados por el backend.
- `/operations/incidents/:id` permite revisar el detalle y ejecutar comandos autorizados.
- Solo `OPERATOR` puede acceder a `/api/operations/**`, `/api/departments` y `/api/technicians`.
- La validación y el rechazo solo parten de `REPORTED`; la asignación parte de `VALIDATED` o actualiza una incidencia `ASSIGNED`.
- El rechazo exige un motivo y la asignación exige un departamento; el técnico es opcional.

## Flujo técnico

- `/work` lista exclusivamente las incidencias asignadas al técnico autenticado.
- `/work/:id` permite iniciar la intervención, guardar notas y documentar la resolución.
- Solo `TECHNICIAN` puede acceder a `/api/work/**`; además, cada consulta y comando comprueba la asignación concreta.
- `start` solo permite `ASSIGNED → IN_PROGRESS` y `resolve` solo permite `IN_PROGRESS → RESOLVED`.
- La resolución exige un resumen y registra la fecha de finalización.

## Historial auditable

- Cada creación o transición de estado genera un registro en `incident_status_changes` dentro de la misma transacción.
- El registro conserva estado anterior, estado nuevo, actor, fecha y motivo opcional.
- Ciudadanía consulta solo el historial de sus incidencias; técnicos, solo el de sus trabajos asignados; operación puede consultar cualquier incidencia.
- Los endpoints de historial nunca exponen el email del actor, únicamente su nombre visible y rol.
- Las timelines se actualizan después de cada comando de estado mediante invalidación de TanStack Query.

## Adjuntos y evidencias

- Ciudadanía puede listar y subir imágenes únicamente en incidencias propias.
- Técnicos pueden listar y subir evidencias únicamente en trabajos asignados; operación puede consultar cualquier incidencia.
- El endpoint de contenido vuelve a comprobar permisos y nunca expone una ruta del sistema de archivos.
- Se aceptan JPEG, PNG y WebP mediante su firma binaria, no por la extensión o el `Content-Type` enviado.
- Cada archivo admite hasta 5 MB y cada incidencia hasta 10 adjuntos.
- El almacenamiento local predeterminado es `backend/data/attachments`, ignorado por Git. Para pruebas se usa `backend/target/test-attachments`.

## Problemas habituales

### El puerto 5432 está ocupado

Cambia `POSTGRES_PORT` en `.env` y suministra `DB_URL` en la terminal donde arranques Spring Boot, por ejemplo:

```text
POSTGRES_PORT=5433
```

```bash
cd backend
DB_URL=jdbc:postgresql://localhost:5433/citylife mvn spring-boot:run -Dspring-boot.run.profiles=local
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

