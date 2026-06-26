# Deploy demo mock lên Vercel: set VITE_DATA_SOURCE=mock và redeploy.
# Yêu cầu: npx vercel login && npx vercel link (một lần).

$whoami = npx vercel whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Chưa đăng nhập Vercel. Chạy: npx vercel login"
    exit 1
}

foreach ($scope in @("production", "preview", "development")) {
    Write-Host "Setting VITE_DATA_SOURCE=mock ($scope)..."
    npx vercel env rm VITE_DATA_SOURCE $scope --yes 2>$null
    npx vercel env add VITE_DATA_SOURCE $scope --value mock --yes
}

Write-Host "Redeploying production..."
npx vercel --prod --yes

Write-Host "Done. Mở trang login — form sẽ có sẵn admin / 5fedu.com."
