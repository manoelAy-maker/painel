-- AYRES CLI / PowerShell
create extension if not exists pgcrypto;

create table if not exists public.ayres_chamados (
  id uuid primary key default gen_random_uuid(),
  numero text not null unique,
  placa text not null,
  status text not null default 'Aberto' check (status in ('Aberto','Fechado')),
  filial text,
  criado_por text not null,
  criado_at timestamptz not null default now(),
  fechado_por text,
  fechado_at timestamptz
);

create index if not exists idx_ayres_chamados_placa on public.ayres_chamados (placa);
create index if not exists idx_ayres_chamados_status on public.ayres_chamados (status);
create index if not exists idx_ayres_chamados_criado_at on public.ayres_chamados (criado_at desc);

create table if not exists public.ayres_observacoes (
  id uuid primary key default gen_random_uuid(),
  chamado_id uuid references public.ayres_chamados(id) on delete cascade,
  placa text not null,
  texto text not null,
  usuario text not null,
  criado_at timestamptz not null default now()
);
create index if not exists idx_ayres_observacoes_placa on public.ayres_observacoes (placa);

create table if not exists public.ayres_historico (
  id uuid primary key default gen_random_uuid(),
  chamado_id uuid references public.ayres_chamados(id) on delete set null,
  placa text not null,
  evento text not null,
  detalhes jsonb not null default '{}'::jsonb,
  usuario text not null,
  criado_at timestamptz not null default now()
);
create index if not exists idx_ayres_historico_placa on public.ayres_historico (placa);
create index if not exists idx_ayres_historico_criado_at on public.ayres_historico (criado_at desc);

create table if not exists public.ayres_api_sessions (
  token_hash text primary key,
  usuario text not null,
  filial text,
  cargo text,
  criado_at timestamptz not null default now(),
  expira_em timestamptz not null,
  ultimo_uso timestamptz not null default now()
);
create index if not exists idx_ayres_api_sessions_expira on public.ayres_api_sessions (expira_em);

alter table public.ayres_chamados enable row level security;
alter table public.ayres_observacoes enable row level security;
alter table public.ayres_historico enable row level security;
alter table public.ayres_api_sessions enable row level security;

comment on table public.ayres_chamados is 'Chamados criados pelo AYRES PowerShell/CLI';
comment on table public.ayres_observacoes is 'Observacoes registradas pelo AYRES PowerShell/CLI';
comment on table public.ayres_historico is 'Auditoria de operacoes do AYRES PowerShell/CLI';
comment on table public.ayres_api_sessions is 'Sessoes temporarias da API AYRES; tokens armazenados como hash';
