CREATE TABLE departments (
    id UUID PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(120) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO departments (id, code, name) VALUES
    ('81111111-1111-4111-8111-111111111111', 'PUBLIC_WORKS', 'Obras y vía pública'),
    ('82222222-2222-4222-8222-222222222222', 'ENVIRONMENT', 'Medio ambiente y limpieza'),
    ('83333333-3333-4333-8333-333333333333', 'MOBILITY', 'Movilidad y señalización'),
    ('84444444-4444-4444-8444-444444444444', 'URBAN_SERVICES', 'Servicios urbanos');

ALTER TABLE incidents
    ADD COLUMN department_id UUID REFERENCES departments(id),
    ADD COLUMN assigned_to_id UUID REFERENCES users(id),
    ADD COLUMN rejection_reason VARCHAR(500);

CREATE INDEX ix_incidents_status_created_at ON incidents (status, created_at DESC);
CREATE INDEX ix_incidents_priority ON incidents (priority);
CREATE INDEX ix_incidents_department ON incidents (department_id);
CREATE INDEX ix_incidents_assigned_to ON incidents (assigned_to_id);
