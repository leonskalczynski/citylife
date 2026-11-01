CREATE TABLE attachments (
    id UUID PRIMARY KEY,
    incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    uploaded_by_id UUID NOT NULL REFERENCES users(id),
    original_file_name VARCHAR(255) NOT NULL,
    stored_file_name VARCHAR(100) NOT NULL UNIQUE,
    content_type VARCHAR(50) NOT NULL,
    size_bytes BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT ck_attachments_size CHECK (size_bytes > 0 AND size_bytes <= 5242880)
);

CREATE INDEX ix_attachments_incident_created_at
    ON attachments (incident_id, created_at);
