-- Preparation only: execute after destination/backup/grants verification, never via an HTTP route.
-- Requires the existing db/schema.sql. Reuses the existing permission and rate-limit tables.
BEGIN;
CREATE TABLE IF NOT EXISTS app_settings(key text PRIMARY KEY,value jsonb NOT NULL DEFAULT '{}'::jsonb,updated_at timestamptz NOT NULL DEFAULT now(),updated_by uuid REFERENCES users(id));
CREATE TABLE IF NOT EXISTS gmail_auth_limits(key text PRIMARY KEY,attempts integer NOT NULL,expires_at timestamptz NOT NULL);
CREATE TABLE IF NOT EXISTS gs_identity_environment(id text PRIMARY KEY CHECK(id='group1-tests'),resource_id text NOT NULL,data_synthetic boolean NOT NULL CHECK(data_synthetic=true));
-- A controlled provisioning script must insert the verified new resource ID. This migration deliberately does not.
-- Runtime gets SELECT only on gs_identity_environment and cannot change its own destination marker.
COMMIT;
