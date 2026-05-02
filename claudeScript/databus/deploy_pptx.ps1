# Web EAI 설계가이드 PPTX 자동 설치 스크립트
# Claude 다운로드 폴더에서 databus 폴더로 복사합니다

$destDir = "C:\00.Saffron\saffron-frontend\claudeScript\databus"
$destFile = Join-Path $destDir "Web_EAI_설계가이드.pptx"

# 다운로드 폴더에서 파일 검색
$searchPaths = @(
    "$env:USERPROFILE\Downloads\Web_EAI_설계가이드.pptx",
    "$env:USERPROFILE\Desktop\Web_EAI_설계가이드.pptx",
    "C:\Users\Public\Downloads\Web_EAI_설계가이드.pptx"
)

$found = $null
foreach ($path in $searchPaths) {
    if (Test-Path $path) {
        $found = $path
        break
    }
}

if ($found) {
    Copy-Item -Path $found -Destination $destFile -Force
    $size = (Get-Item $destFile).Length
    Write-Host "완료: $destFile ($size bytes)"
} else {
    Write-Host "파일을 찾을 수 없습니다. 아래 경로 중 하나에 파일을 다운로드한 후 다시 실행하세요:"
    $searchPaths | ForEach-Object { Write-Host "  $_" }
}
