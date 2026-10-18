-- Remove o subsistema legado de controle de embarque.
-- Os registros de captação são preservados, inclusive o status histórico "carregou".

drop trigger if exists trg_vl_captacoes_carregamento on public.vl_captacoes;
drop function if exists public.vl_registrar_carregamento_captacao();
drop view if exists public.vw_motoristas_que_carregam;
drop table if exists public.vl_motorista_carregamentos;
