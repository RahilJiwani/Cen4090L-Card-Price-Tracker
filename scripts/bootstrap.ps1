$ProjectRoot = Split-Path -Parent $PSScriptRoot
$PythonAppPath = "$ProjectRoot\new_app"
$ReactAppPath = "$ProjectRoot\client"

# check for correct path
if (!(Test-Path $PythonAppPath) -or !(Test-Path $ReactAppPath))
{
throw "This script must be run from the project root directory."
}

$envFile = "$PythonAppPath\.env"
$venvPath = "$ProjectRoot\.venv"

Write-Host "== Cen4090L Card Price Tracker Bootstrap ==" -ForegroundColor Cyan

# check if node and npm are installed
try
{
node -v | Out-Null
npm -v | Out-Null
}
catch
{
throw "Node.js (or npm) not found. Install Node.js before running bootstrap."
}

# check for python
try
{
py -V | Out-Null
}
catch
{
throw "Python not found. Install Python before running bootstrap."
}

# create venv if its missing
if (!(Test-Path "$venvPath"))
{
Write-Host "Creating virtual environment (.venv)..." -ForegroundColor Yellow
py -m venv "$venvPath"
}

# enter venv
Write-Host "Activating venv..." -ForegroundColor Yellow
. "$venvPath\Scripts\Activate.ps1"

# install python dependencies
Write-Host "Installing Python dependencies..." -ForegroundColor Yellow
py -m pip install --upgrade pip
py -m pip install -r "$ProjectRoot\requirements.txt"

# install npm dependencies
$clientPath = "$ProjectRoot\client"
if (Test-Path "$clientPath\package.json")
{
Write-Host "Installing client dependencies..." -ForegroundColor Yellow
Push-Location $clientPath
npm install --legacy-peer-deps
Pop-Location
}

# Create .env if missing
if (!(Test-Path $envFile))
{
$DatabaseUrl = Read-Host "Enter Neon PostgreSQL Connection String or leave blank to enter later"

@"
DATABASE_URL="$DatabaseUrl"
"@ | Out-File -Encoding utf8 $envFile
}

Write-Host ""
Write-Host "Bootstrap complete." -ForegroundColor Green