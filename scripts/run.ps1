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

Write-Host "Starting the web app on port 8080..." -ForegroundColor Green
$env:FLASK_APP = "app.web_app:app"
$env:FLASK_DEBUG = "1"
Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "py -m flask run --port 8080"

Start-Sleep -Seconds 2

$clientPath = (Resolve-Path ".\client").Path
$clientCommand = "if (!(Test-Path node_modules)) { npm install }; npm run dev"
Start-Process -FilePath "powershell" -WorkingDirectory $clientPath -ArgumentList "-NoExit", "-Command", $clientCommand