param(
    [Parameter(Mandatory)]
    [string]$Tag,

    [Parameter(Mandatory)]
    [string[]]$Files
)

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
$marker = "// LT-SOURCE: $Tag $timestamp"

foreach ($file in $Files) {

    if (-not (Test-Path $file)) {
        Write-Host "SKIP: file not found -> $file" -ForegroundColor Yellow
        continue
    }

    $content = Get-Content $file

    if ($content.Count -eq 0) {
        # пустой файл
        @($marker) | Set-Content $file -Encoding UTF8
        Write-Host "OK: marker added to empty file -> $file" -ForegroundColor Green
        continue
    }

    if ($content[0] -like "// LT-SOURCE:*") {
        $content[0] = $marker
    }
    else {
        $content = @($marker) + $content
    }

    $content | Set-Content $file -Encoding UTF8
    Write-Host "OK: marker updated -> $file" -ForegroundColor Green
}

Write-Host "DONE" -ForegroundColor Cyan
