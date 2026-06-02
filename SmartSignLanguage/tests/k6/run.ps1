param(
  [ValidateSet("smoke", "app", "recognition", "all")]
  [string]$Suite = "all"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$resultsDir = Join-Path $root "results"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

if (-not (Get-Command k6 -ErrorAction SilentlyContinue)) {
  throw "k6 is not installed or is not available in PATH."
}

New-Item -ItemType Directory -Force $resultsDir | Out-Null

function Invoke-K6Suite {
  param(
    [string]$Name,
    [string]$Script
  )

  $summaryPath = Join-Path $resultsDir "$Name-$timestamp-summary.json"
  k6 run "--summary-export=$summaryPath" $Script
  Write-Host "Saved JSON report: $summaryPath"
}

if ($Suite -in @("smoke", "all")) {
  Invoke-K6Suite "smoke" (Join-Path $root "smoke.js")
}
if ($Suite -in @("app", "all")) {
  Invoke-K6Suite "app" (Join-Path $root "functional/app-api.js")
}
if ($Suite -in @("recognition", "all")) {
  Invoke-K6Suite "recognition" (Join-Path $root "functional/recognition.js")
}
