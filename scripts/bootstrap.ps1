param(
  [string]$ProjectRoot = (Get-Location).Path,
  [string]$PgBin = "",
  [string]$DbName = "mtg_price_alert",
  [string]$DbUser = "mtg_user",
  [string]$DbPassword = "DevPassword123!",
  [string]$FlaskSecretKey = "change_me_to_something_random"
)

$ErrorActionPreference = "Stop"

Write-Host "== Cen4090L Card Price Tracker Bootstrap ==" -ForegroundColor Cyan
Write-Host "Project root: $ProjectRoot"

# Prompt for postgres superuser password ONCE, up front (before pip output starts)
$pgPassSecure = Read-Host "Enter postgres superuser password" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($pgPassSecure)
$env:PGPASSWORD = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

# 0) Ensure we are in the project root (must contain requirements.txt + app/ + sql/)
if (!(Test-Path "$ProjectRoot\requirements.txt") -or !(Test-Path "$ProjectRoot\app") -or !(Test-Path "$ProjectRoot\sql\schema.sql")) {
  throw "Not in project root. cd into the folder that contains requirements.txt, app/, and sql/schema.sql then re-run."
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

# 5) Auto-detect PostgreSQL bin directory if not provided
if ($PgBin -eq "") {
  $pgVersions = Get-ChildItem "C:\Program Files\PostgreSQL" -ErrorAction SilentlyContinue |
  Where-Object { $_.PSIsContainer } |
  Sort-Object { [int]$_.Name } -Descending
  if ($pgVersions) {
    $PgBin = Join-Path $pgVersions[0].FullName "bin"
    Write-Host "Auto-detected PostgreSQL at: $PgBin" -ForegroundColor DarkGray
  }
  else {
    throw "No PostgreSQL installation found under 'C:\Program Files\PostgreSQL'. Install PostgreSQL or pass -PgBin manually."
  }
}

if (!(Test-Path "$PgBin\psql.exe")) {
  throw "psql.exe not found at '$PgBin'. Pass -PgBin to match your installation (e.g., -PgBin 'C:\Program Files\PostgreSQL\16\bin')."
}
$env:PATH += ";$PgBin"

# 6) Create DB + user + load schema
Write-Host "Creating Postgres user/database and loading schema..." -ForegroundColor Yellow

# Create or Update user
try {
  psql -U postgres -d postgres -v ON_ERROR_STOP=1 -c "DO \$\$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '$DbUser') THEN CREATE USER $DbUser WITH PASSWORD '$DbPassword'; ELSE ALTER USER $DbUser WITH PASSWORD '$DbPassword'; END IF; END \$\$;"
}
catch {
  Write-Host "User creation or update may have failed. Continuing..." -ForegroundColor DarkYellow
}

# Create DB (ignore if exists)
try {
  psql -U postgres -d postgres -v ON_ERROR_STOP=1 -c "CREATE DATABASE $DbName OWNER $DbUser;"
}
catch {
  Write-Host "Database may already exist. Continuing..." -ForegroundColor DarkYellow
}

# Grant schema permissions
try {
  psql -U postgres -d $DbName -v ON_ERROR_STOP=1 -c "GRANT USAGE, CREATE ON SCHEMA public TO $DbUser;"
}
catch {
  Write-Host "Grant may have failed or already applied. Continuing..." -ForegroundColor DarkYellow
}

# Load schema (switch PGPASSWORD to mtg_user password)
$env:PGPASSWORD = $DbPassword
psql -U $DbUser -d $DbName -v ON_ERROR_STOP=1 -f "$ProjectRoot\sql\schema.sql"

# Clean up
Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue

# 7) Create .env if missing
$envExample = "$ProjectRoot\.env.example"
$envFile = "$ProjectRoot\.env"

if (!(Test-Path $envExample)) {
  Write-Host "No .env.example found. Creating one..." -ForegroundColor Yellow
  @"
DB_HOST=localhost
DB_PORT=5432
DB_NAME=$DbName
DB_USER=$DbUser
DB_PASSWORD=$DbPassword

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
}

Write-Host ""
Write-Host "✅ Bootstrap complete." -ForegroundColor Green
Write-Host "Next: run the web app:" -ForegroundColor Cyan
Write-Host "   .\scripts\run.ps1" -ForegroundColor White
