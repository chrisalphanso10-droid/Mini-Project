-- FixIt Now Migration 010: Add rating_status column to requests table
-- Allows tracking whether customer submitted a rating, skipped it, or has not yet reached rating

ALTER TABLE requests
ADD COLUMN IF NOT EXISTS rating_status VARCHAR(20) DEFAULT NULL
CHECK (rating_status IS NULL OR rating_status IN ('submitted', 'skipped'));
