$ErrorActionPreference = "Stop"

if (!(Test-Path ".\.venv")) {
  throw "Missing .venv. Run .\scripts\bootstrap.ps1 first."
}

. .\.venv\Scripts\Activate.ps1

$env:FLASK_APP = "app.web_app:create_app"
$env:FLASK_DEBUG = "1"

flask run -h 127.0.0.1 -p 8000
