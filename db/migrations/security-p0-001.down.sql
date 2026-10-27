-- Rehearsal rollback only, for the disposable RESTORE clone. Never runs automatically.
BEGIN;
DO $$ BEGIN
 IF current_database()<>'gs_v4_security_restore_synthetic' OR NOT EXISTS(SELECT 1 FROM gs_security_environment WHERE id='isolation' AND environment='synthetic-only') THEN RAISE EXCEPTION 'ROLLBACK_REQUIRES_DISPOSABLE_RESTORE_CLONE'; END IF;
END $$;
DROP TRIGGER IF EXISTS gs_financial_event_guard ON finance_events;
DROP FUNCTION IF EXISTS gs_financial_event_immutable();
DROP TABLE IF EXISTS gs_security_mfa_sessions,gs_security_mfa_uses,gs_security_limits,gs_security_invites,gs_security_mail_queue;
DROP TABLE IF EXISTS gs_security_events;
DROP FUNCTION IF EXISTS gs_security_event_chain();
DROP TABLE IF EXISTS gs_security_environment;
COMMIT;
