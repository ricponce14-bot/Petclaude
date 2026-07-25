-- ============================================================
-- Apúntame.mx — Fase 5: Citas genéricas (multi-sector) para Mía
-- ============================================================
-- El asistente del dueño (Mía) agenda citas dando nombre/teléfono del cliente
-- y un servicio en texto libre, sin depender del modelo canino (pets/owners).
-- Doc secciones 4 y 7. Idempotente.
-- ============================================================

-- Columnas genéricas del cliente/servicio en la cita.
alter table appointments add column if not exists cliente_nombre    text;
alter table appointments add column if not exists cliente_telefono  text;
alter table appointments add column if not exists servicio          text;

-- Relajar NOT NULL de pet_id / owner_id (no aplican a barberías/spas/etc.).
-- Correr esto es seguro aunque ya estén nullable.
alter table appointments alter column pet_id   drop not null;
alter table appointments alter column owner_id drop not null;

create index if not exists idx_appts_cliente_tel on appointments(tenant_id, cliente_telefono);
