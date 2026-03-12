Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$projectRoot = (Resolve-Path -Path (Join-Path $PSScriptRoot "..")).Path
$desktopPath = [Environment]::GetFolderPath("Desktop")
$iconLocation = "$env:SystemRoot\System32\imageres.dll,15"

function New-Shortcut {
  param(
    [string]$Path,
    [string]$TargetPath,
    [string]$WorkingDirectory,
    [string]$Arguments = "",
    [string]$IconLocation = "",
    [string]$Description = ""
  )

  $wsh = New-Object -ComObject WScript.Shell
  $shortcut = $wsh.CreateShortcut($Path)
  $shortcut.TargetPath = $TargetPath
  if ($WorkingDirectory) {
    $shortcut.WorkingDirectory = $WorkingDirectory
  }
  if ($Arguments) {
    $shortcut.Arguments = $Arguments
  }
  if ($IconLocation) {
    $shortcut.IconLocation = $IconLocation
  }
  if ($Description) {
    $shortcut.Description = $Description
  }
  $shortcut.Save()
}

Write-Host "Step 1/3: Set project folder icon..."
$desktopIniPath = Join-Path $projectRoot "desktop.ini"
$desktopIni = @"
[.ShellClassInfo]
IconResource=$iconLocation
"@
Set-Content -Path $desktopIniPath -Value $desktopIni -Encoding ASCII
attrib +r "$projectRoot" | Out-Null
attrib +h +s "$desktopIniPath" | Out-Null
Write-Host "Folder icon configured. (You may need to refresh Explorer)"

Write-Host "Step 2/3: Create launch shortcut..."
$launchShortcutPath = Join-Path $desktopPath "GLOBAL HUMAN SIGNAL - START.lnk"
$launchTarget = Join-Path $projectRoot "auto-run\run-launch-cursor-auto.bat"
New-Shortcut `
  -Path $launchShortcutPath `
  -TargetPath $launchTarget `
  -WorkingDirectory (Join-Path $projectRoot "auto-run") `
  -IconLocation $iconLocation `
  -Description "Open project with auto network check"
Write-Host "Created: $launchShortcutPath"

Write-Host "Step 3/3: Create home preview shortcut..."
$homeShortcutPath = Join-Path $desktopPath "GLOBAL HUMAN SIGNAL - HOME.lnk"
$homeTarget = Join-Path $projectRoot "index.html"
New-Shortcut `
  -Path $homeShortcutPath `
  -TargetPath $homeTarget `
  -WorkingDirectory $projectRoot `
  -IconLocation $iconLocation `
  -Description "Open local homepage preview"
Write-Host "Created: $homeShortcutPath"

Write-Host "Done."
