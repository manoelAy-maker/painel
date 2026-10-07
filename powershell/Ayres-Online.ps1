# AYRES Online PowerShell
# Carrega comandos na sessao atual. Nao instala modulo e nao grava token no disco.

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$script:AyresApiUrl = 'https://qzjwjylpbmnggczrbgoe.supabase.co/functions/v1/ayres-api'
$script:AyresToken = $null
$script:AyresUsuario = $null

function Invoke-Ayres {
    param(
        [Parameter(Mandatory=$true)][string]$Acao,
        [hashtable]$Dados = @{}
    )

    $body = @{} + $Dados
    $body.acao = $Acao
    $headers = @{ 'Content-Type' = 'application/json' }
    if ($script:AyresToken) { $headers.Authorization = "Bearer $($script:AyresToken)" }

    try {
        Invoke-RestMethod -Method Post -Uri $script:AyresApiUrl -Headers $headers -Body ($body | ConvertTo-Json -Depth 10) -TimeoutSec 30
    }
    catch {
        $msg = $_.Exception.Message
        if ($_.ErrorDetails -and $_.ErrorDetails.Message) {
            try {
                $detail = $_.ErrorDetails.Message | ConvertFrom-Json
                if ($detail.error) { $msg = [string]$detail.error }
            } catch {}
        }
        throw "AYRES: $msg"
    }
}

function Assert-AyresLogin {
    if (-not $script:AyresToken) { throw 'AYRES: use Ayres-Login -Usuario SEU_USUARIO primeiro.' }
}

function Write-AyresChamados {
    param([object[]]$Rows)
    if (-not $Rows -or $Rows.Count -eq 0) {
        Write-Host 'Nenhum registro encontrado.' -ForegroundColor DarkGray
        return
    }

    Write-Host ''
    Write-Host ('{0,-14} {1,-10} {2,-10} {3,-18} {4}' -f 'CHAMADO','PLACA','STATUS','FILIAL','CRIADO EM') -ForegroundColor Cyan
    Write-Host ('-' * 76) -ForegroundColor DarkGray
    foreach ($r in $Rows) {
        $numero = [string]$r.numero
        $placa = [string]$r.placa
        $status = [string]$r.status
        $filial = [string]$r.filial
        $data = if ($r.criado_at) { try { ([datetime]$r.criado_at).ToLocalTime().ToString('dd/MM/yyyy HH:mm') } catch { [string]$r.criado_at } } else { '' }
        Write-Host ('{0,-14} {1,-10} ' -f $numero,$placa) -NoNewline
        if ($status -eq 'Aberto') { Write-Host ('{0,-10}' -f $status) -ForegroundColor Green -NoNewline }
        elseif ($status -eq 'Fechado') { Write-Host ('{0,-10}' -f $status) -ForegroundColor DarkGray -NoNewline }
        else { Write-Host ('{0,-10}' -f $status) -ForegroundColor Yellow -NoNewline }
        Write-Host (' {0,-18} {1}' -f $filial,$data)
    }
    Write-Host ''
}

function Ayres-Login {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$true)][string]$Usuario,
        [SecureString]$Senha
    )

    if (-not $Senha) { $Senha = Read-Host 'Senha AYRES' -AsSecureString }
    $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Senha)
    try {
        $senhaTexto = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
        $r = Invoke-Ayres -Acao 'login' -Dados @{ usuario=$Usuario; senha=$senhaTexto }
    }
    finally {
        if ($ptr -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
        $senhaTexto = $null
    }

    if (-not $r.token) { throw 'AYRES: login nao retornou token.' }
    $script:AyresToken = [string]$r.token
    $script:AyresUsuario = [string]$r.usuario
    Write-Host "Conectado ao AYRES como $($script:AyresUsuario)." -ForegroundColor Cyan
}

function Ayres-Logout {
    if ($script:AyresToken) { try { Invoke-Ayres -Acao 'logout' | Out-Null } catch {} }
    $script:AyresToken = $null
    $script:AyresUsuario = $null
    Write-Host 'Sessao encerrada.' -ForegroundColor DarkGray
}

