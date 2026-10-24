$ErrorActionPreference = 'Stop'

if (Test-Path -LiteralPath '.env') {
  throw '.env already exists. Keep the current secrets and edit it directly if needed.'
}

function New-RandomHex([int] $byteCount) {
  $bytes = New-Object byte[] $byteCount
  $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
  return ([BitConverter]::ToString($bytes) -replace '-', '').ToLowerInvariant()
}

function New-AdminPassword {
  $bytes = New-Object byte[] 32
  $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
  return [Convert]::ToBase64String($bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_')
}

$dbPassword = New-RandomHex 32
$jwtSecret = New-RandomHex 32
$adminPassword = New-AdminPassword
$envText = @"
DB_PASSWORD=$dbPassword
JWT_SECRET=$jwtSecret
ADMIN_DEFAULT_PASSWORD=$adminPassword
CORS_ORIGIN=http://localhost
DOMAIN=localhost
"@
Set-Content -LiteralPath '.env' -Value $envText -Encoding ascii
Write-Output 'Created .env with private random secrets.'
Write-Output 'Admin phone: 0812345678'
Write-Output "Admin password: $adminPassword"
Write-Output 'Keep this password private. It is saved in .env.'
