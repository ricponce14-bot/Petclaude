-- supabase/08_rls_fixes.sql
-- Ejecutar en Supabase SQL Editor
-- Agrega políticas INSERT/UPDATE faltantes a las tablas principales

-- ============================================================
-- TENANTS — el owner puede ver/actualizar su propio tenant
-- ============================================================
create policy "Tenants can view their own tenant"
  on tenants for select
  using (id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

create policy "Tenants can update their own tenant"
  on tenants for update
  using (id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

-- ============================================================
-- OWNERS — agregar INSERT y UPDATE
-- ============================================================
create policy "Tenants can insert owners"
  on owners for insert
  with check (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

create policy "Tenants can update owners"
  on owners for update
  using (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

create policy "Tenants can delete owners"
  on owners for delete
  using (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

-- ============================================================
-- PETS — agregar INSERT y UPDATE
-- ============================================================
create policy "Tenants can insert pets"
  on pets for insert
  with check (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

create policy "Tenants can update pets"
  on pets for update
  using (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

create policy "Tenants can delete pets"
  on pets for delete
  using (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

-- ============================================================
-- APPOINTMENTS — agregar INSERT y UPDATE
-- ============================================================
create policy "Tenants can insert appointments"
  on appointments for insert
  with check (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

create policy "Tenants can update appointments"
  on appointments for update
  using (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

create policy "Tenants can delete appointments"
  on appointments for delete
  using (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

-- NOTA: clinical_records no existe aún en esta BD. Agregar políticas si se crea.

-- ============================================================
-- WA_MESSAGES — agregar INSERT y UPDATE
-- ============================================================
create policy "Tenants can insert wa_messages"
  on wa_messages for insert
  with check (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

create policy "Tenants can update wa_messages"
  on wa_messages for update
  using (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

-- ============================================================
-- WA_SESSIONS — agregar INSERT y UPDATE
-- ============================================================
create policy "Tenants can insert wa_sessions"
  on wa_sessions for insert
  with check (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

create policy "Tenants can update wa_sessions"
  on wa_sessions for update
  using (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

-- ============================================================
-- Migración: agregar columnas Stripe a tenants (si no existen)
-- ============================================================
alter table tenants add column if not exists stripe_customer_id text;
alter table tenants add column if not exists stripe_subscription_id text;
