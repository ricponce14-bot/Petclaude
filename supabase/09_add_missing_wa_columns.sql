-- Ejecutar este archivo en tu editor SQL de Supabase (SQL Editor)
-- Esto solucionará el error de "Could not find the 'owner_id' column of 'wa_messages'"
-- y también forzará a la base de datos a limpiar el caché del esquema (schema cache).

-- 1. Agregamos de manera segura las columnas si por alguna razón no existen:
ALTER TABLE wa_messages 
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES owners(id) ON DELETE SET NULL;

ALTER TABLE wa_messages 
ADD COLUMN IF NOT EXISTS pet_id UUID REFERENCES pets(id) ON DELETE SET NULL;

-- 2. Recargar forzosamente el caché de esquema para la API de Supabase (PostgREST):
NOTIFY pgrst, 'reload schema';
