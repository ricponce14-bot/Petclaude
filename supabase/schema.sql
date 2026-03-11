-- ============================================================
-- PetCloud — Schema Principal
-- ============================================================

-- Extensiones
create extension if not exists "uuid-ossp";
create extension if not exists "pg_cron";

-- ============================================================
-- TENANTS (negocios suscriptores)
-- ============================================================
create table tenants (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  phone         text,
  email         text unique,
  city          text,
  plan          text not null default 'trial',   -- trial | active | cancelled
  stripe_customer_id     text,
  stripe_subscription_id text,
  trial_ends_at timestamptz default (now() + interval '14 days'),
  created_at    timestamptz default now()
);

-- ============================================================
-- OWNERS (dueños de mascotas)
-- ============================================================
create table owners (
  id         uuid primary key default uuid_generate_v4(),
  tenant_id  uuid not null references tenants(id) on delete cascade,
  name       text not null,
  whatsapp   text not null,              -- formato: 521XXXXXXXXXX
  notes      text,
  created_at timestamptz default now()
);

create index idx_owners_tenant on owners(tenant_id);
create index idx_owners_whatsapp on owners(whatsapp);

-- ============================================================
-- PETS (mascotas)
-- ============================================================
create table pets (
  id          uuid primary key default uuid_generate_v4(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  owner_id    uuid not null references owners(id) on delete cascade,
  name        text not null,
  breed       text,
  birthdate   date,
  species     text default 'dog',       -- dog | cat | other
  allergies   text,
  temperament text default 'friendly',  -- friendly | nervous | aggressive
  photo_url   text,
  notes       text,
  created_at  timestamptz default now()
);

create index idx_pets_tenant  on pets(tenant_id);
create index idx_pets_owner   on pets(owner_id);
create index idx_pets_birthdate on pets(birthdate);

-- ============================================================
-- APPOINTMENTS (citas)
-- ============================================================
create type appointment_status as enum ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show');
create type appointment_type   as enum ('bath', 'haircut', 'bath_haircut', 'vaccine', 'checkup', 'other');

create table appointments (
  id            uuid primary key default uuid_generate_v4(),
  tenant_id     uuid not null references tenants(id) on delete cascade,
  pet_id        uuid not null references pets(id) on delete cascade,
  owner_id      uuid not null references owners(id) on delete cascade,
  type          appointment_type not null default 'bath',
  status        appointment_status not null default 'scheduled',
  scheduled_at  timestamptz not null,
  duration_min  int default 60,
  price         numeric(10,2),
  notes         text,
  reminder_sent boolean default false,
  created_at    timestamptz default now()
);

create index idx_appts_tenant      on appointments(tenant_id);
create index idx_appts_scheduled   on appointments(scheduled_at);
create index idx_appts_pet         on appointments(pet_id);
create index idx_appts_reminder    on appointments(reminder_sent, scheduled_at) where status = 'scheduled';

-- ============================================================
-- CLINICAL HISTORY (historial clínico)
-- ============================================================
create table clinical_records (
  id          uuid primary key default uuid_generate_v4(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  pet_id      uuid not null references pets(id) on delete cascade,
  appt_id     uuid references appointments(id) on delete set null,
  type        text not null,     -- bath | haircut | vaccine | checkup | note
  description text,
  weight_kg   numeric(5,2),
  products    text,              -- productos usados, vacunas aplicadas, etc.
  created_at  timestamptz default now()
);

create index idx_clinical_pet    on clinical_records(pet_id);
create index idx_clinical_tenant on clinical_records(tenant_id);

-- ============================================================
-- WHATSAPP MESSAGES LOG
-- ============================================================
create type wa_message_type as enum ('reminder', 'winback', 'birthday', 'manual');
create type wa_status       as enum ('pending', 'sent', 'failed');

create table wa_messages (
  id          uuid primary key default uuid_generate_v4(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  owner_id    uuid references owners(id) on delete set null,
  pet_id      uuid references pets(id) on delete set null,
  appt_id     uuid references appointments(id) on delete set null,
  type        wa_message_type not null,
  phone       text not null,
  body        text not null,
  status      wa_status not null default 'pending',
  sent_at     timestamptz,
  error       text,
  created_at  timestamptz default now()
);

create index idx_wa_tenant  on wa_messages(tenant_id);
create index idx_wa_status  on wa_messages(status) where status = 'pending';

-- ============================================================
-- WHATSAPP SESSIONS (Evolution API instances por tenant)
-- ============================================================
create table wa_sessions (
  id           uuid primary key default uuid_generate_v4(),
  tenant_id    uuid not null unique references tenants(id) on delete cascade,
  instance     text not null unique,   -- nombre de instancia en Evolution API
  status       text default 'disconnected', -- connected | disconnected | qr_needed
  qr_code      text,                    -- base64 del QR cuando está en qr_needed
  updated_at   timestamptz default now()
);

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================
alter table tenants          enable row level security;
alter table owners           enable row level security;
alter table pets             enable row level security;
alter table appointments     enable row level security;
alter table clinical_records enable row level security;
alter table wa_messages      enable row level security;
alter table wa_sessions      enable row level security;

-- Política base: cada usuario solo ve su tenant
-- El tenant_id se guarda en el JWT como claim personalizado
create policy "tenant_isolation" on owners
  using (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

create policy "tenant_isolation" on pets
  using (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

create policy "tenant_isolation" on appointments
  using (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

create policy "tenant_isolation" on clinical_records
  using (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

create policy "tenant_isolation" on wa_messages
  using (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

create policy "tenant_isolation" on wa_sessions
  using (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

-- ============================================================
-- FUNCIONES HELPER
-- ============================================================

-- Última visita de una mascota
create or replace function last_visit(p_pet_id uuid)
returns timestamptz language sql stable as $$
  select max(scheduled_at)
  from appointments
  where pet_id = p_pet_id and status = 'completed';
$$;

-- Mascotas con cumpleaños hoy (para trigger de WA)
create or replace function pets_birthday_today(p_tenant_id uuid)
returns table(pet_id uuid, pet_name text, owner_id uuid, whatsapp text) language sql stable as $$
  select p.id, p.name, o.id, o.whatsapp
  from pets p
  join owners o on o.id = p.owner_id
  where p.tenant_id = p_tenant_id
    and extract(month from p.birthdate) = extract(month from now())
    and extract(day   from p.birthdate) = extract(day   from now());
$$;
