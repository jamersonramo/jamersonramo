<#
    Mapeia as unidades de rede do NAS DS1825+ no Windows.
    Uso: ajustar $NasHost e a lista $Compartilhamentos, depois executar
    (ex.: via Agendador de Tarefas no logon do usuário, ou GPO de logon script).

    A senha NAO deve ser hardcoded aqui. Na primeira execucao o Windows pede
    a credencial e oferece salvar no Gerenciador de Credenciais do Windows;
    execucoes seguintes reutilizam a credencial salva automaticamente.
#>

$NasHost = "nas-central"   # ou IP fixo: 192.168.1.10

# Letra de unidade => nome do compartilhamento no NAS
$Compartilhamentos = @{
    "P" = "Publico"
    "D" = "Departamentos"
    "U" = "Usuarios\$env:USERNAME"
}

foreach ($letra in $Compartilhamentos.Keys) {
    $caminhoUNC = "\\$NasHost\$($Compartilhamentos[$letra])"
    $unidade = "$($letra):"

    if (Test-Path $unidade) {
        Write-Host "Unidade $unidade ja mapeada, pulando."
        continue
    }

    try {
        New-PSDrive -Name $letra -PSProvider FileSystem -Root $caminhoUNC -Persist -Scope Global -ErrorAction Stop
        Write-Host "Mapeado $unidade -> $caminhoUNC"
    } catch {
        Write-Warning "Falha ao mapear $unidade ($caminhoUNC): $($_.Exception.Message)"
    }
}
