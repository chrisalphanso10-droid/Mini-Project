-- FixIt Now Migration 007: Allow 'completed' status in requests check constraint
-- Conforms to terminal state requirements: 'completed' and 'payment_completed'

ALTER TABLE requests DROP CONSTRAINT IF EXISTS requests_status_check;
ALTER TABLE requests ADD CONSTRAINT requests_status_check CHECK (
    status IN (
        'requested',
        'searching',
        'accepted',
        'partner_on_way',
        'partner_arrived',
        'service_started',
        'service_completed',
        'payment_completed',
        'completed',
        'cancelled'
    )
);