function Ayres-NovoChamado {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$true)][string]$Placa,
        [Parameter(Mandatory=$true)][string]$Numero
    )
    Assert-AyresLogin
    $r = Invoke-Ayres -Acao 'novo_chamado' -Dados @{ placa=$Placa.ToUpperInvariant(); numero=$Numero }
    Write-Host 'Chamado criado.' -ForegroundColor Green
    Write-AyresChamados @($r.chamado)
}

function Ayres-FecharChamado {
    [CmdletBinding()]
    param([Parameter(Mandatory=$true)][string]$Placa)
    Assert-AyresLogin
    $r = Invoke-Ayres -Acao 'fechar_chamado' -Dados @{ placa=$Placa.ToUpperInvariant() }
    Write-Host 'Chamado fechado.' -ForegroundColor Yellow
    Write-AyresChamados @($r.chamado)
}

function Ayres-Placa {
    [CmdletBinding()]
    param([Parameter(Mandatory=$true,Position=0)][string]$Placa)
    Assert-AyresLogin
    $r = Invoke-Ayres -Acao 'placa' -Dados @{ placa=$Placa.ToUpperInvariant() }
    Write-AyresChamados @($r.chamados)
}

function Ayres-Chamado {
    [CmdletBinding()]
    param([Parameter(Mandatory=$true,Position=0)][string]$Numero)
    Assert-AyresLogin
    $r = Invoke-Ayres -Acao 'chamado' -Dados @{ numero=$Numero }
    Write-AyresChamados @($r.chamados)
}

function Ayres-ListarChamados {
    [CmdletBinding()]
    param()
    Assert-AyresLogin
    $r = Invoke-Ayres -Acao 'listar_chamados'
    Write-AyresChamados @($r.chamados)
}

function Ayres-Historico {
    [CmdletBinding()]
    param([Parameter(Mandatory=$true)][string]$Placa)
    Assert-AyresLogin
    $r = Invoke-Ayres -Acao 'historico' -Dados @{ placa=$Placa.ToUpperInvariant() }
    @($r.historico) | Select-Object criado_at,evento,usuario,detalhes | Format-Table -AutoSize
}

function Ayres-Observacao {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$true)][string]$Placa,
        [Parameter(Mandatory=$true)][string]$Texto
    )
    Assert-AyresLogin
    $r = Invoke-Ayres -Acao 'observacao' -Dados @{ placa=$Placa.ToUpperInvariant(); texto=$Texto }
    Write-Host 'Observacao registrada.' -ForegroundColor Cyan
    @($r.observacao) | Format-Table -AutoSize
}

function Ayres-Status {
    if ($script:AyresToken) {
        Write-Host "AYRES conectado como $($script:AyresUsuario)" -ForegroundColor Green
    } else {
        Write-Host 'AYRES desconectado.' -ForegroundColor Yellow
    }
    Write-Host "API: $script:AyresApiUrl" -ForegroundColor DarkGray
}

function Ayres-Ajuda {
    Write-Host ''
    Write-Host 'AYRES PowerShell Online' -ForegroundColor Cyan
    Write-Host '======================='
    Write-Host 'Ayres-Login -Usuario manoel'
    Write-Host 'Ayres-NovoChamado -Placa ABC1E75 -Numero 17103739'
    Write-Host 'Ayres-FecharChamado -Placa ABC1E75'
    Write-Host 'Ayres-Placa ABC1E75'
    Write-Host 'Ayres-Chamado 17103739'
    Write-Host 'Ayres-ListarChamados'
    Write-Host 'Ayres-Historico -Placa ABC1E75'
    Write-Host 'Ayres-Observacao -Placa ABC1E75 -Texto "Aguardando retorno da logistica"'
    Write-Host 'Ayres-Status'
    Write-Host 'Ayres-Logout'
    Write-Host ''
}

Write-Host 'AYRES carregado nesta sessao. Use Ayres-Ajuda.' -ForegroundColor Cyan
