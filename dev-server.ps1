param(
  [int]$Port = 8787,
  [string]$Root = (Get-Location).Path
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Get-ContentType([string]$Path) {
  $ext = [System.IO.Path]::GetExtension($Path).ToLowerInvariant()
  switch ($ext) {
    ".html" { return "text/html; charset=utf-8" }
    ".css"  { return "text/css; charset=utf-8" }
    ".js"   { return "application/javascript; charset=utf-8" }
    ".json" { return "application/json; charset=utf-8" }
    ".svg"  { return "image/svg+xml" }
    ".png"  { return "image/png" }
    ".jpg"  { return "image/jpeg" }
    ".jpeg" { return "image/jpeg" }
    ".gif"  { return "image/gif" }
    ".ico"  { return "image/x-icon" }
    ".txt"  { return "text/plain; charset=utf-8" }
    default { return "application/octet-stream" }
  }
}

$resolvedRoot = (Resolve-Path -Path $Root).Path
$prefix = "http://127.0.0.1:$Port/"
$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add($prefix)
$listener.Start()

Write-Host "Local static server started at $prefix"
Write-Host "Serving directory: $resolvedRoot"
Write-Host "Press Ctrl+C to stop."

try {
  while ($listener.IsListening) {
    $context = $listener.GetContext()
    $requestPath = [System.Uri]::UnescapeDataString($context.Request.Url.AbsolutePath.TrimStart('/'))

    if ([string]::IsNullOrWhiteSpace($requestPath)) {
      $requestPath = "index.html"
    }

    $filePath = Join-Path $resolvedRoot $requestPath
    if ((Test-Path -Path $filePath -PathType Container)) {
      $filePath = Join-Path $filePath "index.html"
    }

    if (-not (Test-Path -Path $filePath -PathType Leaf)) {
      $context.Response.StatusCode = 404
      $context.Response.ContentType = "text/plain; charset=utf-8"
      $notFound = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
      $context.Response.OutputStream.Write($notFound, 0, $notFound.Length)
      $context.Response.Close()
      continue
    }

    $bytes = [System.IO.File]::ReadAllBytes($filePath)
    $context.Response.StatusCode = 200
    $context.Response.ContentType = Get-ContentType -Path $filePath
    $context.Response.ContentLength64 = $bytes.Length
    $context.Response.Headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    $context.Response.Headers["Pragma"] = "no-cache"
    $context.Response.Headers["Expires"] = "0"
    $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    $context.Response.Close()
  }
}
finally {
  if ($listener.IsListening) {
    $listener.Stop()
  }
  $listener.Close()
}
