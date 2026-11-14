-- Executar apenas numa base Neon de TESTE, depois do schema existente. Sem deletes/seeds/restauros.
BEGIN;
CREATE TABLE IF NOT EXISTS app_settings(key text PRIMARY KEY,value jsonb NOT NULL DEFAULT '{}'::jsonb,updated_at timestamptz NOT NULL DEFAULT now(),updated_by uuid REFERENCES users(id));
CREATE TABLE IF NOT EXISTS current_account_entries(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid REFERENCES users(id),clinic_id text REFERENCES clinics(id),entry_date date NOT NULL,kind text NOT NULL,description text NOT NULL,quantity numeric(12,2) NOT NULL DEFAULT 0,unit_value numeric(12,2) NOT NULL DEFAULT 0,value numeric(12,2) NOT NULL DEFAULT 0,status text NOT NULL DEFAULT 'Por pagar',paid_at timestamptz,source_type text,source_id text,data jsonb NOT NULL DEFAULT '{}'::jsonb,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),UNIQUE(source_type,source_id,kind));
CREATE TABLE IF NOT EXISTS finance_invoices (
 id text PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id), issuer_key text NOT NULL,
 number text NOT NULL, series text NOT NULL DEFAULT '', invoice_date date NOT NULL, inserted_date date NOT NULL,
 value_cents bigint NOT NULL CHECK(value_cents>0), document_id uuid NOT NULL REFERENCES documents(id),
 status text NOT NULL DEFAULT 'Pendente' CHECK(status IN ('Pendente','Validada','Recusada')),
 reason text, notes text NOT NULL DEFAULT '', uploaded_at timestamptz NOT NULL, uploaded_by uuid NOT NULL REFERENCES users(id),
 revision integer NOT NULL DEFAULT 0, UNIQUE(issuer_key,number,series)
);
CREATE TABLE IF NOT EXISTS finance_payslips (
 id text PRIMARY KEY, user_id uuid REFERENCES users(id), suggested_user_id uuid REFERENCES users(id),
 ref_year integer, ref_month integer, document_date date, document_id uuid NOT NULL REFERENCES documents(id),
 file_hash text NOT NULL, source_key text UNIQUE, status text NOT NULL DEFAULT 'Pendente' CHECK(status IN ('Pendente','Validada','Recusada')),
 notes text NOT NULL DEFAULT '', reason text, uploaded_at timestamptz NOT NULL, uploaded_by uuid NOT NULL REFERENCES users(id),
 validated_at timestamptz, validated_by uuid REFERENCES users(id), read_at timestamptz, revision integer NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX IF NOT EXISTS finance_payslips_content ON finance_payslips(file_hash);
CREATE UNIQUE INDEX IF NOT EXISTS finance_payslips_period ON finance_payslips(user_id,ref_year,ref_month) WHERE status='Validada';
CREATE TABLE IF NOT EXISTS finance_document_owners(document_id uuid PRIMARY KEY REFERENCES documents(id),user_id uuid REFERENCES users(id),kind text NOT NULL);
CREATE TABLE IF NOT EXISTS finance_events(id text PRIMARY KEY,entity_type text NOT NULL,entity_id text NOT NULL,actor_id uuid NOT NULL REFERENCES users(id),action text NOT NULL,before_data jsonb,after_data jsonb,created_at timestamptz NOT NULL);
CREATE TABLE IF NOT EXISTS finance_email_runs(source_key text PRIMARY KEY,status text NOT NULL,error_code text,created_at timestamptz NOT NULL);
CREATE INDEX IF NOT EXISTS finance_invoices_owner ON finance_invoices(user_id,invoice_date);
CREATE INDEX IF NOT EXISTS finance_payslips_owner ON finance_payslips(user_id,ref_year,ref_month);
CREATE INDEX IF NOT EXISTS finance_account_owner ON current_account_entries(user_id,entry_date);

-- Identificador da operação para garantir que auditoria/integração acompanham apenas a revisão vencedora.
ALTER TABLE finance_invoices ADD COLUMN IF NOT EXISTS last_operation text;
ALTER TABLE finance_invoices ADD COLUMN IF NOT EXISTS read_at timestamptz;
ALTER TABLE finance_payslips ADD COLUMN IF NOT EXISTS last_operation text;

COMMIT;
