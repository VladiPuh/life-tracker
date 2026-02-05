param(
  [string]$SshHost = "root@95.163.227.121",
  [string]$RemoteDir = "/opt/lifetracker/bot"
)

$ErrorActionPreference = "Stop"

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$Archive = "lifetracker_bot_$Timestamp.tar.gz"

Write-Host "== Pack bot code (without .venv) =="

tar -czf $Archive `
  -C "apps/bot" `
  "bot.py" `
  "requirements.txt"

Write-Host "== Upload archive to server =="
scp $Archive "${SshHost}:/tmp/$Archive"

Write-Host "== Deploy on server =="
$RemoteCmd = @(
  "set -e",
  "cd $RemoteDir",
  "tar -xzf /tmp/$Archive -C .",
  "rm -f /tmp/$Archive",
  "sudo systemctl restart lifetracker-bot",
  "sudo systemctl status lifetracker-bot --no-pager"
) -join " && "

ssh $SshHost $RemoteCmd

Remove-Item $Archive -Force

Write-Host "DONE: bot deployed"
