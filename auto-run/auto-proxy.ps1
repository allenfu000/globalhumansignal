param(
  [string]$ProxyHost = "127.0.0.1",
  [int[]]$CandidatePorts = @(7897, 7890),
  [int]$ConnectTimeoutMs = 900
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Test-PortOpen {
  param(
    [string]$Address,
    [int]$Port,
    [int]$TimeoutMs
  )

  $client = New-Object System.Net.Sockets.TcpClient
  try {
    $async = $client.BeginConnect($Address, $Port, $null, $null)
    $ok = $async.AsyncWaitHandle.WaitOne($TimeoutMs, $false)
    if (-not $ok) {
      return $false
    }
    $client.EndConnect($async)
    return $true
  } catch {
    return $false
  } finally {
    $client.Close()
  }
}

function Get-ActiveProxyUrl {
  param(
    [string]$Address,
    [int[]]$Ports,
    [int]$TimeoutMs
  )

  foreach ($port in $Ports) {
    if (Test-PortOpen -Address $Address -Port $port -TimeoutMs $TimeoutMs) {
      return "http://${Address}:$port"
    }
  }

  return $null
}

function Set-GitProxy {
  param([string]$ProxyUrl)

  git config --global http.proxy $ProxyUrl
  git config --global https.proxy $ProxyUrl
}

function Clear-GitProxy {
  try {
    git config --global --unset-all http.proxy 2>$null
  } catch {
    # Ignore if key does not exist.
  }

  try {
    git config --global --unset-all https.proxy 2>$null
  } catch {
    # Ignore if key does not exist.
  }
}

function Show-GitProxyStatus {
  $httpProxy = git config --global --get http.proxy
  $httpsProxy = git config --global --get https.proxy

  if ([string]::IsNullOrWhiteSpace($httpProxy) -and [string]::IsNullOrWhiteSpace($httpsProxy)) {
    Write-Host "Current Git proxy: not set (direct mode)."
    return
  }

  Write-Host "Current Git proxy:"
  Write-Host "  http.proxy  = $httpProxy"
  Write-Host "  https.proxy = $httpsProxy"
}

Write-Host "=== Auto proxy detection and switch ==="
Write-Host "Candidate ports: $($CandidatePorts -join ', ')"

$gitCmd = Get-Command git -ErrorAction SilentlyContinue
if (-not $gitCmd) {
  Write-Host "git command not found. Please install Git and add it to PATH."
  exit 1
}

$activeProxy = Get-ActiveProxyUrl -Address $ProxyHost -Ports $CandidatePorts -TimeoutMs $ConnectTimeoutMs

if ($activeProxy) {
  Write-Host "Detected available local proxy: $activeProxy"
  Set-GitProxy -ProxyUrl $activeProxy
  Write-Host "Switched Git to proxy mode."
} else {
  Write-Host "No local proxy port detected. Switched Git to direct mode."
  Clear-GitProxy
}

Show-GitProxyStatus
Write-Host "Done."
