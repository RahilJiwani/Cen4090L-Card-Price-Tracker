$ErrorActionPreference = "Stop"

if (!(Test-Path ".\.venv")) {
    Write-Host "Virtual environment not found. Please run .\scripts\bootstrap.ps1 first." -ForegroundColor Red
    exit 1
}

Write-Host "Activating venv..." -ForegroundColor Yellow
. ".\.venv\Scripts\Activate.ps1"

if (!(Test-Path ".\client\package.json")) {
    Write-Host "Client package.json not found. Please run .\scripts\bootstrap.ps1 first." -ForegroundColor Red
    exit 1
}

Write-Host "Starting the web app on port 5008..." -ForegroundColor Green
$env:FLASK_APP = "new_app.app:app" # can be changed to app.web_app:app for old version
$env:FLASK_DEBUG = "1"
Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "py -m flask run"

Start-Sleep -Seconds 2

$clientPath = (Resolve-Path ".\client").Path
$clientCommand = "if (!(Test-Path node_modules)) { npm install }; npm run dev"
Start-Process -FilePath "powershell" -WorkingDirectory $clientPath -ArgumentList "-NoExit", "-Command", $clientCommand