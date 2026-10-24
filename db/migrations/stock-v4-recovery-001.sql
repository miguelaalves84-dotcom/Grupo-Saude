-- Reuses the recovered Stock ledger format; no alteration/removal of existing clinics, files or history.
CREATE TABLE IF NOT EXISTS stock_ledgers(
 clinic_id text PRIMARY KEY REFERENCES clinics(id),
 revision bigint NOT NULL DEFAULT 0 CHECK(revision>=0),
 data jsonb NOT NULL CHECK(jsonb_typeof(data)='object') CHECK(jsonb_typeof(data->'balances')='array') CHECK(NOT jsonb_path_exists(data,'$.balances[*] ? (@.quantity < 0 || @.reserved < 0 || @.reserved > @.quantity)')),
 updated_at timestamptz NOT NULL DEFAULT now()
);
