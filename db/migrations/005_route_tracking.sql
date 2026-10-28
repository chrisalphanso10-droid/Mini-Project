-- FixIt Now Migration 005: Route Geometry & Tracking Telemetry
-- Conforms to Google Routes API integration requirements

ALTER TABLE requests
ADD COLUMN IF NOT EXISTS route_geometry JSONB,
ADD COLUMN IF NOT EXISTS route_distance_km NUMERIC(8, 2),
ADD COLUMN IF NOT EXISTS speed_kmh NUMERIC(5, 2),
ADD COLUMN IF NOT EXISTS trip_started_at TIMESTAMP WITH TIME ZONE;
