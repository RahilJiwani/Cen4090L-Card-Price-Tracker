$ProjectRoot = Split-Path -Parent $PSScriptRoot
$PythonAppPath = "$ProjectRoot\new_app"
$ReactAppPath = "$ProjectRoot\client"
$EnvExamplePath = "$ProjectRoot\.env.example"

# check for correct path
if (!(Test-Path $PythonAppPath) -or !(Test-Path $ReactAppPath)) {
    throw "This script must be run from the project root directory."
}

$envFile = "$PythonAppPath\.env"
$venvPath = "$ProjectRoot\.venv"

function Write-Utf8NoBomFile {
    param(
        [Parameter(Mandatory = $true)] [string] $Path,
        [Parameter(Mandatory = $true)] [string] $Content
    )

    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($Path, $Content, $utf8NoBom)
}

function Prompt-ForEnvValue {
    param(
        [Parameter(Mandatory = $true)] [string] $Key,
        [Parameter(Mandatory = $true)] [bool] $Required,
        [string] $DefaultValue
    )

    while ($true) {
        if ($DefaultValue) {
            $inputValue = Read-Host "Enter $Key (press Enter for default: $DefaultValue)"
            if ([string]::IsNullOrWhiteSpace($inputValue)) {
                return $DefaultValue
            }
            return $inputValue.Trim()
        }

        $prompt = "Enter $Key"
        if (-not $Required) {
            $prompt = "$prompt (optional, press Enter to skip)"
        }

        $inputValue = Read-Host $prompt
        if (-not [string]::IsNullOrWhiteSpace($inputValue)) {
            return $inputValue.Trim()
        }

        if ($Required) {
            Write-Host "WARNING: $Key is required but has been initialized as empty." -ForegroundColor Yellow
        }

        return ""
    }
}

Write-Host "== Cen4090L Card Price Tracker Bootstrap ==" -ForegroundColor Cyan

# check if node and npm are installed
try {
    node -v | Out-Null
    npm -v | Out-Null
}
catch {
    throw "Node.js (or npm) not found. Install Node.js before running bootstrap."
}

# check for python
try {
    py -V | Out-Null
}
catch {
    throw "Python not found. Install Python before running bootstrap."
}

# create venv if its missing
if (!(Test-Path "$venvPath")) {
    Write-Host "Creating virtual environment (.venv)..." -ForegroundColor Yellow
    py -m venv "$venvPath"
}

# Create .env if missing
if (!(Test-Path $envFile)) {
    if (!(Test-Path $EnvExamplePath)) {
        throw ".env.example not found at $EnvExamplePath"
    }

    Write-Host "Creating .env from .env.example prompts..." -ForegroundColor Yellow

    $envLines = Get-Content $EnvExamplePath
    $outputLines = @()

    foreach ($line in $envLines) {
        if ([string]::IsNullOrWhiteSpace($line)) {
            continue
        }

        if ($line.TrimStart().StartsWith("#")) {
            continue
        }

        if ($line -notmatch '^(?<key>[A-Z0-9_]+)=(?<value>[^#]*)(?:\s*#(?<comment>.*))?$') {
            continue
        }

        $key = $matches['key']
        $comment = if ($matches['comment']) { $matches['comment'].Trim() } else { "" }

        $required = $comment -match '(?i)\bREQUIRED\b'
        $defaultValue = $null

        if ($comment -match '(?i)DEFAULT\s*=\s*([^\s#]+)') {
            $defaultValue = $matches[1]
        }

        $value = Prompt-ForEnvValue -Key $key -Required:$required -DefaultValue $defaultValue
        $outputLines += "$key=$value"
    }

    Write-Utf8NoBomFile -Path $envFile -Content ($outputLines -join "`r`n")
    Write-Host "Created $envFile" -ForegroundColor Green
}

Write-Host ""
Write-Host "Bootstrap complete." -ForegroundColor Green