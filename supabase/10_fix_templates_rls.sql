-- supabase/10_fix_templates_rls.sql
-- Este script corrige las politicas de insercion y actualizacion para message_templates.
-- Ejecutalo en tu Supabase SQL Editor para permitir que los usuarios guarden sus plantillas correctamente.

-- Borramos las políticas anteriores que solo leían app_metadata en lugar de usar también user_metadata
drop policy if exists "Tenants can update their own message templates" on message_templates;
drop policy if exists "Tenants can insert their own message templates" on message_templates;

create policy "Tenants can insert their own message templates"
  on message_templates for insert
  with check (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid OR tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid);

create policy "Tenants can update their own message templates"
  on message_templates for update
  using (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid OR tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid);
