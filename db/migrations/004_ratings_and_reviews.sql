-- Migration 004: Ratings and Reviews (SRS FR-C17, FR-P11, FR-A2)
-- Adds review_line and feedback columns to ratings table.
-- Drops default 5.00 on partners.rating so new partners default to NULL.

ALTER TABLE ratings ADD COLUMN IF NOT EXISTS review_line VARCHAR(255);
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS feedback TEXT;

-- Drop default 5.00 rating on partners table so unrated partners have NULL rating
ALTER TABLE partners ALTER COLUMN rating DROP DEFAULT;
