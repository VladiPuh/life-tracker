# deploy_backend.ps1 (PRO)
$ErrorActionPreference = "Stop"

# =========================
# SETTINGS (EDIT HERE)
# =========================
$ServerUser = "root"
$ServerHost = "95.163.227.121"
$Port = 22
$SshKey = "$env:USERPROFILE\.ssh\lifetracker"

# Remote layout (canon)
$RemoteApiRoot = "/opt/lifetracker/api"                 # backend code
$RemoteDbPath = "/opt/lifetracker/api/life_tracker.db" # prod sqlite (keep!)
$SystemdService = "lifetracker-api"                      # systemd unit name

# Public health URL (PROD routing)
# У тебя API_BASE=/api, поэтому по-умолчанию:
$HealthUrl = "https://api.lifetracker.site/api/health"

# Health check behavior
$HealthRetries = 15
$HealthDelaySec = 1

# Backups
$RemoteBackupDir = "/var/backups/lifetracker"

# =========================
# PATHS (AUTO)
# =========================
$RepoRoot = Split-Path -Parent $PSCommandPath
$ApiDir = Join-Path $RepoRoot "apps\api"
$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$tarName = "lifetracker_backend_$stamp.tar.gz"
$tarPath = Join-Path $env:TEMP $tarName
$remoteTar = "/tmp/$tarName"

if (!(Test-Path (Join-Path $ApiDir "app\main.py"))) {
  throw "backend main.py not found: $ApiDir\app\main.py"
}

function Exec-Checked([string]$Label, [scriptblock]$Fn) {
  Write-Host "`n== $Label ==" -ForegroundColor Cyan
  & $Fn
  if ($LASTEXITCODE -ne 0) { throw "$Label failed (exit $LASTEXITCODE)" }
}

function Invoke-HealthCheck {
  Write-Host "`n== Health check: $HealthUrl ==" -ForegroundColor Cyan
  $ok = $false
  for ($i = 1; $i -le $HealthRetries; $i++) {
    try {
      $r = Invoke-WebRequest -Uri $HealthUrl -Method GET -TimeoutSec 5 -UseBasicParsing
      if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 300) { $ok = $true; break }
    }
    catch {
      # ignore, retry
    }
    Start-Sleep -Seconds $HealthDelaySec
  }
  if (-not $ok) { throw "Health check FAILED after $HealthRetries tries: $HealthUrl" }
  Write-Host "Health OK" -ForegroundColor Green
}

Write-Host "RepoRoot : $RepoRoot"
Write-Host "ApiDir   : $ApiDir"
Write-Host "Remote   : ${ServerUser}@${ServerHost}:$RemoteApiRoot"
Write-Host "Service  : $SystemdService"
Write-Host "Health   : $HealthUrl"

