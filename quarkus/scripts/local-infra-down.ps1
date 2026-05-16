param(
    [string]$EnvFile = "",
    [switch]$Volumes
)

$ErrorActionPreference = "Stop"

$QuarkusRoot = Split-Path -Parent $PSScriptRoot
$ComposeFile = Join-Path $QuarkusRoot "docker-compose.yml"

if ([string]::IsNullOrWhiteSpace($EnvFile)) {
    $LocalEnvFile = Join-Path $QuarkusRoot "local\infra.env"
    $ExampleEnvFile = Join-Path $QuarkusRoot "local\infra.env.example"
    $EnvFile = if (Test-Path $LocalEnvFile) { $LocalEnvFile } else { $ExampleEnvFile }
}

$ComposeArgs = @("compose", "-f", $ComposeFile, "--env-file", $EnvFile, "down")
if ($Volumes) {
    $ComposeArgs += "-v"
}

& docker @ComposeArgs
