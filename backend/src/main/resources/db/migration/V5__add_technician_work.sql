ALTER TABLE incidents
    ADD COLUMN technician_notes VARCHAR(2000),
    ADD COLUMN resolution_summary VARCHAR(2000),
    ADD COLUMN resolved_at TIMESTAMPTZ;

CREATE INDEX ix_incidents_assigned_to_updated_at ON incidents (assigned_to_id, updated_at DESC);
