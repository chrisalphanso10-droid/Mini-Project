-- FixIt Now Migration 006: Partner Session Version
-- Invalidate stale partner tokens and sockets on logout

ALTER TABLE partners
ADD COLUMN IF NOT EXISTS session_version INT NOT NULL DEFAULT 0;
