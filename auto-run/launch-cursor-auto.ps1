param(
  [string]$ProjectPath = (Resolve-Path -Path (Join-Path $PSScriptRoot "..")).Path,
  [switch]$NoLaunchCursor
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Resolve-CursorCommand {
  $candidates = @(
    (Get-Command cursor -ErrorAction SilentlyContinue),
    (Get-Command Cursor -ErrorAction SilentlyContinue)
  ) | Where-Object { $_ }

  if ($candidates.Count -gt 0) {
    return $candidates[0].Source
  }

  $fallbacks = @(
    "$env:LOCALAPPDATA\Programs\cursor\resources\app\bin\cursor.cmd",
    "$env:LOCALAPPDATA\Programs\cursor\Cursor.exe"
  )

  foreach ($path in $fallbacks) {
    if (Test-Path -Path $path -PathType Leaf) {
      return $path
    }
  }

  return $null
}

Write-Host "=== Cursor auto launch workflow ==="

$autoProxyScript = Join-Path $PSScriptRoot "auto-proxy.ps1"
if (-not (Test-Path -Path $autoProxyScript -PathType Leaf)) {
  Write-Host "auto-proxy.ps1 not found. Please keep both scripts in same folder."
  exit 1
}

Write-Host "[1/3] Detecting proxy and switching git mode..."
powershell -NoProfile -ExecutionPolicy Bypass -File $autoProxyScript
if ($LASTEXITCODE -ne 0) {
  Write-Host "auto-proxy.ps1 failed with code $LASTEXITCODE"
  exit $LASTEXITCODE
}

Write-Host "[2/3] Checking local proxy endpoint..."
$proxyOk = Test-NetConnection 127.0.0.1 -Port 7897 -WarningAction SilentlyContinue
if ($proxyOk.TcpTestSucceeded) {
  Write-Host "Proxy endpoint 127.0.0.1:7897 is reachable."
} else {
  Write-Host "Proxy endpoint 127.0.0.1:7897 is not reachable. Git has switched to direct mode."
}

if ($NoLaunchCursor) {
  Write-Host "[3/3] Skip launching Cursor due to -NoLaunchCursor."
  Write-Host "Done."
  exit 0
}

Write-Host "[3/3] Launching Cursor project..."
$cursorCmd = Resolve-CursorCommand
if (-not $cursorCmd) {
  Write-Host "Cursor command not found. Please install Cursor or add it to PATH."
  exit 1
}

$resolvedProjectPath = (Resolve-Path -Path $ProjectPath).Path
Start-Process -FilePath $cursorCmd -ArgumentList "`"$resolvedProjectPath`"" | Out-Null
Write-Host "Cursor launched with project: $resolvedProjectPath"
Write-Host "Done."
