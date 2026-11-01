# ADR-004: JWT para la SPA

Status: Accepted

## Context

La futura SPA necesita autenticarse contra una API REST y aplicar autorización por rol en el servidor.

## Decision

Usar access tokens JWT HMAC de 15 minutos y contraseñas con BCrypt. El frontend conserva el token en `sessionStorage`, nunca en `localStorage`, y lo elimina al cerrar sesión. El MVP no incluye refresh tokens; al expirar el token el usuario vuelve a autenticarse.

## Consequences

El backend verifica firma, expiración y rol en cada petición protegida y sigue siendo la fuente de verdad de permisos. `sessionStorage` reduce la persistencia del token, pero no elimina el riesgo de XSS; la aplicación debe evitar HTML no confiable y mantener dependencias auditadas. Si se necesita una sesión larga, se evaluará un refresh token en cookie `HttpOnly` mediante un ADR posterior.

