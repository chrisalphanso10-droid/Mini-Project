-- Migration 009: Add 'others' option to partner vehicle_type CHECK constraint
-- Conforms to Fix 2: Drop existing partners_vehicle_type_check and re-add with ('auto', 'bike_scooter', 'car', 'others')

ALTER TABLE partners DROP CONSTRAINT IF EXISTS partners_vehicle_type_check;
ALTER TABLE partners ADD CONSTRAINT partners_vehicle_type_check CHECK (vehicle_type IN ('auto', 'bike_scooter', 'car', 'others'));
