# AYRES PowerShell

Modulo oficial para operar chamados do Painel AYRES diretamente pelo Windows PowerShell.

## Requisitos

- Windows PowerShell 5.1 ou PowerShell 7+
- Acesso de rede ao Supabase do Painel AYRES
- Usuario ativo no AYRES

## Instalacao manual

Copie a pasta `powershell` para uma pasta chamada `Ayres` dentro de um dos caminhos exibidos por:

```powershell
$env:PSModulePath -split ';'
```

Exemplo por usuario:

```text
C:\Users\SEU_USUARIO\Documents\WindowsPowerShell\Modules\Ayres\
```

Depois:

```powershell
Import-Module Ayres
```

## Login

```powershell
Ayres-Login -Usuario manoel
```

A senha e solicitada como `SecureString`. A sessao recebida da API fica somente na memoria do processo atual do PowerShell. O modulo nao grava senha, token, chamado ou observacao em arquivo local.

## Comandos

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

## API

Por padrao o modulo usa:

```text
https://qzjwjylpbmnggczrbgoe.supabase.co/functions/v1/ayres-api
```

Para homologacao ou outro ambiente:

```powershell
$env:AYRES_API_URL = 'https://SEU-PROJETO.supabase.co/functions/v1/ayres-api'
Import-Module Ayres -Force
```

## Banco

A migration esta em:

```text
database/ayres_cli.sql
```

Ela cria:

- `ayres_chamados`
- `ayres_observacoes`
- `ayres_historico`
- `ayres_api_sessions`

Todas ficam com RLS habilitado e sem acesso publico direto. A ideia e centralizar as operacoes na API AYRES.

## Seguranca

- Nunca coloque `service_role` no PowerShell.
- Nao salve senha ou token em arquivos `.ps1`.
- O token da sessao deve ter expiracao curta.
- A API deve validar usuario, filial e cargo antes de cada operacao.
- Para operadores do Oleo, a API deve respeitar `filial = oleo`.

## Atualizacao

Depois de substituir os arquivos do modulo:

```powershell
Remove-Module Ayres -ErrorAction SilentlyContinue
Import-Module Ayres -Force
```
