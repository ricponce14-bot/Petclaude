-- supabase/13_message_templates_rls_fix.sql
-- Arreglo a las políticas de seguridad (RLS) para permitir guardar las plantillas de mensajes.
-- Corrige el error: "new row violates row-level security policy for table message_templates"

-- 1. Eliminar políticas antiguas restrictivas
DROP POLICY IF EXISTS "Tenants can view their own message templates" ON message_templates;
DROP POLICY IF EXISTS "Tenants can insert their own message templates" ON message_templates;
DROP POLICY IF EXISTS "Tenants can update their own message templates" ON message_templates;
DROP POLICY IF EXISTS "Tenants can delete their own message templates" ON message_templates;

-- 2. Crear nuevas políticas con soporte flexible de tenant_id (app_metadata o user_metadata)
CREATE POLICY "Tenants can view their own message templates"
  ON message_templates FOR SELECT
  USING (tenant_id = COALESCE((auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY "Tenants can insert their own message templates"
  ON message_templates FOR INSERT
  WITH CHECK (tenant_id = COALESCE((auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY "Tenants can update their own message templates"
  ON message_templates FOR UPDATE
  USING (tenant_id = COALESCE((auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid))
  WITH CHECK (tenant_id = COALESCE((auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY "Tenants can delete their own message templates"
  ON message_templates FOR DELETE
  USING (tenant_id = COALESCE((auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid));

-- 3. Refrescar el caché
NOTIFY pgrst, 'reload schema';
