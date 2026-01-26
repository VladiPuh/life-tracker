# deploy_frontend.ps1
$ErrorActionPreference = "Stop"

# ================== SETTINGS ==================
$ServerUser = "root"
$ServerHost = "95.163.227.121"
$Port = 22
$RemoteRoot = "/var/www/html"   # фронт: default nginx root на сервере
# =============================================

function Require-Cmd($name) {
    if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
        throw "Command not found in PATH: $name. Install/enable it and retry."
    }
}

Require-Cmd "npm"
Require-Cmd "ssh"
Require-Cmd "scp"

# --- Resolve paths robustly ---
$RepoRoot = Split-Path -Parent $PSCommandPath
$WebAppDir = Join-Path $RepoRoot "apps\webapp"

if (!(Test-Path $WebAppDir)) {
    throw "WebApp dir not found: $WebAppDir"
}

$Pkg = Join-Path $WebAppDir "package.json"
if (!(Test-Path $Pkg)) {
    throw "package.json not found at: $Pkg (wrong repo root?)"
}

Push-Location $WebAppDir
try {
    Write-Host "== Frontend location ==" -ForegroundColor Cyan
    Write-Host $WebAppDir

    # Optional: install deps if missing
    if (!(Test-Path (Join-Path $WebAppDir "node_modules"))) {
        Write-Host "== npm ci (node_modules missing) ==" -ForegroundColor Cyan
        npm ci
    }

    Write-Host "== Build frontend ==" -ForegroundColor Cyan
    npm run build

    $DistDir = Join-Path $WebAppDir "dist"
    if (!(Test-Path $DistDir)) { throw "dist/ not found after build: $DistDir" }

    # Create zip in %TEMP%
    $stamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $zipName = "lifetracker_front_dist_$stamp.zip"
    $zipPath = Join-Path $env:TEMP $zipName

    if (Test-Path $zipPath) { Remove-Item $zipPath -Force }

    Write-Host "== Package dist -> $zipPath ==" -ForegroundColor Cyan
    Compress-Archive -Path (Join-Path $DistDir "*") -DestinationPath $zipPath -Force

    Write-Host "== Upload build to server ==" -ForegroundColor Cyan
    scp -P $Port $zipPath "${ServerUser}@${ServerHost}:/tmp/${zipName}"

    # Remote deploy with server-side backup
    $remoteScript = @"
set -e

ROOT="$RemoteRoot"
STAMP="$stamp"
ZIP="/tmp/$zipName"
BACKUP="/var/backups/lifetracker_front_`$STAMP.tar.gz"
TMP="/tmp/lifetracker_front_`$STAMP"

mkdir -p /var/backups

echo "== Backup current frontend =="
if [ -d "`$ROOT" ]; then
  tar -czf "`$BACKUP" -C "`$ROOT" .
  echo "Backup saved: `$BACKUP"
fi

echo "== Deploy new frontend =="
mkdir -p "`$TMP"
unzip -q "`$ZIP" -d "`$TMP"

rm -rf "`$ROOT"/*
cp -a "`$TMP"/. "`$ROOT"/

rm -rf "`$TMP" "`$ZIP"
echo "OK: frontend deployed to `$ROOT"
"@

    Write-Host "== Remote deploy ==" -ForegroundColor Cyan
    ssh -p $Port "${ServerUser}@${ServerHost}" $remoteScript

    Write-Host "DONE" -ForegroundColor Green
}
finally {
    Pop-Location
    # Cleanup local zip
    if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
}
