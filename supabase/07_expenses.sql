-- supabase/07_expenses.sql
-- Ejecutar en Supabase SQL Editor

-- ============================================================
-- EXPENSES (control de gastos del negocio)
-- ============================================================
create table if not exists expenses (
  id          uuid primary key default uuid_generate_v4(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  category    text not null check (category in ('supplies', 'rent', 'payroll', 'utilities', 'veterinary', 'other')),
  description text not null,
  amount      numeric(10,2) not null,
  date        date not null default current_date,
  created_at  timestamptz default now()
);

-- Índices
create index if not exists idx_expenses_tenant on expenses(tenant_id);
create index if not exists idx_expenses_date   on expenses(tenant_id, date);

-- RLS
alter table expenses enable row level security;

create policy "Tenants can view their own expenses"
  on expenses for select
  using (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

create policy "Tenants can insert their own expenses"
  on expenses for insert
  with check (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

create policy "Tenants can update their own expenses"
  on expenses for update
  using (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

create policy "Tenants can delete their own expenses"
  on expenses for delete
  using (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);
