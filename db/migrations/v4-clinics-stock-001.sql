-- Additive: canonical clinics/documents/audit tables retained; only Stock has a new ledger.
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS data jsonb NOT NULL DEFAULT '{}'::jsonb;
CREATE TABLE IF NOT EXISTS stock_ledgers(
 clinic_id text PRIMARY KEY REFERENCES clinics(id),
 revision bigint NOT NULL DEFAULT 0 CHECK(revision>=0),
 data jsonb NOT NULL CHECK(jsonb_typeof(data)='object') CHECK(jsonb_typeof(data->'balances')='array') CHECK(NOT jsonb_path_exists(data,'$.balances[*] ? (@.quantity < 0 || @.reserved < 0 || @.reserved > @.quantity)')), 
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_clinic_documents ON documents((data->>'clinicId')) WHERE kind='Clínica';
CREATE UNIQUE INDEX IF NOT EXISTS idx_clinic_document_operation ON documents((data->>'operationKey')) WHERE kind='Clínica' AND data->>'operationKey' IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_module_audit_scope ON audit_log((detail->>'clinicId'),created_at);
