$ErrorActionPreference = "Stop"

if (!(Test-Path ".\.venv")) {
    Write-Host "Virtual environment not found. Please run .\scripts\bootstrap.ps1 first." -ForegroundColor Red
    exit 1
}

Write-Host "Activating venv..." -ForegroundColor Yellow
. ".\.venv\Scripts\Activate.ps1"

Write-Host "Starting the web app on port 8000..." -ForegroundColor Green
$env:FLASK_APP = "app.web_app:app"
$env:FLASK_DEBUG = "1"
py -m flask run --port 8000
