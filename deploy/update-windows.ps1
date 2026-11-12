$ErrorActionPreference = 'Stop'
$repo = 'C:\Projects\photobooth-ios'
$log = Join-Path $repo 'deploy\deploy.log'
function Log([string]$message) {
  "[$(Get-Date -Format o)] $message" | Add-Content -Path $log
}
try {
  $runs = Invoke-RestMethod -Uri 'https://api.github.com/repos/Thanhan1909/photobooth-ios/actions/workflows/photobooth-ci.yml/runs?branch=main&per_page=1' -Headers @{ 'User-Agent' = 'photobooth-windows-updater' }
  $run = $runs.workflow_runs | Select-Object -First 1
  if (!$run -or $run.status -ne 'completed' -or $run.conclusion -ne 'success') { Log 'CI has not passed; skip'; exit 0 }
  Set-Location $repo
  $current = (git rev-parse HEAD).Trim()
  if ($current -eq $run.head_sha) { exit 0 }
  if ((git status --porcelain).Length -gt 0) { Log 'Local modifications present; skip'; exit 1 }
  git fetch origin main
  if ($LASTEXITCODE -ne 0) { throw 'git fetch failed' }
  $remote = (git rev-parse origin/main).Trim()
  if ($remote -ne $run.head_sha) { Log 'CI is not for current main; skip'; exit 0 }
  git pull --ff-only origin main
  if ($LASTEXITCODE -ne 0) { throw 'git pull failed' }
  git submodule update --init --recursive
  if ($LASTEXITCODE -ne 0) { throw 'submodule failed' }
  docker compose up -d --build
  if ($LASTEXITCODE -ne 0) { throw 'Docker deployment failed' }
  Log "Deployed $remote"
} catch { Log "ERROR: $_"; exit 1 }
