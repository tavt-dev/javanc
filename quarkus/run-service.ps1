param(
    [Parameter(Mandatory = $true)]
    [ValidateSet(
        "gateway-service",
        "user-service",
        "image-service",
        "profile-service",
        "project-service",
        "notification-service",
        "manager-service",
        "email-service"
    )]
    [string] $Service,

    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]] $MavenArgs = @("quarkus:dev")
)

$ErrorActionPreference = "Stop"

function Import-EnvFile {
    param(
        [string] $Path,
        [bool] $Override
    )

    if (-not (Test-Path -LiteralPath $Path)) {
        return
    }

    Get-Content -LiteralPath $Path | ForEach-Object {
        $line = $_.Trim()
        if ($line.Length -eq 0 -or $line.StartsWith("#")) {
            return
        }

        $index = $line.IndexOf("=")
        if ($index -lt 1) {
            return
        }

        $name = $line.Substring(0, $index).Trim()
        $value = $line.Substring($index + 1).Trim()
        if (($value.StartsWith('"') -and $value.EndsWith('"')) -or
            ($value.StartsWith("'") -and $value.EndsWith("'"))) {
            $value = $value.Substring(1, $value.Length - 2)
        }

        if ($Override -or [string]::IsNullOrEmpty([Environment]::GetEnvironmentVariable($name, "Process"))) {
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
}

$root = Split-Path -Parent $PSScriptRoot
$serviceDir = Join-Path $PSScriptRoot $Service

Import-EnvFile -Path (Join-Path $serviceDir ".env.example") -Override $false
Import-EnvFile -Path (Join-Path $root ".env") -Override $true
Import-EnvFile -Path (Join-Path $serviceDir ".env") -Override $true

Push-Location $serviceDir
try {
    & ".\mvnw.cmd" @MavenArgs
    exit $LASTEXITCODE
}
finally {
    Pop-Location
}
