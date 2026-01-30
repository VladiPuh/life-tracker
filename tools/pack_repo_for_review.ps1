param(
  [string]$Root = "D:\Life-Tracker",
  [string]$OutDir = ".\_for_review"
)

$ErrorActionPreference = "Stop"

# 0) Подготовка
New-Item -ItemType Directory -Force $OutDir | Out-Null

# Исключения (чтобы не тащить мусор/гигабайты)
$excludeDirs = @(
  "\.git\",
  "\node_modules\",
  "\dist\",
  "\build\",
  "\.venv\",
  "\__pycache__\",
  "\.pytest_cache\",
  "\.mypy_cache\",
  "\.ruff_cache\",
  "\.next\",
  "\.turbo\",
  "\coverage\",
  "\_for_review\",   # ВАЖНО: не сканируем результаты отчёта
  "\tools\"          # ВАЖНО: не сканируем наши утилиты
)

function Should-ExcludePath([string]$p) {
  foreach ($d in $excludeDirs) { if ($p -like "*$d*") { return $true } }
  return $false
}

# Удобная функция: безопасный рекурсивный список файлов
function Get-RepoFiles([string]$path) {
  Get-ChildItem -Path $path -Recurse -Force -File |
    Where-Object { -not (Should-ExcludePath $_.FullName) }
}

# 1) Дерево репо (пути)
$treeFile = Join-Path $OutDir "TREE_REPO_PC.txt"
Get-ChildItem -Path $Root -Recurse -Force |
  Where-Object { -not (Should-ExcludePath $_.FullName) } |
  Select-Object FullName |
  Out-File -Encoding UTF8 $treeFile

# 2) Список env-файлов и ключевых конфигов
$envFile = Join-Path $OutDir "ENV_FILES.txt"
Get-ChildItem -Path $Root -Recurse -Force -File |
  Where-Object {
    -not (Should-ExcludePath $_.FullName) -and
    (
      $_.Name -like ".env*" -or
      $_.Name -in @("vite.config.ts","package.json","package-lock.json","pnpm-lock.yaml","yarn.lock")
    )
  } |
  Select-Object FullName,Length,LastWriteTime |
  Sort-Object FullName |
  Format-Table -AutoSize |
  Out-String |
  Out-File -Encoding UTF8 $envFile

# 3) Быстрые версии (node/npm)
$versionsFile = Join-Path $OutDir "VERSIONS.txt"
$nodeV = (node -v 2>$null)
$npmV  = (npm -v 2>$null)
@"
Root: $Root
Node: $nodeV
NPM : $npmV
"@ | Out-File -Encoding UTF8 $versionsFile

# 4) Поиск "подозрительных" строк (ngrok, localhost, api base, telegram)
$grepFile = Join-Path $OutDir "SUSPECT_STRINGS.txt"
$patterns = @(
  "ngrok",
  "127.0.0.1:8000",
  "localhost:8000",
  "VITE_API_BASE",
  "API_BASE",
  "X-Telegram-Init-Data",
  "Telegram.WebApp",
  "web_app",
  "/api/today",
  "api.lifetracker.site",
  "app.lifetracker.site"
)

$targets = @(
  Join-Path $Root "apps\webapp"
  Join-Path $Root "apps\api"
)

$hits = foreach ($t in $targets) {
  if (Test-Path $t) {
    foreach ($p in $patterns) {
      Select-String -Path (Join-Path $t "**\*.ts"), (Join-Path $t "**\*.tsx"), (Join-Path $t "**\*.py"), (Join-Path $t "**\*.md") `
        -Pattern $p -CaseSensitive:$false -ErrorAction SilentlyContinue |
        ForEach-Object { "$($_.Path):$($_.LineNumber): $($_.Line.Trim())" }
    }
  }
}

$hits | Sort-Object | Out-File -Encoding UTF8 $grepFile

# 5) Хеши файлов (по ним найду дубли/копии/рассинхрон)
# ВАЖНО: не пишем в файл, который одновременно читаем; и не хешируем файлы OutDir
$hashFile = Join-Path $OutDir "FILE_HASHES_SHA256.txt"

# Собираем файлы заранее
$filesToHash = Get-RepoFiles $Root |
  Where-Object { $_.Length -le 5MB } |
  Where-Object { $_.FullName -ne $hashFile }

# Считаем хеши и пишем ОДНИМ заходом
$hashLines = foreach ($f in $filesToHash) {
  $h = Get-FileHash -Algorithm SHA256 -Path $f.FullName
  "{0}  {1}" -f $h.Hash, $h.Path
}
$hashLines | Out-File -Encoding UTF8 $hashFile

# 6) Архив
$zip = Join-Path $OutDir "FOR_REVIEW.zip"
if (Test-Path $zip) { Remove-Item $zip -Force }
Compress-Archive -Path (Join-Path $OutDir "*") -DestinationPath $zip -Force

Write-Host "OK: $zip"
