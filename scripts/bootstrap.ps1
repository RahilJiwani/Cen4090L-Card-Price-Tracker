param(
  [string]$ProjectRoot = (Get-Location).Path,
  [string]$FlaskSecretKey = "change_me_to_something_random"
)

$ErrorActionPreference = "Stop"

Write-Host "== Cen4090L Card Price Tracker Bootstrap ==" -ForegroundColor Cyan
Write-Host "Project root: $ProjectRoot"

# Prompt for Neon database connection string
$DatabaseUrlSecure = Read-Host "Enter Neon PostgreSQL Connection String (DATABASE_URL)" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($DatabaseUrlSecure)
$DatabaseUrl = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

# 0) Ensure we are in the project root
if (!(Test-Path "$ProjectRoot\requirements.txt")) {
  throw "Not in project root. cd into the folder that contains requirements.txt then re-run."
}

# 0.5) Ensure Node.js is available for the client
try {
  node -v | Out-Null
  npm -v | Out-Null
}
catch {
  throw "Node.js (or npm) not found. Install Node.js before running bootstrap."
}

# 1) Ensure python launcher works
py -V | Out-Null

# 2) Create venv if missing
if (!(Test-Path "$ProjectRoot\.venv")) {
  Write-Host "Creating virtual environment (.venv)..." -ForegroundColor Yellow
  py -m venv "$ProjectRoot\.venv"
}

# 3) Activate venv
Write-Host "Activating venv..." -ForegroundColor Yellow
. "$ProjectRoot\.venv\Scripts\Activate.ps1"

# 4) Install dependencies
Write-Host "Installing Python dependencies..." -ForegroundColor Yellow
py -m pip install --upgrade pip
py -m pip install -r "$ProjectRoot\requirements.txt"

# Ensure psycopg2 works on Windows
try { py -m pip uninstall -y psycopg2 | Out-Null } catch { }
py -m pip install psycopg2-binary | Out-Null

# 5) PostgreSQL setup is skipped because we use Neon database

# 7) Create .env if missing
$envExample = "$ProjectRoot\.env.example"
$envFile = "$ProjectRoot\.env"

if (!(Test-Path $envExample)) {
  Write-Host "No .env.example found. Creating one..." -ForegroundColor Yellow
  @"
DATABASE_URL=$DatabaseUrl

FLASK_SECRET_KEY=$FlaskSecretKey

SCRYFALL_API_BASE=https://api.scryfall.com
MTGJSON_API_BASE=https://mtgjson.com/api/v5

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_FROM=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
"@ | Out-File -Encoding utf8 $envExample
}

if (!(Test-Path $envFile)) {
  Write-Host "Creating .env from .env.example..." -ForegroundColor Yellow
  Copy-Item $envExample $envFile
} else {
  $envContent = Get-Content $envFile -Raw
  if ($envContent -notmatch "DATABASE_URL=") {
    Write-Host "Appending DATABASE_URL to existing .env..." -ForegroundColor Yellow
    Add-Content -Path $envFile -Value "`nDATABASE_URL=$DatabaseUrl" -Encoding utf8
  } else {
    Write-Host "Updating DATABASE_URL in existing .env..." -ForegroundColor Yellow
    $envContent = $envContent -replace '(?m)^DATABASE_URL=.*$', "DATABASE_URL=$DatabaseUrl"
    Set-Content -Path $envFile -Value $envContent -Encoding utf8
  }
}

Write-Host ""
Write-Host "✅ Bootstrap complete." -ForegroundColor Green
Write-Host "Next: run the web app:" -ForegroundColor Cyan
Write-Host "   .\scripts\run.ps1" -ForegroundColor White
