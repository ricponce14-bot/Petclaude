-- ============================================================
-- Apúntame.mx — Fase 1: Modelo de datos multi-tenant (Cloud API)
-- ============================================================
-- Fuente de verdad: docs/Apuntame_Project_Context.docx (secciones 4 y 11).
--
-- NOTA DE NAMING: el documento usa `salons` / `estetica_id`. En este repo la
-- tabla de negocios ya se llama `tenants` y todo el código + RLS la referencian.
-- Por eso aquí `estetica_id` (del doc) == `tenant_id` (de este repo). No se
-- renombra la tabla para no romper el código existente.
--
-- Este script es IDEMPOTENTE: se puede correr varias veces sin error.
-- Ejecutar en Supabase → SQL Editor.
-- ============================================================

create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. TENANTS: columnas nuevas para vinculación de WhatsApp
--    (doc sección 11: whatsapp_vinculado + codigo_publico)
-- ============================================================
alter table tenants add column if not exists whatsapp_vinculado boolean not null default false;
-- codigo_publico: código PERMANENTE y reutilizable que va en el link wa.me
-- de los clientes finales (a diferencia del token de activación, no expira).
alter table tenants add column if not exists codigo_publico text;

-- Único cuando no es null (permite múltiples tenants sin código aún).
create unique index if not exists idx_tenants_codigo_publico
  on tenants(codigo_publico) where codigo_publico is not null;

-- ============================================================
-- 2. PHONE_REGISTRY: mapea cada teléfono a su rol y negocio
--    (doc sección 4). telefono como PK = un teléfono pertenece
--    a un solo negocio con un solo rol.
-- ============================================================
create table if not exists phone_registry (
  telefono    text primary key,                 -- formato: 521XXXXXXXXXX (sin +)
  rol         text not null check (rol in ('dueño', 'cliente')),
  tenant_id   uuid not null references tenants(id) on delete cascade,  -- estetica_id en el doc
  created_at  timestamptz not null default now()
);

create index if not exists idx_phone_registry_tenant on phone_registry(tenant_id);

-- ============================================================
-- 3. ACTIVATION_TOKENS: token de un solo uso para vincular al
--    DUEÑO por WhatsApp (doc sección 11). Distinto del codigo_publico:
--    éste expira y se invalida tras un solo uso.
-- ============================================================
create table if not exists activation_tokens (
  token       text primary key,                 -- ej: "8f2c91"
  tenant_id   uuid not null references tenants(id) on delete cascade,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null,             -- ej: created_at + 15 min
  used_at     timestamptz                       -- null hasta que se use
);

create index if not exists idx_activation_tokens_tenant on activation_tokens(tenant_id);

-- ============================================================
-- 4. EXPENSES: gastos registrados por el dueño (doc sección 4)
-- ============================================================
create table if not exists expenses (
  id             uuid primary key default uuid_generate_v4(),
  tenant_id      uuid not null references tenants(id) on delete cascade,  -- estetica_id en el doc
  monto          numeric(10,2) not null,
  concepto       text,
  fecha          date not null default current_date,
  registrado_por text,                           -- teléfono o nombre de quien lo registró
  created_at     timestamptz not null default now()
);

create index if not exists idx_expenses_tenant on expenses(tenant_id);
create index if not exists idx_expenses_fecha  on expenses(tenant_id, fecha);

-- ============================================================
-- 5. RLS (Row Level Security)
-- ============================================================
-- Mismo patrón que el resto del schema: aislamiento por tenant vía JWT.
-- El worker del webhook usa el service_role, que ignora RLS por diseño.

alter table phone_registry    enable row level security;
alter table activation_tokens enable row level security;
alter table expenses          enable row level security;

-- expenses: el dashboard del dueño necesita leer/escribir sus gastos.
drop policy if exists "tenant_isolation" on expenses;
create policy "tenant_isolation" on expenses
  using (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid)
  with check (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

-- phone_registry y activation_tokens: escritas por el worker (service_role).
-- Se habilita RLS y se permite lectura al tenant dueño para el dashboard.
drop policy if exists "tenant_isolation" on phone_registry;
create policy "tenant_isolation" on phone_registry
  for select
  using (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

drop policy if exists "tenant_isolation" on activation_tokens;
create policy "tenant_isolation" on activation_tokens
  for select
  using (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

-- ============================================================
-- 6. HELPERS opcionales
-- ============================================================
-- Genera un codigo_publico corto y legible si el tenant aún no tiene.
-- Uso: select ensure_codigo_publico('<tenant_uuid>');
create or replace function ensure_codigo_publico(p_tenant_id uuid)
returns text language plpgsql as $$
declare
  v_code text;
begin
  select codigo_publico into v_code from tenants where id = p_tenant_id;
  if v_code is not null then
    return v_code;
  end if;
  -- Reintenta hasta obtener uno único
  loop
    v_code := upper(substr(md5(gen_random_uuid()::text), 1, 6));
    begin
      update tenants set codigo_publico = v_code where id = p_tenant_id;
      return v_code;
    exception when unique_violation then
      -- colisión rarísima; reintenta
    end;
  end loop;
end;
$$;

-- ============================================================
-- FIN Fase 1
-- ============================================================
