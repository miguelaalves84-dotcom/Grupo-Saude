-- Additive, preview-only. No data deletion or historical rewrite.
BEGIN;
CREATE TABLE IF NOT EXISTS gmail_oauth_connections (
 function_id text PRIMARY KEY, address text NOT NULL, encrypted_tokens text NOT NULL,
 granted_scopes text NOT NULL, status text NOT NULL DEFAULT 'Ligada', revision integer NOT NULL DEFAULT 0,
 connected_by uuid REFERENCES users(id), connected_at timestamptz NOT NULL, updated_at timestamptz NOT NULL
);
CREATE TABLE IF NOT EXISTS gmail_oauth_states (
 state_hash text PRIMARY KEY, actor_id uuid NOT NULL REFERENCES users(id), cookie_hash text NOT NULL,
 function_id text NOT NULL, address text NOT NULL, origin text NOT NULL, encrypted_verifier text NOT NULL,
 expires_at timestamptz NOT NULL, consumed_at timestamptz
);
CREATE TABLE IF NOT EXISTS gmail_sync_state (
 function_id text PRIMARY KEY, address text NOT NULL, checkpoint jsonb NOT NULL DEFAULT '{}',
 lease_id text, lease_until timestamptz, last_sync_at timestamptz, last_error text, updated_at timestamptz NOT NULL
);
CREATE TABLE IF NOT EXISTS gmail_sync_messages (
 function_id text NOT NULL, address text NOT NULL, message_id text NOT NULL,
 status text NOT NULL DEFAULT 'Pendente', attempts integer NOT NULL DEFAULT 0, next_retry_at timestamptz,
 context jsonb NOT NULL DEFAULT '{}', last_error text, discovered_at timestamptz NOT NULL, processed_at timestamptz,
 PRIMARY KEY(function_id,address,message_id)
);
CREATE INDEX IF NOT EXISTS gmail_sync_retry ON gmail_sync_messages(function_id,address,status,next_retry_at);
ALTER TABLE finance_mail_documents ADD COLUMN IF NOT EXISTS function_id text NOT NULL DEFAULT 'payslips';
ALTER TABLE finance_mail_documents ADD COLUMN IF NOT EXISTS rejection_reason text;
ALTER TABLE finance_mail_documents ADD COLUMN IF NOT EXISTS decided_at timestamptz;
ALTER TABLE finance_mail_documents ADD COLUMN IF NOT EXISTS decided_by uuid REFERENCES users(id);
CREATE TABLE IF NOT EXISTS document_storage_backups (
 document_key text PRIMARY KEY, backup_key text NOT NULL, content_hash text NOT NULL,
 status text NOT NULL, checked_at timestamptz NOT NULL
);
CREATE TABLE IF NOT EXISTS gmail_automation_runs (
 id text PRIMARY KEY, actor_id uuid REFERENCES users(id), started_at timestamptz NOT NULL,
 completed_at timestamptz, status text NOT NULL, result jsonb NOT NULL DEFAULT '{}'
);
ALTER TABLE finance_archive_dispatch ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'resend';
CREATE TABLE IF NOT EXISTS gmail_auth_limits(key text PRIMARY KEY,attempts integer NOT NULL,expires_at timestamptz NOT NULL);
CREATE TABLE IF NOT EXISTS gmail_candidate_identities(email text PRIMARY KEY,candidate_id uuid NOT NULL REFERENCES candidates(id));
COMMIT;
