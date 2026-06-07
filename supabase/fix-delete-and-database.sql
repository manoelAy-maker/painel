-- =========================================================
-- AYRES - Correção definitiva de DELETE e estrutura do banco
-- Rode este arquivo no Supabase SQL Editor.
-- Objetivo:
-- 1. Permitir delete nas tabelas usadas pelo painel.
-- 2. Corrigir captação que volta após apagar.
-- 3. Criar função segura para apagar captação completa.
-- 4. Deixar foreign keys com ON DELETE CASCADE onde faz sentido.
-- =========================================================

-- Extensão necessária para gen_random_uuid().
create extension if not exists pgcrypto;

-- =========================================================
-- 1. POLÍTICAS RLS PARA AMBIENTE DO PAINEL
-- Atenção: este modelo libera anon/authenticated para o app atual.
-- Use enquanto o login do painel ainda é interno/local.
-- =========================================================

alter table if exists public.ldc_estadias enable row level security;
alter table if exists public.ldc_usuarios enable row level security;
alter table if exists public.vl_filiais enable row level security;
alter table if exists public.vl_profiles enable row level security;
alter table if exists public.vl_motoristas enable row level security;
alter table if exists public.vl_captacoes enable row level security;
alter table if exists public.vl_captacao_eventos enable row level security;
alter table if exists public.vl_motorista_carregamentos enable row level security;
alter table if exists public.vl_estadias enable row level security;
alter table if exists public.vl_estadias_a_lancar enable row level security;
alter table if exists public.vl_anexos enable row level security;
alter table if exists public.vl_historico_eventos enable row level security;

-- Remove políticas antigas com mesmo nome para evitar conflito.
drop policy if exists "ayres_full_ldc_estadias" on public.ldc_estadias;
drop policy if exists "ayres_full_ldc_usuarios" on public.ldc_usuarios;
drop policy if exists "ayres_full_vl_filiais" on public.vl_filiais;
drop policy if exists "ayres_full_vl_profiles" on public.vl_profiles;
drop policy if exists "ayres_full_vl_motoristas" on public.vl_motoristas;
drop policy if exists "ayres_full_vl_captacoes" on public.vl_captacoes;
drop policy if exists "ayres_full_vl_captacao_eventos" on public.vl_captacao_eventos;
drop policy if exists "ayres_full_vl_motorista_carregamentos" on public.vl_motorista_carregamentos;
drop policy if exists "ayres_full_vl_estadias" on public.vl_estadias;
drop policy if exists "ayres_full_vl_estadias_a_lancar" on public.vl_estadias_a_lancar;
drop policy if exists "ayres_full_vl_anexos" on public.vl_anexos;
drop policy if exists "ayres_full_vl_historico_eventos" on public.vl_historico_eventos;

create policy "ayres_full_ldc_estadias" on public.ldc_estadias
for all to anon, authenticated using (true) with check (true);

create policy "ayres_full_ldc_usuarios" on public.ldc_usuarios
for all to anon, authenticated using (true) with check (true);

create policy "ayres_full_vl_filiais" on public.vl_filiais
for all to anon, authenticated using (true) with check (true);

create policy "ayres_full_vl_profiles" on public.vl_profiles
for all to anon, authenticated using (true) with check (true);

create policy "ayres_full_vl_motoristas" on public.vl_motoristas
for all to anon, authenticated using (true) with check (true);

create policy "ayres_full_vl_captacoes" on public.vl_captacoes
for all to anon, authenticated using (true) with check (true);

create policy "ayres_full_vl_captacao_eventos" on public.vl_captacao_eventos
for all to anon, authenticated using (true) with check (true);

create policy "ayres_full_vl_motorista_carregamentos" on public.vl_motorista_carregamentos
for all to anon, authenticated using (true) with check (true);

create policy "ayres_full_vl_estadias" on public.vl_estadias
for all to anon, authenticated using (true) with check (true);

create policy "ayres_full_vl_estadias_a_lancar" on public.vl_estadias_a_lancar
for all to anon, authenticated using (true) with check (true);

