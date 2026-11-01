CREATE TABLE categories (
    id UUID PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO categories (id, code, name) VALUES
    ('11111111-1111-1111-1111-111111111111', 'LIGHTING', 'Alumbrado'),
    ('22222222-2222-2222-2222-222222222222', 'CLEANING', 'Limpieza'),
    ('33333333-3333-3333-3333-333333333333', 'ROADS', 'Vía pública'),
    ('44444444-4444-4444-4444-444444444444', 'URBAN_FURNITURE', 'Mobiliario urbano'),
    ('55555555-5555-5555-5555-555555555555', 'GREEN_AREAS', 'Arbolado y zonas verdes'),
    ('66666666-6666-6666-6666-666666666666', 'WASTE', 'Contenedores y residuos'),
    ('77777777-7777-7777-7777-777777777777', 'TRAFFIC_LIGHTS', 'Semáforos');

CREATE TABLE incidents (
    id UUID PRIMARY KEY,
    title VARCHAR(120) NOT NULL,
    description VARCHAR(2000) NOT NULL,
    category_id UUID NOT NULL REFERENCES categories(id),
    status VARCHAR(30) NOT NULL,
    priority VARCHAR(20) NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    address VARCHAR(200),
    district VARCHAR(100),
    created_by_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT ck_incidents_location_pair CHECK (
        (latitude IS NULL AND longitude IS NULL)
        OR (latitude IS NOT NULL AND longitude IS NOT NULL)
    ),
    CONSTRAINT ck_incidents_latitude CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
    CONSTRAINT ck_incidents_longitude CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180)
);

CREATE INDEX ix_incidents_created_by_created_at ON incidents (created_by_id, created_at DESC);
CREATE INDEX ix_incidents_category ON incidents (category_id);
