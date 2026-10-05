-- Grupo Saúde V4 schema v1
create extension if not exists pgcrypto;
create table if not exists clinics(id text primary key,name text not null,city text,domain text,active boolean not null default true,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table if not exists users(id uuid primary key default gen_random_uuid(),auth_subject text unique,email text unique not null,name text not null,role text not null check(role in ('Call Center','Médico/a','Técnico/a','Administrativa','Administração','CEO')),active boolean not null default true,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table if not exists user_clinics(user_id uuid references users(id) on delete cascade,clinic_id text references clinics(id) on delete cascade,primary key(user_id,clinic_id));
create table if not exists specialties(id uuid primary key default gen_random_uuid(),name text unique not null,active boolean not null default true);
create table if not exists clinic_specialties(clinic_id text references clinics(id) on delete cascade,specialty_id uuid references specialties(id) on delete cascade,primary key(clinic_id,specialty_id));
create table if not exists employees(id uuid primary key default gen_random_uuid(),user_id uuid references users(id),name text not null,status text not null default 'Ativo',role text,archived_at timestamptz,data jsonb not null default '{}'::jsonb,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table if not exists requests(id uuid primary key default gen_random_uuid(),clinic_id text references clinics(id),specialty_id uuid references specialties(id),patient_ref text,stage text not null default 'Pedido de Consulta',doctor_id uuid references users(id),data jsonb not null default '{}'::jsonb,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table if not exists time_entries(id uuid primary key default gen_random_uuid(),employee_id uuid references employees(id),clinic_id text references clinics(id),kind text not null,occurred_at timestamptz not null,gps jsonb,status text not null default 'Aceite',data jsonb not null default '{}'::jsonb,created_at timestamptz not null default now());
create table if not exists audit_log(id bigserial primary key,actor_id uuid references users(id),module text not null,action text not null,entity_type text,entity_id text,detail jsonb not null default '{}'::jsonb,created_at timestamptz not null default now());
create index if not exists idx_requests_clinic_stage on requests(clinic_id,stage);
create index if not exists idx_time_employee_date on time_entries(employee_id,occurred_at desc);
create index if not exists idx_audit_created on audit_log(created_at desc);

-- RH recruitment + private document archive
create table if not exists candidates(
 id uuid primary key default gen_random_uuid(), email text, name text, phone text,
 clinic_id text references clinics(id), desired_role text, stage text not null default 'Novo',
 source text not null default 'Manual', source_message_id text unique, owner_id uuid references users(id),
 next_action_at timestamptz, data jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists documents(
 id uuid primary key default gen_random_uuid(), employee_id uuid references employees(id) on delete cascade,
 candidate_id uuid references candidates(id) on delete cascade, kind text not null, filename text not null,
 storage_key text not null, mime_type text, starts_at date, valid_until date, received_at timestamptz not null default now(),
 retention_until date, status text not null default 'Recebido', data jsonb not null default '{}'::jsonb
);
create table if not exists email_ingest(
 id uuid primary key default gen_random_uuid(), provider text not null, message_id text unique not null,
 sender text, subject text, received_at timestamptz, status text not null default 'Pendente',
 candidate_id uuid references candidates(id), error text, created_at timestamptz not null default now()
);
create table if not exists document_backup_jobs(
 id uuid primary key default gen_random_uuid(), document_id uuid references documents(id) on delete cascade,
 destination text not null, status text not null default 'Pendente', attempts integer not null default 0,
 last_attempt_at timestamptz, delivered_at timestamptz, error text, created_at timestamptz not null default now()
);
create index if not exists idx_candidates_stage on candidates(stage,created_at desc);
create index if not exists idx_documents_employee on documents(employee_id,received_at desc);
create index if not exists idx_backup_jobs_status on document_backup_jobs(status,created_at);
