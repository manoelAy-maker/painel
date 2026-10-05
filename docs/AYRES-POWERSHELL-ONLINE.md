# AYRES PowerShell Online

Uso do Painel AYRES diretamente pelo Windows PowerShell, sem instalar modulo e sem gravar token em arquivo local.

## 1. Carregar os comandos

Abra o PowerShell e execute:

```powershell
irm https://raw.githubusercontent.com/manoelAy-maker/painel/main/powershell/Ayres-Online.ps1 | iex
```

Os comandos ficam disponiveis somente enquanto essa janela do PowerShell estiver aberta.

## 2. Login

```powershell
Ayres-Login -Usuario SEU_USUARIO
```

A senha e solicitada como SecureString e nao fica salva em arquivo. O token de sessao fica somente em memoria.

## 3. Comandos

```powershell
Ayres-NovoChamado -Placa ABC1E75 -Numero 17103739
Ayres-FecharChamado -Placa ABC1E75
Ayres-Placa ABC1E75
Ayres-Chamado 17103739
Ayres-ListarChamados
Ayres-Historico -Placa ABC1E75
Ayres-Observacao -Placa ABC1E75 -Texto "Aguardando retorno da logistica"
Ayres-Status
Ayres-Ajuda
Ayres-Logout
```

## 4. Arquitetura

PowerShell -> Supabase Edge Function `ayres-api` -> PostgreSQL/Supabase.

O PowerShell nunca recebe a service-role key. A Edge Function valida o usuario AYRES e usa uma sessao temporaria. O token bruto nao e armazenado no banco; somente seu SHA-256 e salvo em `ayres_api_sessions`.

## 5. Banco necessario

Migration:

`supabase/migrations/20261005_ayres_cli.sql`

Cria:

- `ayres_chamados`
- `ayres_observacoes`
- `ayres_historico`
- `ayres_api_sessions`

Todas ficam com RLS habilitado e sem policies publicas. A Edge Function faz as operacoes com service role.

## 6. Edge Function

Codigo:

`supabase/functions/ayres-api/index.ts`

Endpoint esperado:

`https://qzjwjylpbmnggczrbgoe.supabase.co/functions/v1/ayres-api`

## 7. Cores

Na listagem do PowerShell:

- Aberto: verde
- Fechado: cinza
- Outros status: amarelo

## 8. Sem instalacao

Nada e instalado no Windows. O comando `irm ... | iex` carrega as funcoes apenas em memoria. Ao fechar o PowerShell, os comandos e o token desaparecem.
