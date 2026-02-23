param(
  [string]$DbUser = "mtg_user",
  [string]$DbName = "mtg_price_alert",
  [string]$PgBin = ""
)

$ErrorActionPreference = "Stop"

Write-Host "== MTG Tracker Setup =="

# 1) Ensure python launcher exists
py -V | Out-Null

# 2) Create venv if missing
if (!(Test-Path ".\.venv")) {
  Write-Host "Creating virtual environment (.venv)..."
  py -m venv .venv
}

# 3) Activate venv
Write-Host "Activating venv..."
. .\.venv\Scripts\Activate.ps1

# 4) Install deps
Write-Host "Installing requirements..."
py -m pip install --upgrade pip
py -m pip install -r requirements.txt

# Flask is likely already in requirements, but keeping this safe:
py -m pip install flask | Out-Null

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

# 6) Ask for postgres password (secure)
$pgPass = Read-Host "Enter postgres password (for creating DB/user)" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($pgPass)
$pgPassPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
$env:PGPASSWORD = $pgPassPlain

# 7) Create user + database (idempotent)
Write-Host "Creating DB user/database if missing..."

psql -U postgres -d postgres -v ON_ERROR_STOP=1 -c "DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '$DbUser') THEN
    CREATE ROLE $DbUser LOGIN PASSWORD '$pgPassPlain';
  ELSE
    ALTER ROLE $DbUser LOGIN PASSWORD '$pgPassPlain';
  END IF;
END
\$\$;"

psql -U postgres -d postgres -v ON_ERROR_STOP=1 -c "SELECT 'DB exists' WHERE EXISTS (SELECT 1 FROM pg_database WHERE datname = '$DbName');" | Out-Null
psql -U postgres -d postgres -v ON_ERROR_STOP=1 -c "DO \$\$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = '$DbName') THEN
    CREATE DATABASE $DbName OWNER $DbUser;
  END IF;
END
\$\$;"

# 8) Load schema
Write-Host "Loading schema..."
psql -U $DbUser -d $DbName -v ON_ERROR_STOP=1 -f "sql/schema.sql"

# 9) Done
Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
Write-Host "✅ Setup complete."
Write-Host "Next: copy .env.example to .env and edit passwords, then run scripts\run.ps1"