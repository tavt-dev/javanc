param(
    [string]$EnvFile = ""
)

$ErrorActionPreference = "Stop"

$QuarkusRoot = Split-Path -Parent $PSScriptRoot
$ComposeFile = Join-Path $QuarkusRoot "docker-compose.yml"

if ([string]::IsNullOrWhiteSpace($EnvFile)) {
    $EnvFile = Join-Path $QuarkusRoot "local\infra.env.example"
}

docker compose -f $ComposeFile --env-file $EnvFile ps

Write-Host ""
Write-Host "Endpoints:"
Write-Host "  MySQL:      localhost:3306"
Write-Host "  MongoDB:    localhost:27017"
Write-Host "  Redis:      localhost:6379"
Write-Host "  Kafka:      localhost:9092"
Write-Host "  Kafka UI:   http://localhost:9080"
Write-Host "  Mailpit UI: http://localhost:8025"
