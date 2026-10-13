<#
.SYNOPSIS
  Creates a desktop shortcut that opens a workspace folder in a Chrome or
  Edge app window, with Agent Workspace Reader.

.DESCRIPTION
  The shortcut runs the browser with --app on the workspace folder's file://
  URL, so the window has no tabs or address bar.

  By default it uses your usual browser profile, where the extension is
  already installed with "Allow access to file URLs": nothing else to set up.

  With -Isolated it uses a profile of its own instead, with no other
  extension, tab or sync. The first time, add -Setup: it opens the
  extensions page in that profile, where you load the unpacked extension
  and turn on "Allow access to file URLs".

  The script ships at the root of the release zip, next to the extension's
  files, and in the scripts/ folder of the repository. Windows blocks
  scripts downloaded from the internet: run it with
  powershell -ExecutionPolicy Bypass -File make-shortcut.ps1 -Workspace ...

.EXAMPLE
  .\make-shortcut.ps1 -Workspace C:\Users\me\agents\atlas

.EXAMPLE
  .\make-shortcut.ps1 -Workspace C:\Users\me\agents\atlas -Browser edge -Name "Atlas"

.EXAMPLE
  .\make-shortcut.ps1 -Workspace C:\Users\me\agents\atlas -Isolated -Setup
#>
[CmdletBinding()]
param(
  # The workspace folder the window opens on
  [Parameter(Mandatory = $true)]
  [string]$Workspace,

  # Name of the shortcut on the desktop
  [string]$Name = 'Agent Workspace Reader',

  # chrome, edge, or auto: Chrome when installed, else Edge
  [ValidateSet('auto', 'chrome', 'edge')]
  [string]$Browser = 'auto',

  # The browser's executable, found in the usual places when omitted
  [string]$BrowserPath,

  # The profile of your usual browser data the shortcut opens, as named in
  # its folder: Default, Profile 1...
  [string]$ProfileName = 'Default',

  # Uses a browser profile of its own instead of your usual one
  [switch]$Isolated,

  # The folder of that profile, with -Isolated
  [string]$ProfileDir = (Join-Path $env:LOCALAPPDATA 'AgentWorkspaceReader'),

  # With -Isolated, opens the extensions page in that profile to install
  # the extension there
  [switch]$Setup
)

$ErrorActionPreference = 'Stop'

$browsers = @{
  chrome = @{
    Exe     = 'chrome.exe'
    Folder  = 'Google\Chrome\Application'
    Label   = 'Chrome'
    Scheme  = 'chrome'
  }
  edge   = @{
    Exe     = 'msedge.exe'
    Folder  = 'Microsoft\Edge\Application'
    Label   = 'Edge'
    Scheme  = 'edge'
  }
}

function Find-Browser($info) {
  $candidates = @(
    (Join-Path $env:ProgramFiles $info.Folder),
    (Join-Path ${env:ProgramFiles(x86)} $info.Folder),
    (Join-Path $env:LOCALAPPDATA $info.Folder)
  ) | ForEach-Object { Join-Path $_ $info.Exe }
  foreach ($path in $candidates) {
    if ($path -and (Test-Path $path)) { return $path }
  }
  $appPaths = "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\$($info.Exe)",
    "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\$($info.Exe)"
  foreach ($key in $appPaths) {
    if (Test-Path $key) {
      $path = (Get-ItemProperty $key).'(default)'
      if ($path -and (Test-Path $path)) { return $path }
    }
  }
  return $null
}

if ($BrowserPath) {
  if (-not (Test-Path $BrowserPath)) { throw "Browser not found at $BrowserPath" }
  if ($Browser -eq 'auto') {
    $Browser = if ((Split-Path $BrowserPath -Leaf) -ieq 'msedge.exe') { 'edge' } else { 'chrome' }
  }
} else {
  $order = if ($Browser -eq 'auto') { 'chrome', 'edge' } else { @($Browser) }
  foreach ($candidate in $order) {
    $BrowserPath = Find-Browser $browsers[$candidate]
    if ($BrowserPath) { $Browser = $candidate; break }
  }
  if (-not $BrowserPath) {
    throw "$(($order | ForEach-Object { $browsers[$_].Label }) -join ' or ') not found: pass its executable with -BrowserPath."
  }
}
$info = $browsers[$Browser]

$workspacePath = (Resolve-Path $Workspace).Path.TrimEnd('\')
if (-not (Test-Path $workspacePath -PathType Container)) {
  throw "$Workspace is not a folder"
}
# file:///C:/Users/me/agents/atlas/ ; spaces and accents percent-encoded
$workspaceURL = ([uri]"$workspacePath\").AbsoluteUri

if ($Isolated) {
  New-Item -ItemType Directory -Force $ProfileDir | Out-Null
  $profileArgument = "--user-data-dir=`"$ProfileDir`""
} else {
  $profileArgument = "--profile-directory=`"$ProfileName`""
}
$arguments = "$profileArgument --app=`"$workspaceURL`" --no-first-run --no-default-browser-check"

# The extension's folder: the script's own in the release zip, extension/
# next to scripts/ in the repository
$extension = if (Test-Path (Join-Path $PSScriptRoot 'manifest.json')) {
  $PSScriptRoot
} else {
  Join-Path (Split-Path $PSScriptRoot -Parent) 'extension'
}

$desktop = [Environment]::GetFolderPath('Desktop')
$shortcutPath = Join-Path $desktop "$Name.lnk"
$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $BrowserPath
$shortcut.Arguments = $arguments
$shortcut.WorkingDirectory = $workspacePath
$shortcut.Description = "Opens $workspacePath with Agent Workspace Reader"
$icon = Join-Path $extension 'images\icon.ico'
$shortcut.IconLocation = if (Test-Path $icon) { "$icon,0" } else { "$BrowserPath,0" }
$shortcut.Save()

Write-Host "Shortcut created: $shortcutPath"
Write-Host "  opens   $workspaceURL"
Write-Host "  with    $($info.Label), $(if ($Isolated) { "profile $ProfileDir" } else { "profile $ProfileName" })"

if (-not $Isolated) {
  Write-Host ''
  Write-Host "The extension must be installed in that $($info.Label) profile, with ""Allow access to file URLs"" on."
} elseif ($Setup) {
  Write-Host ''
  Write-Host "$($info.Label) opens $($info.Scheme)://extensions/ in that profile. There:"
  Write-Host '  1. Turn on Developer mode.'
  Write-Host "  2. Load unpacked -> $extension"
  Write-Host '  3. Open the extension details and turn on "Allow access to file URLs".'
  Write-Host 'Then close the window and use the shortcut.'
  Start-Process $BrowserPath -ArgumentList "--user-data-dir=`"$ProfileDir`" --no-first-run --no-default-browser-check $($info.Scheme)://extensions/"
} else {
  Write-Host ''
  Write-Host 'First time in this profile? Run again with -Setup to install the extension there.'
}
