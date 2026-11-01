# ADR-006: Leaflet y OpenStreetMap para mapas

Status: Accepted

## Context

Citylife necesita seleccionar y visualizar coordenadas sin convertir la geolocalización en un requisito ni depender de una API propietaria con credenciales durante el MVP.

## Decision

Usar React Leaflet como integración cartográfica y teselas de OpenStreetMap con atribución visible. El navegador solicita la ubicación únicamente cuando la persona pulsa el botón correspondiente. El mapa también admite selección manual y el backend continúa validando los rangos de latitud y longitud.

## Consequences

El desarrollo local no necesita claves externas y el mapa queda encapsulado en componentes reutilizables. Los despliegues públicos requieren HTTPS para geolocalización, una política de privacidad adecuada y revisar la política de uso del servidor de teselas; si el volumen crece, se contratará un proveedor o servicio propio sin cambiar el modelo de dominio.
