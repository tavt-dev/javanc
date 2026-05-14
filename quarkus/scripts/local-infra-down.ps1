param(
    [string]$EnvFile = "",
    [switch]$Volumes
)

$ErrorActionPreference = "Stop"

$QuarkusRoot = Split-Path -Parent $PSScriptRoot
$ComposeFile = Join-Path $QuarkusRoot "docker-compose.yml"

if ([string]::IsNullOrWhiteSpace($EnvFile)) {
    $EnvFile = Join-Path $QuarkusRoot "local\infra.env.example"
}

$ComposeArgs = @("compose", "-f", $ComposeFile, "--env-file", $EnvFile, "down")
if ($Volumes) {
    $ComposeArgs += "-v"
}

& docker @ComposeArgs
