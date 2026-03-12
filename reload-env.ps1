param(
  [int]$Port = 8787
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Write-Host "Step 1/4: stop current dev server on port $Port ..."
$listeners = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue
if ($listeners) {
  $pids = $listeners | Select-Object -ExpandProperty OwningProcess -Unique
  foreach ($pid in $pids) {
    try {
      Stop-Process -Id $pid -Force -ErrorAction Stop
      Write-Host "Stopped process PID=$pid"
    } catch {
      Write-Host "Failed to stop PID=$pid : $($_.Exception.Message)"
    }
  }
} else {
  Write-Host "No running dev server found on port $Port."
}

Write-Host "Step 2/4: clear DNS cache ..."
ipconfig /flushdns | Out-Null
Write-Host "DNS cache cleared."

Write-Host "Step 3/4: restart local project server ..."
$scriptPath = Join-Path $PSScriptRoot "dev-server.ps1"
Start-Process -FilePath "powershell.exe" `
  -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", "`"$scriptPath`"", "-Port", "$Port" `
  -WorkingDirectory $PSScriptRoot | Out-Null
Start-Sleep -Milliseconds 600

Write-Host "Step 4/4: verify local latest page ..."
try {
  $resp = Invoke-WebRequest -Uri "http://127.0.0.1:$Port/" -UseBasicParsing -TimeoutSec 5
  if ($resp.StatusCode -eq 200) {
    Write-Host "Verification OK: http://127.0.0.1:$Port/ is reachable."
  } else {
    Write-Host "Verification warning: status code $($resp.StatusCode)"
  }
} catch {
  Write-Host "Verification failed: $($_.Exception.Message)"
}

Write-Host "Done."
