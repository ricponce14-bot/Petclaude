-- ============================================================
-- Apúntame.mx — Baseline del esquema (idempotente)
-- ============================================================
-- Este archivo permite que la integración GitHub → Supabase reconstruya el
-- esquema completo en un proyecto nuevo, y es INOCUO en la base existente
-- (todo está guardado con IF NOT EXISTS / DO-blocks / OR REPLACE).
--
-- Incluye las tablas que el código usa y que no estaban en schema.sql:
-- bot_config, whatsapp_chat_sessions, y la columna wa_messages.media_url.
-- NO incluye wa_sessions (artefacto de Evolution API, descartado).
-- ============================================================

create extension if not exists "uuid-ossp";

-- pg_cron puede no estar habilitado en proyectos nuevos; no debe romper el push.
do $$ begin
  create extension if not exists pg_cron;
exception when others then
  raise notice 'pg_cron no disponible, se omite (habilítalo en Dashboard → Extensions si lo necesitas)';
end $$;

-- ============================================================
-- TYPES (guardados contra duplicados)
-- ============================================================
do $$ begin
  create type appointment_status as enum ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show');
exception when duplicate_object then null; end $$;

do $$ begin
  create type appointment_type as enum ('bath', 'haircut', 'bath_haircut', 'vaccine', 'checkup', 'other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type wa_message_type as enum ('reminder', 'winback', 'birthday', 'manual', 'bot_reply', 'bot_incoming');
exception when duplicate_object then null; end $$;

do $$ begin
  create type wa_status as enum ('pending', 'sent', 'failed');
exception when duplicate_object then null; end $$;

-- Valores de enum añadidos después del schema original (no-op si ya existen).
alter type wa_message_type add value if not exists 'bot_reply';
alter type wa_message_type add value if not exists 'bot_incoming';

-- ============================================================
-- TENANTS (negocios suscriptores; "salons/estetica_id" en el doc de contexto)
-- ============================================================
create table if not exists tenants (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  phone         text,
  email         text unique,
  city          text,
  plan          text not null default 'trial',
  stripe_customer_id     text,
  stripe_subscription_id text,
  trial_ends_at timestamptz default (now() + interval '14 days'),
  created_at    timestamptz default now()
);

-- ============================================================
-- OWNERS (clientes finales del negocio)
-- ============================================================
create table if not exists owners (
  id         uuid primary key default uuid_generate_v4(),
  tenant_id  uuid not null references tenants(id) on delete cascade,
  name       text not null,
  whatsapp   text not null,
  notes      text,
  created_at timestamptz default now()
);

create index if not exists idx_owners_tenant   on owners(tenant_id);
create index if not exists idx_owners_whatsapp on owners(whatsapp);

-- ============================================================
-- PETS
-- ============================================================
create table if not exists pets (
  id          uuid primary key default uuid_generate_v4(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  owner_id    uuid not null references owners(id) on delete cascade,
  name        text not null,
  breed       text,
  birthdate   date,
  species     text default 'dog',
  allergies   text,
  temperament text default 'friendly',
  photo_url   text,
  notes       text,
  created_at  timestamptz default now()
);

create index if not exists idx_pets_tenant    on pets(tenant_id);
create index if not exists idx_pets_owner     on pets(owner_id);
create index if not exists idx_pets_birthdate on pets(birthdate);

-- ============================================================
-- APPOINTMENTS
-- ============================================================
create table if not exists appointments (
  id            uuid primary key default uuid_generate_v4(),
  tenant_id     uuid not null references tenants(id) on delete cascade,
  pet_id        uuid references pets(id) on delete cascade,
  owner_id      uuid references owners(id) on delete cascade,
  type          appointment_type not null default 'bath',
  status        appointment_status not null default 'scheduled',
  scheduled_at  timestamptz not null,
  duration_min  int default 60,
  price         numeric(10,2),
  notes         text,
  reminder_sent boolean default false,
  created_at    timestamptz default now()
);

create index if not exists idx_appts_tenant    on appointments(tenant_id);
create index if not exists idx_appts_scheduled on appointments(scheduled_at);
create index if not exists idx_appts_pet       on appointments(pet_id);
create index if not exists idx_appts_reminder  on appointments(reminder_sent, scheduled_at) where status = 'scheduled';

-- ============================================================
-- CLINICAL RECORDS
-- ============================================================
create table if not exists clinical_records (
  id          uuid primary key default uuid_generate_v4(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  pet_id      uuid not null references pets(id) on delete cascade,
  appt_id     uuid references appointments(id) on delete set null,
  type        text not null,
  description text,
  weight_kg   numeric(5,2),
  products    text,
  created_at  timestamptz default now()
);

create index if not exists idx_clinical_pet    on clinical_records(pet_id);
create index if not exists idx_clinical_tenant on clinical_records(tenant_id);

-- ============================================================
-- WA_MESSAGES (log de mensajes de WhatsApp)
-- ============================================================
create table if not exists wa_messages (
  id          uuid primary key default uuid_generate_v4(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  owner_id    uuid references owners(id) on delete set null,
  pet_id      uuid references pets(id) on delete set null,
  appt_id     uuid references appointments(id) on delete set null,
  type        wa_message_type not null,
  phone       text not null,
  body        text not null,
  media_url   text,
  status      wa_status not null default 'pending',
  direction   text default 'outbound',
  sent_at     timestamptz,
  error       text,
  created_at  timestamptz default now()
);

-- Columnas añadidas después del schema original (no-op si ya existen).
alter table wa_messages add column if not exists media_url text;
alter table wa_messages add column if not exists direction text default 'outbound';

create index if not exists idx_wa_tenant on wa_messages(tenant_id);
create index if not exists idx_wa_status on wa_messages(status) where status = 'pending';

-- ============================================================
-- BOT_CONFIG (configuración del bot de agendamiento por tenant)
-- Usada por lib/whatsapp-bot/engine.ts — no estaba en schema.sql.
-- ============================================================
create table if not exists bot_config (
  id                    uuid primary key default uuid_generate_v4(),
  tenant_id             uuid not null unique references tenants(id) on delete cascade,
  is_enabled            boolean not null default true,
  welcome_message       text not null default '',
  services              jsonb not null default '[]'::jsonb,
  business_hours        jsonb not null default '{}'::jsonb,
  slot_duration_min     int not null default 60,
  confirmation_template text not null default '',
  price_list_message    text not null default '',
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

-- ============================================================
-- WHATSAPP_CHAT_SESSIONS (estado conversacional del bot de clientes)
-- Usada por lib/whatsapp-bot/engine.ts — no estaba en schema.sql.
-- ============================================================
create table if not exists whatsapp_chat_sessions (
  id               uuid primary key default uuid_generate_v4(),
  tenant_id        uuid not null references tenants(id) on delete cascade,
  phone            text not null,
  owner_id         uuid references owners(id) on delete set null,
  state            text not null default 'inicio',
  selected_service text,
  selected_date    text,
  selected_time    text,
  selected_pet_id  uuid,
  last_message_at  timestamptz not null default now(),
  expires_at       timestamptz not null default (now() + interval '30 minutes'),
  created_at       timestamptz default now()
);

create index if not exists idx_chat_sessions_phone  on whatsapp_chat_sessions(tenant_id, phone);
create index if not exists idx_chat_sessions_expiry on whatsapp_chat_sessions(expires_at);

-- ============================================================
-- INVENTORY (insumos/productos por tenant)
-- Usada por app/(dashboard)/inventario — no estaba en schema.sql.
-- ============================================================
create table if not exists inventory (
  id          uuid primary key default uuid_generate_v4(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  name        text not null,
  description text,
  stock       int not null default 0,
  min_stock   int not null default 5,
  price       numeric(10,2) not null default 0,
  category    text not null default 'Insumos',
  created_at  timestamptz default now()
);

create index if not exists idx_inventory_tenant on inventory(tenant_id);

-- ============================================================
-- MESSAGE_TEMPLATES (plantillas editables por el dueño, por tenant+tipo)
-- Usada por app/(dashboard)/mensajes — no estaba en schema.sql.
-- upsert con onConflict "tenant_id,type" → constraint único.
-- ============================================================
create table if not exists message_templates (
  id         uuid primary key default uuid_generate_v4(),
  tenant_id  uuid not null references tenants(id) on delete cascade,
  type       text not null,   -- reminder | winback | birthday | custom
  body       text not null default '',
  is_active  boolean not null default true,
  created_at timestamptz default now(),
  unique (tenant_id, type)
);

create index if not exists idx_msg_templates_tenant on message_templates(tenant_id);

-- ============================================================
-- RLS
-- ============================================================
alter table tenants                enable row level security;
alter table owners                 enable row level security;
alter table pets                   enable row level security;
alter table appointments           enable row level security;
alter table clinical_records       enable row level security;
alter table wa_messages            enable row level security;
alter table bot_config             enable row level security;
alter table whatsapp_chat_sessions enable row level security;
alter table inventory              enable row level security;
alter table message_templates      enable row level security;

-- El dashboard puede leer SU propio tenant (el schema original no tenía
-- política en tenants, lo que bloqueaba lecturas directas desde el cliente).
drop policy if exists "tenant_self_select" on tenants;
create policy "tenant_self_select" on tenants
  for select
  using (id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

drop policy if exists "tenant_isolation" on owners;
create policy "tenant_isolation" on owners
  using (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

drop policy if exists "tenant_isolation" on pets;
create policy "tenant_isolation" on pets
  using (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

drop policy if exists "tenant_isolation" on appointments;
create policy "tenant_isolation" on appointments
  using (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

drop policy if exists "tenant_isolation" on clinical_records;
create policy "tenant_isolation" on clinical_records
  using (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

drop policy if exists "tenant_isolation" on wa_messages;
create policy "tenant_isolation" on wa_messages
  using (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

drop policy if exists "tenant_isolation" on bot_config;
create policy "tenant_isolation" on bot_config
  using (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

drop policy if exists "tenant_isolation" on whatsapp_chat_sessions;
create policy "tenant_isolation" on whatsapp_chat_sessions
  for select
  using (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

drop policy if exists "tenant_isolation" on inventory;
create policy "tenant_isolation" on inventory
  using (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

drop policy if exists "tenant_isolation" on message_templates;
create policy "tenant_isolation" on message_templates
  using (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

-- ============================================================
-- FUNCIONES HELPER
-- ============================================================
create or replace function last_visit(p_pet_id uuid)
returns timestamptz language sql stable as $$
  select max(scheduled_at)
  from appointments
  where pet_id = p_pet_id and status = 'completed';
$$;

create or replace function pets_birthday_today(p_tenant_id uuid)
returns table(pet_id uuid, pet_name text, owner_id uuid, whatsapp text) language sql stable as $$
  select p.id, p.name, o.id, o.whatsapp
  from pets p
  join owners o on o.id = p.owner_id
  where p.tenant_id = p_tenant_id
    and extract(month from p.birthdate) = extract(month from now())
    and extract(day   from p.birthdate) = extract(day   from now());
$$;
