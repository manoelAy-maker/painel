-- AYRES Pro v2 - Estrutura inicial
-- Rode este SQL no Supabase novo.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  usuario text unique not null,
  nome text not null,
  cargo text not null default 'Operador',
  filial_id text not null default 'jatai-go',
  avatar text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.filiais (
  id text primary key,
  nome text not null,
  cidade text,
  estado text,
  ativa boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.motoristas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  telefone text,
  telefone_limpo text unique,
  cidade text,
  observacao text,
  criado_por text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.transportadoras (
  id text primary key,
  nome text not null,
  ativa boolean not null default true,
  criado_por text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.estadias (
  id uuid primary key default gen_random_uuid(),
  local_id text unique not null,
  filial_id text references public.filiais(id),
  nf text,
  chamado text,
  motorista_id uuid references public.motoristas(id),
  motorista_nome text,
  telefone_motorista text,
  transportadora_id text references public.transportadoras(id),
  transportadora_nome text,
  placa text,
  peso numeric,
  prioridade text not null default 'Normal',
  pago_por text not null default 'Logística',
  status text not null default 'Aberto',
  chegada_em timestamptz,
  saida_em timestamptz,
  horas numeric,
  valor numeric,
  anexos jsonb not null default '[]'::jsonb,
  criado_por text,
  feito_por text,
  finalizado_por text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.captacoes (
  id uuid primary key default gen_random_uuid(),
  local_id text unique not null,
  filial_id text references public.filiais(id),
  motorista_id uuid references public.motoristas(id),
  captador_usuario text,
  operacao text not null default 'Farelo',
  status text not null default 'lead',
  quantidade_cargas integer not null default 1,
  motivo_nao_carregou text,
  justificativa_nao_carregou text,
  impacto_pontuacao text not null default 'externo',
  observacao text,
  data_captacao timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.eventos (
  id uuid primary key default gen_random_uuid(),
  origem text not null,
  origem_id text,
  usuario text,
  acao text not null,
  descricao text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

insert into public.filiais (id, nome, cidade, estado)
values
  ('jatai-go', 'Jataí - GO', 'Jataí', 'GO'),
  ('mineiros-go', 'Mineiros - GO', 'Mineiros', 'GO')
on conflict (id) do nothing;

-- RLS será ativado na fase de autenticação real.
