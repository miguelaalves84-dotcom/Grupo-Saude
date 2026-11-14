-- Additive, isolated test environment only. Never applied automatically.
create table if not exists complaints(id text primary key,clinic_id text not null references clinics(id),revision integer not null,stage text not null,received_at text not null,data jsonb not null);
create index if not exists complaints_clinic_stage on complaints(clinic_id,stage);
create table if not exists complaint_documents(complaint_id text not null references complaints(id),document_id uuid not null references documents(id),primary key(complaint_id,document_id));
