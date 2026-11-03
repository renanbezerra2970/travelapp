# Gera o APK assinado do Eurotrip 2026 e copia para public/ (o site serve em /eurotrip-2026.apk).
# Uso: .\build-apk.ps1   (na pasta android)
$ErrorActionPreference = 'Stop'
$env:JAVA_HOME = 'C:\Program Files\Android\Android Studio\jbr'
Set-Location $PSScriptRoot
.\gradlew.bat assembleRelease --no-daemon
if ($LASTEXITCODE -ne 0) { Write-Host 'FALHOU' -ForegroundColor Red; exit 1 }
Copy-Item 'app\build\outputs\apk\release\app-release.apk' '..\public\eurotrip-2026.apk' -Force
Write-Host 'APK PRONTO: public\eurotrip-2026.apk' -ForegroundColor Green
