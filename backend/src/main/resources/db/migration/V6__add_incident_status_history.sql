CREATE TABLE incident_status_changes (
    id UUID PRIMARY KEY,
    incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    previous_status VARCHAR(30),
    new_status VARCHAR(30) NOT NULL,
    changed_by_id UUID NOT NULL REFERENCES users(id),
    reason VARCHAR(2000),
    changed_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX ix_status_changes_incident_time
    ON incident_status_changes (incident_id, changed_at);

INSERT INTO incident_status_changes (
    id,
    incident_id,
    previous_status,
    new_status,
    changed_by_id,
    reason,
    changed_at
)
SELECT
    id,
    id,
    NULL,
    status,
    created_by_id,
    'Historial inicial importado',
    created_at
FROM incidents;
