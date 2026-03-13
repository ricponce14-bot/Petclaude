-- supabase/16_inventory_schema.sql

-- Crear tabla de inventario
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  stock INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 5,
  price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
CREATE POLICY "Tenants can view their own inventory"
  ON inventory FOR SELECT
  USING (tenant_id = COALESCE((auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY "Tenants can insert their own inventory"
  ON inventory FOR INSERT
  WITH CHECK (tenant_id = COALESCE((auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY "Tenants can update their own inventory"
  ON inventory FOR UPDATE
  USING (tenant_id = COALESCE((auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid))
  WITH CHECK (tenant_id = COALESCE((auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY "Tenants can delete their own inventory"
  ON inventory FOR DELETE
  USING (tenant_id = COALESCE((auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid, (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid));

-- Índice para búsquedas por tenant
CREATE INDEX IF NOT EXISTS inventory_tenant_id_idx ON inventory(tenant_id);