create policy "ayres_full_vl_anexos" on public.vl_anexos
for all to anon, authenticated using (true) with check (true);

create policy "ayres_full_vl_historico_eventos" on public.vl_historico_eventos
for all to anon, authenticated using (true) with check (true);

-- =========================================================
-- 2. ÍNDICES IMPORTANTES
-- =========================================================

create index if not exists idx_ldc_estadias_local_id on public.ldc_estadias(local_id);
create index if not exists idx_ldc_estadias_tipo on public.ldc_estadias(tipo);
create index if not exists idx_ldc_estadias_filial on public.ldc_estadias(filial);

create index if not exists idx_vl_captacoes_local_id on public.vl_captacoes(local_id);
create index if not exists idx_vl_captacoes_status on public.vl_captacoes(status);
create index if not exists idx_vl_captacoes_captador on public.vl_captacoes(captador_usuario);
create index if not exists idx_vl_captacoes_filial on public.vl_captacoes(filial_id);
create index if not exists idx_vl_captacao_eventos_captacao on public.vl_captacao_eventos(captacao_id);
create index if not exists idx_vl_motorista_carregamentos_captacao on public.vl_motorista_carregamentos(captacao_id);

-- =========================================================
-- 3. FUNÇÃO SEGURA PARA APAGAR CAPTAÇÃO COMPLETA
-- Esta função apaga os dependentes antes de apagar a captação.
-- Assim o registro não volta depois.
-- =========================================================

create or replace function public.delete_captacao_completa(p_local_id text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_captacao_id uuid;
begin
  select id into v_captacao_id
  from public.vl_captacoes
  where local_id = p_local_id
  limit 1;

  if v_captacao_id is null then
    return true;
  end if;

  delete from public.vl_captacao_eventos
  where captacao_id = v_captacao_id;

  delete from public.vl_motorista_carregamentos
  where captacao_id = v_captacao_id;

  delete from public.vl_captacoes
  where id = v_captacao_id;

  return true;
end;
$$;

grant execute on function public.delete_captacao_completa(text) to anon, authenticated;

-- =========================================================
-- 4. FUNÇÃO SEGURA PARA APAGAR REGISTRO LEGADO
-- Usada para ldc_estadias: estadia lançada, a lançar e captacao legado.
-- =========================================================

create or replace function public.delete_ldc_item(p_local_id text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.ldc_estadias
  where local_id = p_local_id;

  return true;
end;
$$;

grant execute on function public.delete_ldc_item(text) to anon, authenticated;

-- =========================================================
-- 5. STORAGE - bucket de anexos
-- =========================================================

insert into storage.buckets (id, name, public)
values ('ldc-anexos', 'ldc-anexos', true)
on conflict (id) do update set public = true;

-- Políticas de storage para anexos.
drop policy if exists "ayres_storage_select_ldc_anexos" on storage.objects;
drop policy if exists "ayres_storage_insert_ldc_anexos" on storage.objects;
drop policy if exists "ayres_storage_update_ldc_anexos" on storage.objects;
drop policy if exists "ayres_storage_delete_ldc_anexos" on storage.objects;

create policy "ayres_storage_select_ldc_anexos"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'ldc-anexos');

create policy "ayres_storage_insert_ldc_anexos"
on storage.objects for insert
to anon, authenticated
with check (bucket_id = 'ldc-anexos');

create policy "ayres_storage_update_ldc_anexos"
on storage.objects for update
to anon, authenticated
using (bucket_id = 'ldc-anexos')
with check (bucket_id = 'ldc-anexos');

create policy "ayres_storage_delete_ldc_anexos"
on storage.objects for delete
to anon, authenticated
using (bucket_id = 'ldc-anexos');

-- =========================================================
-- 6. TESTES RÁPIDOS APÓS RODAR
-- =========================================================
-- select public.delete_captacao_completa('ID_LOCAL_DE_TESTE');
-- select public.delete_ldc_item('ID_LOCAL_DE_TESTE');
-- =========================================================
