# Deploy shared source to both GitHub Pages repos (Windows / PowerShell).
# Prerequisites: two clones with correct remotes, e.g.:
#   git clone https://github.com/scholtzap/Clifton-Beach-Frisbee-Weather-Dashboard.git C:\deploy\clifton-deploy
#   git clone https://github.com/scholtzap/Praia-da-Rocha-Beach-Ultimate-Weather-Dashboard.git C:\deploy\praia-deploy
#
# Usage (from repo root):
#   .\deploy-all.ps1 -CommitMessage "Fix tides chart"
#
# Environment (optional):
#   $env:DEPLOY_SOURCE_ROOT = "C:\path\to\beach-ultimate-weather-dashboard"   # default: this script's directory
#   $env:CLIFTON_DEPLOY_PATH = "C:\deploy\clifton-deploy"
#   $env:PRAIA_DEPLOY_PATH = "C:\deploy\praia-deploy"
# Clifton with youtube_search: set YOUTUBE_API_KEY for that build only (do not commit .env):
#   $env:YOUTUBE_API_KEY = "..."   # browser key, referrer-restricted

param(
    [string]$CommitMessage = "Update configuration and rebuild sites"
)

$ErrorActionPreference = "Stop"

$MainDir = if ($env:DEPLOY_SOURCE_ROOT) { $env:DEPLOY_SOURCE_ROOT } else { $PSScriptRoot }
$CliftonPath = $env:CLIFTON_DEPLOY_PATH
$PraiaPath = $env:PRAIA_DEPLOY_PATH

if (-not $CliftonPath -or -not $PraiaPath) {
    Write-Error @"
Set CLIFTON_DEPLOY_PATH and PRAIA_DEPLOY_PATH to your deploy clone directories.

Example:
  `$env:CLIFTON_DEPLOY_PATH = 'C:\deploy\clifton-deploy'
  `$env:PRAIA_DEPLOY_PATH = 'C:\deploy\praia-deploy'
"@
}

$filesToCopy = @(
    "config.yml",
    "script.js",
    "style.css",
    "README.md",
    "DEPLOYMENT.md",
    "MULTI-REPO-WORKFLOW.md",
    "deploy-all.sh",
    "deploy-all.ps1"
)

function Deploy-One {
    param(
        [string]$DeployRoot,
        [string]$LocationName
    )

    Write-Host "Deploying to $LocationName ($DeployRoot) ..."

    foreach ($f in $filesToCopy) {
        $src = Join-Path $MainDir $f
        if (-not (Test-Path -LiteralPath $src)) {
            Write-Error "Missing source file: $src"
        }
        Copy-Item -LiteralPath $src -Destination (Join-Path $DeployRoot $f) -Force
    }

    $scriptsSrc = Join-Path $MainDir "scripts"
    $scriptsDst = Join-Path $DeployRoot "scripts"
    if (Test-Path -LiteralPath $scriptsDst) {
        Remove-Item -LiteralPath $scriptsDst -Recurse -Force
    }
    Copy-Item -LiteralPath $scriptsSrc -Destination $scriptsDst -Recurse -Force

    Push-Location $DeployRoot
    try {
        $env:LOCATION = $LocationName
        node scripts/build-html.js
        git add config.yml script.js style.css README.md DEPLOYMENT.md MULTI-REPO-WORKFLOW.md deploy-all.sh deploy-all.ps1 scripts/ index.html
        git commit -m $CommitMessage
        if ($LASTEXITCODE -ne 0) {
            Write-Host "No changes to commit for $LocationName."
        }
        else {
            git push
        }
    } finally {
        Pop-Location
        Remove-Item Env:LOCATION -ErrorAction SilentlyContinue
    }

    Write-Host "Done: $LocationName"
}

Write-Host "Source: $MainDir"
Write-Host "Commit: $CommitMessage"
Write-Host ""

Deploy-One -DeployRoot $CliftonPath -LocationName "clifton"
Deploy-One -DeployRoot $PraiaPath -LocationName "praia"

Write-Host ""
Write-Host "All deployments finished."
