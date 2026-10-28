-- Migration 008: Partner Vehicle Type and Request Frozen Vehicle Type
-- Conforms to Change 4:
-- Add vehicle_type to partners with CHECK constraint ('auto', 'bike_scooter', 'car')
-- Keep existing vehicle column untouched.
-- Add vehicle_type to requests to freeze vehicle type at accept time.

ALTER TABLE partners ADD COLUMN IF NOT EXISTS vehicle_type TEXT CHECK (vehicle_type IN ('auto', 'bike_scooter', 'car'));
ALTER TABLE requests ADD COLUMN IF NOT EXISTS vehicle_type TEXT;
