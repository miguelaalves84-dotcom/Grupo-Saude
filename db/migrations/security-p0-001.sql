-- DEVELOPMENT / DISPOSABLE TESTS ONLY. No automatic migration in a request handler.
BEGIN;
DO $$ BEGIN
 IF current_database() NOT IN ('gs_v4_security_synthetic','gs_v4_security_restore_synthetic') THEN
  RAISE EXCEPTION 'SECURITY_MIGRATION_REQUIRES_DISPOSABLE_SYNTHETIC_DATABASE';
 END IF;
END $$;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE IF NOT EXISTS gs_security_environment(id text PRIMARY KEY, environment text NOT NULL CHECK(environment='synthetic-only'));
INSERT INTO gs_security_environment VALUES('isolation','synthetic-only') ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS gs_security_events(
 id bigserial PRIMARY KEY, actor_id uuid REFERENCES users(id), clinic_id text REFERENCES clinics(id),
 action text NOT NULL, entity_type text NOT NULL, entity_id text, outcome text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), previous_hash text NOT NULL, event_hash text NOT NULL
);
CREATE OR REPLACE FUNCTION gs_security_event_chain() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP <> 'INSERT' THEN RAISE EXCEPTION 'SECURITY_AUDIT_APPEND_ONLY'; END IF;
 PERFORM pg_advisory_xact_lock(734951026);
 NEW.id := nextval(pg_get_serial_sequence('gs_security_events','id'));
 NEW.created_at := clock_timestamp();
 NEW.previous_hash := coalesce((SELECT event_hash FROM gs_security_events ORDER BY id DESC LIMIT 1),'GENESIS');
 NEW.event_hash := encode(digest(convert_to(jsonb_build_array(NEW.id,NEW.actor_id,NEW.clinic_id,NEW.action,NEW.entity_type,NEW.entity_id,NEW.outcome,NEW.created_at,NEW.previous_hash)::text,'UTF8'),'sha256'),'hex');
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS gs_security_event_guard ON gs_security_events;
CREATE TRIGGER gs_security_event_guard BEFORE INSERT OR UPDATE OR DELETE ON gs_security_events FOR EACH ROW EXECUTE FUNCTION gs_security_event_chain();
CREATE TABLE IF NOT EXISTS gs_security_mfa_uses(key text PRIMARY KEY,expires_at timestamptz NOT NULL);
CREATE TABLE IF NOT EXISTS gs_security_limits(key text PRIMARY KEY,attempts integer NOT NULL,expires_at timestamptz NOT NULL);
CREATE TABLE IF NOT EXISTS gs_security_invites(
 id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id), email text NOT NULL, token_hash text NOT NULL UNIQUE,
 operation_key text UNIQUE NOT NULL, created_by uuid NOT NULL REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL,
 used_at timestamptz, revoked_at timestamptz
);
CREATE TABLE IF NOT EXISTS gs_security_mfa_sessions(session_id text PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id), verified_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS gs_security_mail_queue(
 id uuid PRIMARY KEY, channel text NOT NULL CHECK(channel='tasks'), purpose text NOT NULL CHECK(purpose IN ('invitation','password-reset')),
 user_id uuid NOT NULL REFERENCES users(id), dedup_hash text NOT NULL UNIQUE, encrypted_payload text NOT NULL,
 status text NOT NULL DEFAULT 'Pending configuration', attempts integer NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now(),
 delivered_at timestamptz, provider_id text, expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS gs_security_invite_active ON gs_security_invites(user_id,expires_at) WHERE used_at IS NULL AND revoked_at IS NULL;
CREATE OR REPLACE FUNCTION gs_financial_event_immutable() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'FINANCIAL_AUDIT_APPEND_ONLY'; END $$;
DO $$ BEGIN
 IF to_regclass('audit_log') IS NOT NULL THEN
  DROP TRIGGER IF EXISTS gs_business_audit_guard ON audit_log;
  CREATE TRIGGER gs_business_audit_guard BEFORE UPDATE OR DELETE ON audit_log FOR EACH ROW EXECUTE FUNCTION gs_financial_event_immutable();
 END IF;
 IF to_regclass('finance_events') IS NOT NULL THEN
  DROP TRIGGER IF EXISTS gs_financial_event_guard ON finance_events;
  CREATE TRIGGER gs_financial_event_guard BEFORE UPDATE OR DELETE ON finance_events FOR EACH ROW EXECUTE FUNCTION gs_financial_event_immutable();
 END IF;
END $$;
COMMIT;
