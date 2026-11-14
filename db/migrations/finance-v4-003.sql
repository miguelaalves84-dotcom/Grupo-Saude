-- Additive preview migration. No historical payments are queued or rewritten.
BEGIN;
CREATE TABLE IF NOT EXISTS finance_payment_mail (
 id text PRIMARY KEY,
 payment_id uuid NOT NULL UNIQUE REFERENCES current_account_entries(id),
 user_id uuid NOT NULL REFERENCES users(id),
 recipient text NOT NULL,
 payload jsonb NOT NULL,
 status text NOT NULL DEFAULT 'Queued',
 created_at timestamptz NOT NULL,
 first_attempt_at timestamptz,
 attempt_token text,
 provider_id text,
 sent_at timestamptz,
 error_code text,
 attempts integer NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS finance_payment_mail_queue ON finance_payment_mail(status,created_at);
CREATE TABLE IF NOT EXISTS finance_attention_read (
 user_id uuid NOT NULL REFERENCES users(id),
 event_id text NOT NULL,
 read_at timestamptz NOT NULL,
 resolved_at timestamptz,
 PRIMARY KEY(user_id,event_id)
);
COMMIT;
