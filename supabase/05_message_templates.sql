-- supabase/05_message_templates.sql

-- 1. Crear la tabla de plantillas de mensajes
create table if not exists message_templates (
  id          uuid primary key default uuid_generate_v4(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  type        text not null check (type in ('reminder', 'winback', 'birthday', 'manual')),
  body        text not null,
  is_active   boolean default true,
  created_at  timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at  timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(tenant_id, type) -- Solo puede haber una plantilla activa por tipo por veterinaria
);

-- 2. Índices para rápidez
create index if not exists idx_msg_templates_tenant on message_templates(tenant_id);

-- 3. Habilitar Row Level Security (RLS)
alter table message_templates enable row level security;

-- 4. Políticas RLS (Asegura multitenancy)
create policy "Tenants can view their own message templates"
  on message_templates for select
  using (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

create policy "Tenants can insert their own message templates"
  on message_templates for insert
  with check (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

create policy "Tenants can update their own message templates"
  on message_templates for update
  using (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

-- 5. Trigger para el updated_at
create or replace function auto_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at
  before update on message_templates
  for each row
  execute function auto_updated_at();

-- 6. Insertar plantillas por defecto para Tenants existentes (Opcional, pero recomendado)
insert into message_templates (tenant_id, type, body)
select id, 'reminder', 'Hola {owner_name}, te recordamos que {pet_name} tiene cita mañana a las {time}. ¡Los esperamos en Ladrido!'
from tenants
on conflict (tenant_id, type) do nothing;

insert into message_templates (tenant_id, type, body)
select id, 'winback', '¡Hola {owner_name}! Ha pasado un mes desde la última visita de {pet_name}. Agenda hoy y obtén 10% de descuento en su próximo baño. 🛁'
from tenants
on conflict (tenant_id, type) do nothing;

insert into message_templates (tenant_id, type, body)
select id, 'birthday', '🎉 ¡Feliz cumpleaños {pet_name}! 🐾 En Ladrido le mandamos un abrazo gigante y un premio sorpresa en su próxima visita hoy o mañana.'
from tenants
on conflict (tenant_id, type) do nothing;
