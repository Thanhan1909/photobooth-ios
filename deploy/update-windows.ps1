$ErrorActionPreference = 'Stop'
$repo = 'C:\Projects\photobooth-ios'
$log = Join-Path $repo 'deploy\deploy.log'
$deployedFile = Join-Path $repo 'deploy\deployed.sha'
function Log([string]$message) {
  "[$(Get-Date -Format o)] $message" | Add-Content -Path $log
}
try {
  $runs = Invoke-RestMethod -Uri 'https://api.github.com/repos/Thanhan1909/photobooth-ios/actions/workflows/photobooth-ci.yml/runs?branch=main&per_page=1' -Headers @{ 'User-Agent' = 'photobooth-windows-updater' }
  $run = $runs.workflow_runs | Select-Object -First 1
  if (!$run -or $run.status -ne 'completed' -or $run.conclusion -ne 'success') { Log 'CI has not passed; skip'; exit 0 }
  Set-Location $repo
  $deployed = if (Test-Path $deployedFile) { (Get-Content $deployedFile -Raw).Trim() } else { '' }
  if ($deployed -eq $run.head_sha) { exit 0 }
  if ((git status --porcelain --untracked-files=no).Length -gt 0) { Log 'Local tracked modifications present; skip'; exit 1 }
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
  $healthy = $false
  for ($i = 0; $i -lt 20; $i++) {
    try {
      $web = Invoke-WebRequest -UseBasicParsing -Uri 'http://localhost:8085/mobile/' -TimeoutSec 10
      if ($web.StatusCode -eq 200) { $healthy = $true; break }
    } catch { Start-Sleep -Seconds 3 }
  }
  if (!$healthy) { throw 'Mobile HTTP health check failed; deployed marker not updated' }
  Set-Content -Path $deployedFile -Value $remote -NoNewline
  Log "Deployed $remote"
} catch { Log "ERROR: $_"; exit 1 }
