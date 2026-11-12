$ErrorActionPreference = 'Stop'
$repo = 'C:\Projects\photobooth-ios'
$log = Join-Path $repo 'deploy\deploy.log'
$deployedFile = Join-Path $repo 'deploy\deployed.sha'
function Log([string]$message) {
  "[$(Get-Date -Format o)] $message" | Add-Content -Path $log
}
try {
  Set-Location $repo
  if ((git status --porcelain --untracked-files=no).Length -gt 0) {
    Log 'Tracked local modifications: deployment skipped'
    exit 0
  }
  # GitHub Actions advances deploy/windows ONLY when build and HTTP tests pass.
  # Git fetch avoids unauthenticated REST API limits on the Windows host.
  git fetch origin '+refs/heads/main:refs/remotes/origin/main' '+refs/heads/deploy/windows:refs/remotes/origin/deploy/windows'
  if ($LASTEXITCODE -ne 0) { throw 'Failed to fetch CI-approved branch from GitHub' }
  $approved = (git rev-parse 'refs/remotes/origin/deploy/windows').Trim()
  $latest = (git rev-parse 'refs/remotes/origin/main').Trim()
  if ($approved -ne $latest) {
    Log "CI has not approved latest main ($latest); skip"
    exit 0
  }
  $deployed = if (Test-Path $deployedFile) { (Get-Content $deployedFile -Raw).Trim() } else { '' }
  if ($deployed -eq $approved) { exit 0 }
  $local = (git rev-parse HEAD).Trim()
  if ($local -ne $approved) {
    git pull --ff-only origin deploy/windows
    if ($LASTEXITCODE -ne 0) { throw 'Local branch cannot fast-forward to approved deploy branch' }
  }
  git submodule update --init --recursive
  if ($LASTEXITCODE -ne 0) { throw 'Submodule update failed' }
  docker compose up -d --build
  if ($LASTEXITCODE -ne 0) { throw 'Docker deployment failed' }
  $healthy = $false
  for ($i = 0; $i -lt 20; $i++) {
    try {
      $web = Invoke-WebRequest -UseBasicParsing -Uri 'http://localhost:8085/mobile/' -TimeoutSec 10
      if ($web.StatusCode -eq 200 -and $web.Content.Contains('filter-engine.js')) { $healthy = $true; break }
    } catch { Start-Sleep -Seconds 3 }
  }
  if (!$healthy) { throw 'Mobile HTTP health check failed; deployed marker unchanged' }
  Set-Content -Path $deployedFile -Value $approved -NoNewline
  Log "Deployed $approved"
} catch {
  Log "ERROR: $_"
  exit 1
}
