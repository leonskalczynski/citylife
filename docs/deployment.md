# Despliegue

## Estado actual

Citylife está en la Fase 1 y está preparado para ejecutarse en desarrollo local. Todavía no existe una configuración de producción, una imagen del backend ni un pipeline de entrega continua. Este documento separa el procedimiento disponible hoy de la estrategia prevista para evitar presentar como operativo algo que aún no lo es.

## Despliegue local actual

1. Configura `.env` a partir de `.env.example`.
2. Levanta PostgreSQL con `docker compose up -d postgres`.
3. Arranca la API con `cd backend && mvn spring-boot:run`.
4. Arranca la SPA con `cd frontend && npm install && npm run dev`.

Este modo usa servidores de desarrollo y no debe exponerse directamente a Internet.

## Artefactos verificables

Backend:

```bash
cd backend
mvn clean package
java -jar target/citylife-api-0.1.0-SNAPSHOT.jar
```

Frontend:

```bash
cd frontend
npm ci
npm run build
```

La salida estática del frontend se genera en `frontend/dist`.

## Configuración requerida

En un entorno no local no deben usarse los valores predeterminados de desarrollo.

| Variable | Requisito |
| --- | --- |
| `DB_URL` | URL JDBC de PostgreSQL del entorno |
| `DB_USERNAME` | Usuario con privilegios mínimos necesarios |
| `DB_PASSWORD` | Secreto gestionado fuera del repositorio |
| `CORS_ALLOWED_ORIGINS` | Orígenes HTTPS exactos del frontend, separados por comas |
| `VITE_API_URL` | URL pública de la API usada durante la build |
| `JWT_SECRET_BASE64` | Secreto Base64 de al menos 32 bytes, único por entorno |
| `JWT_TTL` | Duración del access token, por ejemplo `15m` |

Las futuras claves JWT u otros secretos deberán suministrarse mediante el gestor de secretos de la plataforma, nunca mediante archivos versionados.

## Estrategia de producción prevista

La opción inicial más sencilla será:

- frontend estático servido por un hosting o servidor web con HTTPS;
- una instancia de la aplicación Spring Boot;
- PostgreSQL administrado o con copias de seguridad externas;
- migraciones Flyway ejecutadas por la aplicación durante un despliegue controlado;
- logs de aplicación enviados a la salida estándar;
- health check contra `/actuator/health`.

No se requieren microservicios, Kubernetes ni mensajería distribuida para el MVP.

## Secuencia de despliegue futura

1. Ejecutar pruebas de backend y frontend.
2. Construir artefactos reproducibles.
3. Crear o verificar una copia de seguridad antes de migraciones destructivas.
4. Configurar secretos y variables del entorno.
5. Desplegar la API y aplicar migraciones Flyway.
6. Verificar `/actuator/health` y una operación de lectura.
7. Desplegar el frontend con la URL correcta de la API.
8. Ejecutar una comprobación funcional del flujo principal.

## Criterios antes del primer despliegue público

- autenticación y autorización implementadas y probadas;
- secretos de desarrollo eliminados del entorno productivo;
- HTTPS habilitado;
- política de copias de seguridad y restauración verificada;
- límites de tamaño y tipo de archivos configurados;
- logs sin credenciales, JWT ni información sensible innecesaria;
- CORS restringido al frontend real;
- errores sin stack traces públicos;
- estrategia documentada de rollback de aplicación y base de datos.

La plataforma concreta y el pipeline se decidirán mediante un ADR cuando existan requisitos reales de hosting, presupuesto y operación.

