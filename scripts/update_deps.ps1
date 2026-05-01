$ErrorActionPreference = "Stop"

$ProjectRoot = (Get-Location).Path

Write-Host "== Cen4090L Card Price Tracker Dependency Updater ==" -ForegroundColor Cyan

# 1) Python Backend Updates
Write-Host "`n[1/2] Updating Python Backend Dependencies..." -ForegroundColor Yellow
if (!(Test-Path "$ProjectRoot\.venv")) {
    Write-Host ".venv not found. Please run bootstrap.ps1 first." -ForegroundColor Red
} else {
    Write-Host "Activating venv..."
    . "$ProjectRoot\.venv\Scripts\Activate.ps1"
    
    $reqPath = "$ProjectRoot\requirements.txt"
    if (Test-Path $reqPath) {
        # Extract base package names (e.g. 'Flask' from 'Flask==3.1.0')
        $lines = Get-Content $reqPath | Where-Object { $_.Trim() -ne "" }
        $pkgNames = @()
        foreach ($line in $lines) {
            $pkgName = ($line -split "==")[0].Trim()
            if ($pkgName -ne "") {
                $pkgNames += $pkgName
            }
        }
    
        if ($pkgNames.Count -gt 0) {
            Write-Host "Fetching latest versions for: $($pkgNames -join ', ')" -ForegroundColor Cyan
            $args = @("-m", "pip", "install", "--upgrade") + $pkgNames
            & py $args
    
            Write-Host "`nFreezing new Python dependency versions to requirements.txt..." -ForegroundColor Yellow
            $frozen = & py -m pip freeze
            $updatedLines = @()
            
            foreach ($pkg in $pkgNames) {
                # Find the matching package line in the freeze output (ignoring case and treating _ as -)
                $normalizedPkg = $pkg -replace '_','-'
                $pkgMatch = $frozen | Where-Object { 
                    $normalizedLine = ($_ -split "==")[0] -replace '_','-'
                    $normalizedLine -eq $normalizedPkg
                } | Select-Object -First 1
                
                if ($pkgMatch) {
                    $updatedLines += $pkgMatch
                } else {
                    $updatedLines += $pkg # Fallback to unpinned if it somehow vanishes
                }
            }
            $updatedLines | Out-File $reqPath -Encoding utf8
            Write-Host "requirements.txt successfully updated!" -ForegroundColor Green
        }
    } else {
        Write-Host "No requirements.txt found in the root directory. Skipping backend..." -ForegroundColor DarkYellow
    }
}

# 2) React/Node Frontend Updates
Write-Host "`n[2/2] Updating React/Node Frontend Dependencies..." -ForegroundColor Yellow
$clientPath = "$ProjectRoot\client"
if (Test-Path "$clientPath\package.json") {
    Push-Location $clientPath
    
    # Use 'npm-check-updates' utility through npx which rewrites package.json with latest secure versions
    Write-Host "Scanning client/package.json for newest versions..." -ForegroundColor Cyan
    npx.cmd -y npm-check-updates -u
    
    Write-Host "`nInstalling updated npm packages..." -ForegroundColor Cyan
    npm install --legacy-peer-deps
    
    Pop-Location
    Write-Host "client dependencies successfully updated!" -ForegroundColor Green
} else {
    Write-Host "No client/package.json found. Skipping frontend..." -ForegroundColor DarkYellow
}

Write-Host "`n✅ All dependencies have been successfully checked and updated to their latest versions!" -ForegroundColor Green
