-- Additive preview migration. Provisional association grants no document access.
BEGIN;
ALTER TABLE finance_mail_documents ADD COLUMN IF NOT EXISTS provisional_user_id uuid REFERENCES users(id);
ALTER TABLE finance_mail_documents ADD COLUMN IF NOT EXISTS suggested_kind text;
ALTER TABLE finance_mail_documents ADD COLUMN IF NOT EXISTS association_status text NOT NULL DEFAULT 'Por identificar';
ALTER TABLE finance_mail_documents ADD COLUMN IF NOT EXISTS association_basis jsonb NOT NULL DEFAULT '{}';
ALTER TABLE finance_mail_documents ADD COLUMN IF NOT EXISTS email_context jsonb NOT NULL DEFAULT '{}';
ALTER TABLE finance_mail_documents ADD COLUMN IF NOT EXISTS association_approved_at timestamptz;
ALTER TABLE finance_mail_documents ADD COLUMN IF NOT EXISTS association_approved_by uuid REFERENCES users(id);
CREATE TABLE IF NOT EXISTS finance_email_alerts(id text PRIMARY KEY,source_key text NOT NULL UNIQUE,context jsonb NOT NULL,error_code text NOT NULL,status text NOT NULL DEFAULT 'Pendente',attempts integer NOT NULL DEFAULT 1,created_at timestamptz NOT NULL,updated_at timestamptz NOT NULL,resolved_at timestamptz,resolved_by uuid REFERENCES users(id),resolution_kind text,reason text,revision integer NOT NULL DEFAULT 0);
CREATE INDEX IF NOT EXISTS finance_email_alerts_pending ON finance_email_alerts(status,updated_at);
COMMIT;
