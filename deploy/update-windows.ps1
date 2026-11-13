$ErrorActionPreference = 'Stop'
$repo = 'E:\PhotoBooth\photobooth-ios'
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
  # CI advances deploy/windows only after Docker and application tests pass.
  git fetch origin '+refs/heads/main:refs/remotes/origin/main' '+refs/heads/deploy/windows:refs/remotes/origin/deploy/windows'
  if ($LASTEXITCODE -ne 0) { throw 'Failed to fetch GitHub' }
  $approved = (git rev-parse 'refs/remotes/origin/deploy/windows').Trim()
  $latest = (git rev-parse 'refs/remotes/origin/main').Trim()
  if ($approved -ne $latest) {
    Log "Latest main is not CI-approved ($latest); skip"
    exit 0
  }
  $deployed = if (Test-Path $deployedFile) { (Get-Content $deployedFile -Raw).Trim() } else { '' }
  if ($deployed -eq $approved) { exit 0 }

  $changes = @()
  if ($deployed -match '^[a-f0-9]{40}$') {
    $changes = @(git diff --name-only $deployed $approved)
    if ($LASTEXITCODE -ne 0) { throw 'Unable to compare deployed and approved versions' }
  }
  $frontendOnly = ($changes.Count -gt 0)
  foreach ($file in $changes) {
    # Camera/editor assets and the separately built iOS project never change
    # the Windows Docker image. Avoid rebuilding when these are the only edits.
    if ($file -notmatch '^(mobile/|tests/|\.github/|deploy/|ios-app/|README|DEPLOY-WINDOWS-IPHONE\.md|PHOTO-EDITOR-V4\.md|IOS-SIDELOADLY-README\.md|IPHONE-PWA-README\.md|PINTEREST-14-CURATED-FRAMES\.md|\.gitignore$|scripts/(build-iphone-pwa\.cjs|build-ios-app\.cjs|configure-ios-plist\.py|generate-pwa-icons\.py|generate-curated-frames\.py|generate-frame-gallery\.py)$)') {
      $frontendOnly = $false
      break
    }
  }
  $local = (git rev-parse HEAD).Trim()
  if ($local -ne $approved) {
    git pull --ff-only origin deploy/windows
    if ($LASTEXITCODE -ne 0) { throw 'Cannot fast-forward to approved deployment' }
  }
  git submodule update --init --recursive
  if ($LASTEXITCODE -ne 0) { throw 'Submodule update failed' }

  docker compose config --quiet
  if ($LASTEXITCODE -ne 0) { throw 'Invalid Docker Compose configuration' }
  if ($frontendOnly) {
    # /app/mobile is bind mounted read-only. Git-pulled assets are immediately visible.
    docker compose up -d --no-build
    if ($LASTEXITCODE -ne 0) { throw 'Frontend-only Docker refresh failed' }
    Log "Frontend-only update $approved (no image rebuild)"
  } else {
    $freeBytes = (Get-PSDrive C).Free
    if ($freeBytes -lt 5GB) {
      Log "Docker rebuild blocked: C drive has only $([math]::Round($freeBytes/1GB,2)) GB free; requires 5 GB. Current container unchanged."
      exit 0
    }
    docker compose up -d --build
    if ($LASTEXITCODE -ne 0) { throw 'Docker image rebuild failed' }
  }
  $healthy = $false
  for ($i = 0; $i -lt 15; $i++) {
    try {
      $web = Invoke-WebRequest -UseBasicParsing -Uri 'http://localhost:8085/mobile/' -TimeoutSec 8
      $studio = Invoke-WebRequest -UseBasicParsing -Uri 'http://localhost:8085/mobile/studio-engine.js' -TimeoutSec 8
      if ($web.StatusCode -eq 200 -and $web.Content.Contains('modeOptions') -and
          $studio.StatusCode -eq 200 -and $studio.Content.Contains('BloomStudio')) {
        $healthy = $true
        break
      }
    } catch { Start-Sleep -Seconds 3 }
  }
  if (!$healthy) { throw 'BloomBooth strip health check failed' }
  Set-Content -Path $deployedFile -Value $approved -NoNewline
  Log "Deployed $approved"
} catch {
  Log "ERROR: $_"
  exit 1
}
