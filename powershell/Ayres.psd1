@{
    RootModule = 'Ayres.psm1'
    ModuleVersion = '1.0.0'
    GUID = '5b0c66ad-0b69-4b44-b2a1-6fbf6b25640d'
    Author = 'AYRES'
    CompanyName = 'AYRES Logistica'
    Copyright = '(c) 2026 AYRES'
    Description = 'Modulo oficial PowerShell do Painel AYRES.'
    PowerShellVersion = '5.1'
    FunctionsToExport = @(
        'Ayres-Login','Ayres-Logout','Ayres-NovoChamado','Ayres-FecharChamado',
        'Ayres-Placa','Ayres-Chamado','Ayres-ListarChamados','Ayres-Historico',
        'Ayres-Observacao','Ayres-Status','Ayres-Ajuda'
    )
    CmdletsToExport = @()
    VariablesToExport = @()
    AliasesToExport = @()
    PrivateData = @{
        PSData = @{
            Tags = @('AYRES','Logistica','Supabase','PowerShell')
            ProjectUri = 'https://github.com/manoelAy-maker/painel'
        }
    }
}