# =========================
# 0) PACK backend (exclude .venv, __pycache__, *.pyc, *.db)
# =========================
Exec-Checked "Pack backend (tar.gz)" {
  if (Test-Path $tarPath) { Remove-Item $tarPath -Force }
  Push-Location $ApiDir
  tar -czf $tarPath `
    --exclude ".venv" `
    --exclude "__pycache__" `
    --exclude "*.pyc" `
    --exclude "*.db" `
    .
  Pop-Location
  if (!(Test-Path $tarPath)) { throw "tar not created: $tarPath" }
}

# =========================
# 1) UPLOAD
# =========================
Exec-Checked "Upload to server" {
  $scpArgs = @(
    "-i", $SshKey,
    "-P", $Port,
    "-o", "BatchMode=yes",
    $tarPath,
    ("{0}@{1}:{2}" -f $ServerUser, $ServerHost, $remoteTar)
  )
  & scp @scpArgs
}

# =========================
# 2) SERVER DEPLOY (backup + replace + restart + verify)
#     With rollback on failure
# =========================
Exec-Checked "Deploy on server (backup + replace + restart + verify + rollback)" {

    
  # ВАЖНО: single-quoted here-string => PowerShell НЕ трогает $() / || / && внутри bash
  $remoteScript = @'
set -e

ROOT="__REMOTE_API_ROOT__"
TAR="__REMOTE_TAR__"
STAMP="__STAMP__"
BACKUP_DIR="__REMOTE_BACKUP_DIR__"
CODE_BACKUP="$BACKUP_DIR/lifetracker_backend_code_$STAMP.tar.gz"
DB_BACKUP="$BACKUP_DIR/lifetracker_backend_db_$STAMP.db.gz"
TMP="/tmp/lifetracker_backend_$STAMP"

ROLLBACK_DIR="/tmp/lifetracker_rollback_$STAMP"

mkdir -p "$BACKUP_DIR"
mkdir -p "$ROOT"

echo "== (A) Preflight =="
echo "ROOT: $ROOT"
echo "DB  : __REMOTE_DB_PATH__"
echo "TAR : $TAR"
echo "Service: __SYSTEMD_SERVICE__"
df -h "$(dirname "$ROOT")" || true

echo "== (1) Backup current backend code =="
# Делаем backup кода. Это же используем для rollback.
if [ -d "$ROOT" ] && [ "$(ls -A "$ROOT" 2>/dev/null || true)" != "" ]; then
  tar -czf "$CODE_BACKUP" -C "$ROOT" .
  echo "Code backup: $CODE_BACKUP"
else
  echo "Nothing to backup (empty or missing): $ROOT"
  tar -czf "$CODE_BACKUP" --files-from /dev/null
  echo "Code backup (empty): $CODE_BACKUP"
fi

echo "== (2) Backup DB (if exists) =="
DB="__REMOTE_DB_PATH__"
if [ -f "$DB" ]; then
  gzip -c "$DB" > "$DB_BACKUP"
  echo "DB backup: $DB_BACKUP"
else
  echo "DB not found, skip: $DB"
fi

cleanup_tmp() {
  rm -rf "$TMP" "$TAR" "$ROLLBACK_DIR" || true
}

rollback() {
  echo "!! ROLLBACK START"
  mkdir -p "$ROLLBACK_DIR"
  rm -rf "$ROLLBACK_DIR"/*
  tar -xzf "$CODE_BACKUP" -C "$ROLLBACK_DIR" || true

  if [ -f "$ROOT/life_tracker.db" ]; then
    mv "$ROOT/life_tracker.db" "/tmp/life_tracker.db.keep.rollback.$STAMP" || true
  fi

  rm -rf "$ROOT"/*
  cp -a "$ROLLBACK_DIR"/. "$ROOT"/ || true

  if [ -f "/tmp/life_tracker.db.keep.rollback.$STAMP" ]; then
    mv "/tmp/life_tracker.db.keep.rollback.$STAMP" "$ROOT/life_tracker.db" || true
  fi

  systemctl restart "__SYSTEMD_SERVICE__" || true
  systemctl --no-pager --full status "__SYSTEMD_SERVICE__" || true
  echo "!! ROLLBACK END"
  cleanup_tmp
  exit 1
}

trap 'echo "Deployment failed"; rollback' ERR

echo "== (3) Unpack new backend to TMP =="
rm -rf "$TMP"
mkdir -p "$TMP"
tar -xzf "$TAR" -C "$TMP"

echo "== (4) Replace code (keep DB file untouched) =="
if [ -f "$ROOT/life_tracker.db" ]; then
  mv "$ROOT/life_tracker.db" "/tmp/life_tracker.db.keep.$STAMP"
fi

rm -rf "$ROOT"/*
cp -a "$TMP"/. "$ROOT"/

if [ -f "/tmp/life_tracker.db.keep.$STAMP" ]; then
  mv "/tmp/life_tracker.db.keep.$STAMP" "$ROOT/life_tracker.db"
fi

echo "== (5) Restart service =="
systemctl daemon-reload || true
systemctl restart "__SYSTEMD_SERVICE__"
echo "== Nginx hygiene: clean sites-enabled =="

mkdir -p /etc/nginx/disabled

find /etc/nginx/sites-enabled -maxdepth 1 -type f \
  -exec mv -f {} /etc/nginx/disabled/ \; 2>/dev/null || true

nginx -t
systemctl reload nginx

sleep 1
systemctl --no-pager --full status "__SYSTEMD_SERVICE__" || true

echo "== (6) Quick local smoke (service active) =="
systemctl is-active --quiet "__SYSTEMD_SERVICE__"

echo "== (7) Done server-side =="
cleanup_tmp
echo "OK: backend deployed to $ROOT"
'@

  # Подстановка плейсхолдеров (безопасно, без PowerShell-интерполяции bash-кода)
  $remoteScript = $remoteScript.Replace("__REMOTE_API_ROOT__", $RemoteApiRoot)
  $remoteScript = $remoteScript.Replace("__REMOTE_TAR__", $remoteTar)
  $remoteScript = $remoteScript.Replace("__STAMP__", $stamp)
  $remoteScript = $remoteScript.Replace("__REMOTE_BACKUP_DIR__", $RemoteBackupDir)
  $remoteScript = $remoteScript.Replace("__REMOTE_DB_PATH__", $RemoteDbPath)
  $remoteScript = $remoteScript.Replace("__SYSTEMD_SERVICE__", $SystemdService)


  # CRLF -> LF
  $remoteScriptLf = $remoteScript -replace "`r`n", "`n"

  $sshArgs = @(
    "-i", $SshKey,
    "-p", $Port,
    "-o", "BatchMode=yes",
    "-T",
    ("{0}@{1}" -f $ServerUser, $ServerHost),
    "bash -s"
  )

  $remoteScriptLf | & ssh @sshArgs
}

# =========================
# 3) HEALTH CHECK (public)
# =========================
Invoke-HealthCheck

# =========================
# 4) If failed health -> show logs
# =========================
# (Если HealthCheck упал, мы сюда не дойдём. Но на будущее оставляем хук.)
Write-Host "`nDONE" -ForegroundColor Green

# Cleanup local tar
if (Test-Path $tarPath) { Remove-Item $tarPath -Force }
