-- Apply ONLY to a verified isolated synthetic test database. No destructive changes.
CREATE TABLE IF NOT EXISTS recruitment_imports(
 source_key text PRIMARY KEY, candidate_id uuid NOT NULL REFERENCES candidates(id),
 document_id uuid REFERENCES documents(id), created_at timestamptz NOT NULL
);
CREATE TABLE IF NOT EXISTS recruitment_conversions(
 candidate_id uuid PRIMARY KEY REFERENCES candidates(id), employee_id uuid NOT NULL UNIQUE REFERENCES employees(id),
 email text NOT NULL UNIQUE, created_at timestamptz NOT NULL, actor_id uuid NOT NULL REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS recruitment_mail(
 id text PRIMARY KEY, candidate_id uuid NOT NULL REFERENCES candidates(id), recipient text NOT NULL,
 kind text NOT NULL CHECK(kind IN ('interview','rejection')), payload jsonb NOT NULL,
 status text NOT NULL DEFAULT 'Queued' CHECK(status IN ('Queued','PendingConfig','Sending','Sent','Failed','Uncertain','Superseded')),
 attempts integer NOT NULL DEFAULT 0, attempt_token text, first_attempt_at timestamptz,
 created_at timestamptz NOT NULL, sent_at timestamptz, provider_id text, error_code text
);
CREATE INDEX IF NOT EXISTS recruitment_mail_candidate ON recruitment_mail(candidate_id,created_at);
