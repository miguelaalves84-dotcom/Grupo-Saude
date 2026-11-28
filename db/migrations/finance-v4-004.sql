-- Preview only. Existing files, amounts, payments and audit records are retained.
BEGIN;
ALTER TABLE finance_invoices DROP CONSTRAINT IF EXISTS finance_invoices_issuer_key_number_series_key;
ALTER TABLE finance_invoices DROP CONSTRAINT IF EXISTS finance_invoices_status_check;
ALTER TABLE finance_invoices ADD CONSTRAINT finance_invoices_status_check CHECK(status IN ('Pendente','Validada','Recusada','Substituído'));
ALTER TABLE finance_payslips DROP CONSTRAINT IF EXISTS finance_payslips_status_check;
ALTER TABLE finance_payslips ADD CONSTRAINT finance_payslips_status_check CHECK(status IN ('Pendente','Validada','Recusada','Substituído'));
ALTER TABLE finance_invoices ADD COLUMN IF NOT EXISTS file_hash text;
ALTER TABLE finance_invoices ADD COLUMN IF NOT EXISTS replacement_of text REFERENCES finance_invoices(id);
ALTER TABLE finance_invoices ADD COLUMN IF NOT EXISTS replacement_revision integer;
ALTER TABLE finance_invoices ADD COLUMN IF NOT EXISTS replacement_reason text;
ALTER TABLE finance_invoices ADD COLUMN IF NOT EXISTS replaced_by text;
ALTER TABLE finance_payslips ADD COLUMN IF NOT EXISTS replacement_of text REFERENCES finance_payslips(id);
ALTER TABLE finance_payslips ADD COLUMN IF NOT EXISTS replacement_revision integer;
ALTER TABLE finance_payslips ADD COLUMN IF NOT EXISTS replacement_reason text;
ALTER TABLE finance_payslips ADD COLUMN IF NOT EXISTS replaced_by text;
ALTER TABLE finance_payslips ADD COLUMN IF NOT EXISTS value_cents bigint;
ALTER TABLE finance_payslips ADD COLUMN IF NOT EXISTS number text;
-- Every chain has a single active identity. Pending replacements don't consume that identity until approved.
CREATE UNIQUE INDEX IF NOT EXISTS finance_invoices_active_identity ON finance_invoices(issuer_key,number,series) WHERE status <> 'Substituído' AND (replacement_of IS NULL OR status='Validada');
CREATE UNIQUE INDEX IF NOT EXISTS finance_invoice_pending_replacement ON finance_invoices(replacement_of) WHERE status='Pendente' AND replacement_of IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS finance_receipt_pending_replacement ON finance_payslips(replacement_of) WHERE status='Pendente' AND replacement_of IS NOT NULL;
CREATE TABLE IF NOT EXISTS finance_document_fingerprints(hash text PRIMARY KEY,document_id uuid NOT NULL UNIQUE REFERENCES documents(id));
INSERT INTO finance_document_fingerprints(hash,document_id) SELECT file_hash,document_id FROM finance_payslips ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS finance_regularizations(id text PRIMARY KEY,user_id uuid NOT NULL REFERENCES users(id),old_entry_id uuid NOT NULL REFERENCES current_account_entries(id),new_entry_id uuid NOT NULL REFERENCES current_account_entries(id),status text NOT NULL DEFAULT 'Pendente',data jsonb NOT NULL,created_at timestamptz NOT NULL,decided_at timestamptz,decided_by uuid REFERENCES users(id),reason text,revision integer NOT NULL DEFAULT 0);
CREATE UNIQUE INDEX IF NOT EXISTS finance_regularization_pair ON finance_regularizations(old_entry_id,new_entry_id);
CREATE TABLE IF NOT EXISTS finance_mail_documents(id text PRIMARY KEY,document_id uuid NOT NULL UNIQUE REFERENCES documents(id),file_hash text NOT NULL UNIQUE,source_key text NOT NULL UNIQUE,status text NOT NULL DEFAULT 'Pendente',kind text,entity_id text,uploaded_at timestamptz NOT NULL,uploaded_by uuid NOT NULL REFERENCES users(id),revision integer NOT NULL DEFAULT 0,last_operation text);
CREATE TABLE IF NOT EXISTS finance_email_tests(id text PRIMARY KEY,action_id text NOT NULL,address text NOT NULL,status text NOT NULL,error_code text,actor_id uuid NOT NULL REFERENCES users(id),created_at timestamptz NOT NULL);
ALTER TABLE finance_email_tests ADD COLUMN IF NOT EXISTS provider text;
CREATE TABLE IF NOT EXISTS finance_archive_plans(document_id uuid PRIMARY KEY REFERENCES documents(id),data jsonb NOT NULL,revision integer NOT NULL DEFAULT 0,updated_at timestamptz NOT NULL,updated_by uuid NOT NULL REFERENCES users(id));

-- Separate delivery receipt from the human confirmation of a retained archive.
CREATE TABLE IF NOT EXISTS finance_archive_dispatch(document_id uuid PRIMARY KEY REFERENCES documents(id),content_hash text NOT NULL,destination text NOT NULL,status text NOT NULL,provider_id text,attempted_at timestamptz NOT NULL,error_code text);

ALTER TABLE current_account_entries ADD COLUMN IF NOT EXISTS payment_parent_id uuid REFERENCES current_account_entries(id);
UPDATE current_account_entries AS p SET payment_parent_id=c.id FROM current_account_entries AS c WHERE p.kind='Pagamento' AND p.payment_parent_id IS NULL AND p.data->>'paymentOf'=c.id::text;
COMMIT;
