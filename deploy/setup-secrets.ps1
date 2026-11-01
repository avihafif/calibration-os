$ErrorActionPreference = 'Stop'
python (Join-Path $PSScriptRoot '../tools/setup_rehearsal_secrets.py')
if ($LASTEXITCODE -ne 0) { throw 'Secret setup failed.' }
