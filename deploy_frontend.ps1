# deploy_frontend.ps1
$ErrorActionPreference = "Stop"

# ===== НАСТРОЙКИ =====
$ServerUser = "root"
$ServerHost = "95.163.227.121"
$Port = 22
$RemoteRoot = "/var/www/html"

# ===== 1. Локальный билд =====
Write-Host "== Build frontend ==" -ForegroundColor Cyan
npm run build

if (!(Test-Path ".\dist")) {
  throw "dist/ not found after build"
}

# ===== 2. Архивируем dist =====
$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$zip = "dist_$stamp.zip"

if (Test-Path $zip) { Remove-Item $zip -Force }
Compress-Archive -Path ".\dist\*" -DestinationPath $zip -Force

# ===== 3. Загружаем архив =====
Write-Host "== Upload build to server ==" -ForegroundColor Cyan
scp -P $Port $zip "${ServerUser}@${ServerHost}:/tmp/${zip}"

# ===== 4. Серверный деплой + БЭКАП =====
$remoteScript = @"
set -e

ROOT="$RemoteRoot"
STAMP="$stamp"
ZIP="/tmp/$zip"
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

ssh -p $Port "${ServerUser}@${ServerHost}" $remoteScript

# ===== 5. Локальная уборка =====
Remove-Item $zip -Force
Write-Host "DONE" -ForegroundColor Green
