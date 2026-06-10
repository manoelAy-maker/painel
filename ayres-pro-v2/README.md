# AYRES Pro v2

Nova versão iniciada do zero, sem apagar o painel atual.

## Objetivo

Criar uma base limpa, profissional e escalável para:

- Portal e login premium;
- Controle de estadias;
- CRM de captação;
- Dashboard executivo;
- Permissões por cargo e filial;
- Supabase como banco principal.

## Banco Supabase

Configure no Vercel ou no arquivo `.env.local`:

```env
VITE_SUPABASE_URL=https://thafodnjbymtuczrykik.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_voxO7IrvV8aeTtsZo9LDYg_eEEOivLh
```

## Estrutura planejada

```txt
src/
  app/
  core/
  modules/
    portal/
    dashboard/
    estadia/
    captacao/
  shared/
  styles/
```

## Primeira fase

- Base visual premium;
- Separação por módulos;
- Cliente Supabase isolado;
- SQL inicial do banco;
- Sem mexer no projeto antigo.
