param(
  [string]$Server = "95.163.227.121",
  [string]$User = "root",
  [string]$KeyPath = "$env:USERPROFILE\.ssh\lifetracker"
)

$remote = "$User@$Server"

Write-Host "== CONNECT ==" -ForegroundColor Cyan
Write-Host "remote: $remote"
Write-Host "key:    $KeyPath"
Write-Host ""

ssh -i $KeyPath $remote @"
set -e
cd /opt/lifetracker/api

echo '== systemd status =='
systemctl status lifetracker-api.service --no-pager -n 20 || true
echo

echo '== health internal =='
curl -sS http://127.0.0.1:8000/health && echo
echo

echo '== health external =='
curl -sS https://api.lifetracker.site/api/health && echo
echo

echo '== smoke (venv) =='
/opt/lifetracker/api/.venv/bin/python -m app._smoke
echo

echo '== last logs =='
journalctl -u lifetracker-api.service -n 60 --no-pager || true
"@
