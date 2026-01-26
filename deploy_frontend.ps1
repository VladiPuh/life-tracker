# deploy_frontend.ps1
$ErrorActionPreference = "Stop"

# ===== SETTINGS =====
$ServerUser = "root"
$ServerHost = "95.163.227.121"
$Port = 22
$SshKey = "$env:USERPROFILE\.ssh\lifetracker"


# Куда кладём dist на сервере (под /app/)
$RemoteRoot = "/var/www/html/app"

# ===== PATHS (auto) =====
$RepoRoot = Split-Path -Parent $PSCommandPath
$WebAppDir = Join-Path $RepoRoot "apps\webapp"
$DistDir = Join-Path $WebAppDir "dist"

if (!(Test-Path (Join-Path $WebAppDir "package.json"))) {
  throw "webapp package.json not found: $WebAppDir"
}

Write-Host "RepoRoot : $RepoRoot"
Write-Host "WebAppDir: $WebAppDir"
Write-Host "DistDir  : $DistDir"
Write-Host "Remote   : ${ServerUser}@${ServerHost}:$RemoteRoot"

# ===== 1) BUILD =====
Write-Host "`n== Build frontend ==" -ForegroundColor Cyan
Push-Location $WebAppDir

# если node_modules нет — ставим зависимости
if (!(Test-Path (Join-Path $WebAppDir "node_modules"))) {
  Write-Host "node_modules missing -> npm ci" -ForegroundColor Yellow
  npm ci
}

npm run build

if (!(Test-Path $DistDir)) {
  Pop-Location
  throw "dist/ not found after build: $DistDir"
}

# ===== 2) ZIP dist =====
$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$tarName = "lifetracker_front_dist_$stamp.tar.gz"
$tarPath = Join-Path $env:TEMP $tarName

if (Test-Path $tarPath) { Remove-Item $tarPath -Force }

Write-Host "== Pack dist (tar.gz) ==" -ForegroundColor Cyan
# создаём архив из содержимого dist
Push-Location $DistDir
tar -czf $tarPath .
Pop-Location

$remoteTar = "/tmp/$tarName"

# ===== 3) UPLOAD =====
$remoteTar = "/tmp/$tarName"

Write-Host "`n== Upload to server ==" -ForegroundColor Cyan
Write-Host "TAR(local): $tarPath"
Write-Host "TAR(name) : $tarName"
Write-Host "TAR(remote): $remoteTar"

$scpArgs = @(
  "-i", $SshKey,
  "-P", $Port,
  "-o", "BatchMode=yes",
  $tarPath,
  ("{0}@{1}:{2}" -f $ServerUser, $ServerHost, $remoteTar)
)

& scp @scpArgs
if ($LASTEXITCODE -ne 0) { throw "SCP failed (exit $LASTEXITCODE)" }

# ===== 4) SERVER DEPLOY (backup + replace) =====
Write-Host "`n== Deploy on server (with backup) ==" -ForegroundColor Cyan

$remoteScript = @"
set -e

ROOT="$RemoteRoot"
STAMP="$stamp"
TAR="$remoteTar"
BACKUP_DIR="/var/backups"
BACKUP="`$BACKUP_DIR/lifetracker_front_app_`$STAMP.tar.gz"
TMP="/tmp/lifetracker_front_app_`$STAMP"

mkdir -p "`$BACKUP_DIR"
mkdir -p "`$ROOT"

echo "== Backup current frontend =="
if [ -d "`$ROOT" ] && [ "`$(ls -A "`$ROOT" 2>/dev/null || true)" != "" ]; then
  tar -czf "`$BACKUP" -C "`$ROOT" .
  echo "Backup saved: `$BACKUP"
else
  echo "Nothing to backup (empty or missing): `$ROOT"
fi

echo "== Unpack new build =="
rm -rf "`$TMP"
mkdir -p "`$TMP"
tar -xzf "`$TAR" -C "`$TMP"

echo "== Replace files =="
rm -rf "`$ROOT"/*
cp -a "`$TMP"/. "`$ROOT"/

rm -rf "`$TMP" "`$TAR"
echo "OK: frontend deployed to `$ROOT"
"@


Write-Host "`n== Deploy on server (with backup) ==" -ForegroundColor Cyan

# 1) нормализуем переводы строк (CRLF -> LF), иначе bash ругается на $'\r'
$remoteScriptLf = $remoteScript -replace "`r`n", "`n"

# 2) отправляем скрипт по STDIN в bash, а не как аргумент (никаких проблем с кавычками)
$sshArgs = @(
  "-i", $SshKey,
  "-p", $Port,
  "-o", "BatchMode=yes",
  "-T",
  ("{0}@{1}" -f $ServerUser, $ServerHost),
  "bash -s"
)

$remoteScriptLf | & ssh @sshArgs

if ($LASTEXITCODE -ne 0) { throw "SSH deploy failed (exit $LASTEXITCODE)" }

# ===== 5) CLEAN LOCAL =====
Remove-Item $tarPath -Force
Write-Host "`nDONE" -ForegroundColor Green
