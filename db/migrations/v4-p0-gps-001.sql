-- Offline only. Backwards-compatible additions; never run from an HTTP handler.
alter table clinics add column if not exists latitude double precision;
alter table clinics add column if not exists longitude double precision;
alter table clinics add column if not exists attendance_radius_m integer not null default 50;
alter table clinics add column if not exists address text;
create table if not exists clinic_gps_attempts(
 id bigserial primary key,actor_id uuid references users(id),clinic_id text references clinics(id),
 latitude double precision,longitude double precision,accuracy_m double precision,
 distance_m double precision,radius_m integer,allowed boolean not null,code text not null,
 created_at timestamptz not null default now()
);
