param(
    [string]$EnvFile = ""
)

$ErrorActionPreference = "Stop"

$QuarkusRoot = Split-Path -Parent $PSScriptRoot
$ComposeFile = Join-Path $QuarkusRoot "docker-compose.yml"

if ([string]::IsNullOrWhiteSpace($EnvFile)) {
    $EnvFile = Join-Path $QuarkusRoot "local\infra.env.example"
}

docker compose -f $ComposeFile --env-file $EnvFile up -d

Write-Host "Local infrastructure is starting."
Write-Host "Kafka UI:  http://localhost:9080"
Write-Host "Mailpit:   http://localhost:8025"
