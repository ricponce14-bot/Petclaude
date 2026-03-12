-- supabase/15_wa_messages_rls_delete_fix.sql
-- Arreglo a las políticas de seguridad (RLS) para la tabla wa_messages.
-- 1. Soporte para user_metadata (para usuarios de prueba/manuales).
-- 2. Permitir el borrado de mensajes (DELETE) para que funcione el dashboard.

-- Eliminar políticas antiguas
DROP POLICY IF EXISTS "tenant_isolation" ON wa_messages;

-- Nueva política de visualización (SELECT)
CREATE POLICY "tenant_isolation_select" ON wa_messages
  FOR SELECT USING (tenant_id = COALESCE((auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid));

-- Nueva política de inserción (INSERT)
CREATE POLICY "tenant_isolation_insert" ON wa_messages
  FOR INSERT WITH CHECK (tenant_id = COALESCE((auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid));

-- Nueva política de actualización (UPDATE)
CREATE POLICY "tenant_isolation_update" ON wa_messages
  FOR UPDATE USING (tenant_id = COALESCE((auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid));

-- Nueva política de borrado (DELETE) - CRUCIAL para el dashboard
CREATE POLICY "tenant_isolation_delete" ON wa_messages
  FOR DELETE USING (tenant_id = COALESCE((auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid));

-- Refrescar el esquema
NOTIFY pgrst, 'reload schema';
