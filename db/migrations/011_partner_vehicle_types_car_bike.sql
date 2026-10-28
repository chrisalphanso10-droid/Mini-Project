-- Migration 011: Restrict partner vehicle_type to bike_scooter and car
-- Conforms to FIX 3: replace CHECK constraint on partners.vehicle_type so it allows only bike_scooter and car

ALTER TABLE partners DROP CONSTRAINT IF EXISTS partners_vehicle_type_check;
ALTER TABLE partners ADD CONSTRAINT partners_vehicle_type_check CHECK (vehicle_type IN ('bike_scooter', 'car'));
