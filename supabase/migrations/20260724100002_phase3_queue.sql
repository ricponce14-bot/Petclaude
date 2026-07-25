-- ============================================================
-- Apúntame.mx — Fase 3: Cola de eventos entrantes (webhook async)
-- ============================================================
-- Doc sección 5: el webhook inserta el evento crudo aquí y responde 200 OK;
-- un worker aparte lo procesa. Idempotente por message_id (Meta reintenta).
-- ============================================================

create extension if not exists "uuid-ossp";

create table if not exists wa_inbound_queue (
  id               uuid primary key default uuid_generate_v4(),
  message_id       text unique,                 -- id del mensaje de Meta (idempotencia)
  phone_number_id  text,                        -- número central que recibió (metadata)
  from_phone       text not null,               -- teléfono del remitente
  contact_name     text,                        -- nombre de perfil de WhatsApp
  msg_type         text,                        -- text | audio | interactive | image | ...
  raw              jsonb not null,              -- payload crudo del mensaje
  status           text not null default 'pending', -- pending | processing | done | error
  attempts         int  not null default 0,
  error            text,
  created_at       timestamptz not null default now(),
  processed_at     timestamptz
);

-- Índice para que el worker tome pendientes rápido (FIFO).
create index if not exists idx_wa_queue_pending
  on wa_inbound_queue(created_at) where status = 'pending';

create index if not exists idx_wa_queue_status on wa_inbound_queue(status);

-- RLS: solo el service_role (worker) toca esta tabla.
alter table wa_inbound_queue enable row level security;
-- Sin políticas públicas: nadie con anon/authenticated puede leerla.
-- (El service_role ignora RLS por diseño.)

-- ============================================================
-- Claim atómico de un lote de eventos pendientes.
-- Marca como 'processing' y devuelve las filas, evitando que dos
-- invocaciones del worker tomen el mismo evento (FOR UPDATE SKIP LOCKED).
-- ============================================================
create or replace function claim_inbound_batch(p_limit int default 10)
returns setof wa_inbound_queue
language plpgsql
as $$
begin
  return query
  update wa_inbound_queue q
  set status = 'processing', attempts = q.attempts + 1
  where q.id in (
    select id from wa_inbound_queue
    where status = 'pending'
    order by created_at
    limit p_limit
    for update skip locked
  )
  returning q.*;
end;
$$;
