# C4 — Contexto

```mermaid
C4Context
  title Contexto de Urban Pulse
  Person(citizen, "Ciudadano", "Reporta y consulta incidencias")
  Person(operator, "Operador", "Valida, prioriza y asigna")
  Person(technician, "Técnico", "Atiende y resuelve trabajos")
  System(urban_pulse, "Urban Pulse", "Gestiona el ciclo de vida auditable de incidencias urbanas")
  Rel(citizen, urban_pulse, "Usa")
  Rel(operator, urban_pulse, "Opera")
  Rel(technician, urban_pulse, "Actualiza trabajos")
```

