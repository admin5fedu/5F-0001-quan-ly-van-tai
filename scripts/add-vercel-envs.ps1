$envFile = if (Test-Path ".env.local") { ".env.local" } elseif (Test-Path ".env") { ".env" } else { $null }

if (-not $envFile) {
    Write-Host "Missing .env.local — copy from .env.example and fill in Supabase credentials."
    exit 1
}

$envs = @{}
Get-Content $envFile | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith("#")) {
        $idx = $line.IndexOf("=")
        if ($idx -gt 0) {
            $key = $line.Substring(0, $idx).Trim()
            $val = $line.Substring($idx + 1).Trim().Trim('"').Trim("'")
            if ($key -and $val) { $envs[$key] = $val }
        }
    }
}

$required = @(
    "VITE_DATA_SOURCE",
    "VITE_SUPABASE_URL",
    "SUPABASE_URL",
    "VITE_SUPABASE_PUBLISHABLE_KEY",
    "VITE_SUPABASE_ANON_KEY",
    "SUPABASE_SECRET_KEY",
    "DATABASE_URL"
)

$missing = $required | Where-Object { -not $envs.ContainsKey($_) -or -not $envs[$_] }
if ($missing) {
    Write-Host "Missing required keys in ${envFile}: $($missing -join ', ')"
    exit 1
}

foreach ($key in $required) {
    $val = $envs[$key]
    Write-Host "Adding $key to production..."
    npx vercel env rm $key production --yes 2>$null
    npx vercel env add $key production --value "$val" --yes

    Write-Host "Adding $key to development..."
    npx vercel env rm $key development --yes 2>$null
    npx vercel env add $key development --value "$val" --yes
}

Write-Host "All environment variables synchronized. Redeploying production..."
npx vercel --prod --yes
