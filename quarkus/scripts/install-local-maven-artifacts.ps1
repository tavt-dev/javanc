param(
    [string]$JavaHome = "C:\Program Files\Java\jdk-21"
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$quarkusRoot = Join-Path $repoRoot "quarkus"

if (Test-Path -LiteralPath $JavaHome) {
    $env:JAVA_HOME = $JavaHome
    $env:Path = "$env:JAVA_HOME\bin;$env:Path"
}

Write-Host "Installing Javanc parent POM..."
mvn -f (Join-Path $quarkusRoot "pom.xml") -N install

Write-Host "Installing pagination-common..."
mvn -f (Join-Path $quarkusRoot "pagination-common\pom.xml") install

Write-Host "Local Maven artifacts are ready for standalone service builds."
