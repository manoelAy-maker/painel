# AYRES PowerShell
# Modulo oficial para integracao com o Painel AYRES.
# Nao grava dados localmente. A sessao fica apenas em memoria.

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$script:AyresApiUrl = if ($env:AYRES_API_URL) { $env:AYRES_API_URL } else { 'https://qzjwjylpbmnggczrbgoe.supabase.co/functions/v1/ayres-api' }
$script:AyresSessionToken = $null
$script:AyresUsuario = $null

function Invoke-AyresApi {
    param(
        [Parameter(Mandatory=$true)][string]$Acao,
        [hashtable]$Dados = @{}
    )

    $payload = @{} + $Dados
    $payload.acao = $Acao

    $headers = @{ 'Content-Type' = 'application/json' }
    if ($script:AyresSessionToken) {
        $headers.Authorization = "Bearer $($script:AyresSessionToken)"
    }

    try {
        return Invoke-RestMethod -Method Post -Uri $script:AyresApiUrl -Headers $headers -Body ($payload | ConvertTo-Json -Depth 8) -TimeoutSec 30
    }
    catch {
        $msg = $_.Exception.Message
        if ($_.ErrorDetails -and $_.ErrorDetails.Message) {
            try {
                $erro = $_.ErrorDetails.Message | ConvertFrom-Json
                if ($erro.error) { $msg = $erro.error }
            } catch {}
        }
        throw "AYRES: $msg"
    }
}

function Assert-AyresLogin {
    if (-not $script:AyresSessionToken) {
        throw 'AYRES: faca login primeiro com Ayres-Login.'
    }
}

function Write-AyresStatus {
    param([string]$Status)
    switch ($Status.ToLowerInvariant()) {
        'aberto'  { Write-Host $Status -ForegroundColor Green }
        'fechado' { Write-Host $Status -ForegroundColor DarkGray }
        default   { Write-Host $Status -ForegroundColor Yellow }
    }
}

function Format-AyresTabela {
    param([object[]]$Dados)
    if (-not $Dados -or $Dados.Count -eq 0) {
        Write-Host 'Nenhum registro encontrado.' -ForegroundColor DarkGray
        return
    }
    $Dados | Format-Table -AutoSize
}

function Ayres-Login {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$true)][string]$Usuario,
        [SecureString]$Senha
    )

    if (-not $Senha) {
        $Senha = Read-Host 'Senha AYRES' -AsSecureString
    }

    $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Senha)
    try {
        $senhaTexto = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
        $r = Invoke-AyresApi -Acao 'login' -Dados @{ usuario=$Usuario; senha=$senhaTexto }
    }
    finally {
        if ($ptr -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
        $senhaTexto = $null
    }

    if (-not $r.token) { throw 'AYRES: login nao retornou uma sessao valida.' }
    $script:AyresSessionToken = [string]$r.token
    $script:AyresUsuario = [string]$r.usuario
    Write-Host "Conectado ao AYRES como $($script:AyresUsuario)." -ForegroundColor Cyan
}

function Ayres-Logout {
    if ($script:AyresSessionToken) {
        try { Invoke-AyresApi -Acao 'logout' | Out-Null } catch {}
    }
    $script:AyresSessionToken = $null
    $script:AyresUsuario = $null
    Write-Host 'Sessao AYRES encerrada.' -ForegroundColor DarkGray
}

function Ayres-NovoChamado {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$true)][string]$Placa,
        [Parameter(Mandatory=$true)][string]$Numero
    )
    Assert-AyresLogin
    $r = Invoke-AyresApi -Acao 'novo_chamado' -Dados @{ placa=$Placa.ToUpperInvariant(); numero=$Numero }
    Write-Host 'Chamado criado com sucesso.' -ForegroundColor Green
    Format-AyresTabela @($r.chamado)
}

function Ayres-FecharChamado {
    [CmdletBinding()]
    param([Parameter(Mandatory=$true)][string]$Placa)
    Assert-AyresLogin
    $r = Invoke-AyresApi -Acao 'fechar_chamado' -Dados @{ placa=$Placa.ToUpperInvariant() }
    Write-Host 'Chamado fechado.' -ForegroundColor Yellow
    Format-AyresTabela @($r.chamado)
}

function Ayres-Placa {
    [CmdletBinding()]
    param([Parameter(Mandatory=$true,Position=0)][string]$Placa)
    Assert-AyresLogin
    $r = Invoke-AyresApi -Acao 'placa' -Dados @{ placa=$Placa.ToUpperInvariant() }
    Format-AyresTabela @($r.chamados)
}

function Ayres-Chamado {
    [CmdletBinding()]
    param([Parameter(Mandatory=$true,Position=0)][string]$Numero)
    Assert-AyresLogin
    $r = Invoke-AyresApi -Acao 'chamado' -Dados @{ numero=$Numero }
    Format-AyresTabela @($r.chamados)
}

function Ayres-ListarChamados {
    [CmdletBinding()]
    param()
    Assert-AyresLogin
    $r = Invoke-AyresApi -Acao 'listar_chamados'
    Format-AyresTabela @($r.chamados)
}

function Ayres-Historico {
    [CmdletBinding()]
    param([Parameter(Mandatory=$true)][string]$Placa)
    Assert-AyresLogin
    $r = Invoke-AyresApi -Acao 'historico' -Dados @{ placa=$Placa.ToUpperInvariant() }
    Format-AyresTabela @($r.historico)
}

function Ayres-Observacao {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$true)][string]$Placa,
        [Parameter(Mandatory=$true)][string]$Texto
    )
    Assert-AyresLogin
    $r = Invoke-AyresApi -Acao 'observacao' -Dados @{ placa=$Placa.ToUpperInvariant(); texto=$Texto }
    Write-Host 'Observacao registrada.' -ForegroundColor Cyan
    Format-AyresTabela @($r.observacao)
}

function Ayres-Status {
    if ($script:AyresSessionToken) {
        Write-Host "AYRES conectado: $($script:AyresUsuario)" -ForegroundColor Green
        Write-Host "API: $script:AyresApiUrl" -ForegroundColor DarkGray
    } else {
        Write-Host 'AYRES desconectado. Use Ayres-Login -Usuario SEU_USUARIO.' -ForegroundColor Yellow
    }
}

function Ayres-Ajuda {
    Write-Host ''
    Write-Host 'AYRES PowerShell' -ForegroundColor Cyan
    Write-Host '================' -ForegroundColor DarkCyan
    Write-Host 'Ayres-Login -Usuario manoel'
    Write-Host 'Ayres-Logout'
    Write-Host 'Ayres-NovoChamado -Placa ABC1E75 -Numero 17103739'
    Write-Host 'Ayres-FecharChamado -Placa ABC1E75'
    Write-Host 'Ayres-Placa ABC1E75'
    Write-Host 'Ayres-Chamado 17103739'
    Write-Host 'Ayres-ListarChamados'
    Write-Host 'Ayres-Historico -Placa ABC1E75'
    Write-Host 'Ayres-Observacao -Placa ABC1E75 -Texto "Aguardando retorno da logistica"'
    Write-Host 'Ayres-Status'
    Write-Host ''
}

Export-ModuleMember -Function Ayres-Login,Ayres-Logout,Ayres-NovoChamado,Ayres-FecharChamado,Ayres-Placa,Ayres-Chamado,Ayres-ListarChamados,Ayres-Historico,Ayres-Observacao,Ayres-Status,Ayres-Ajuda
