$jsonPath = "C:\Users\saidg\Desktop\wit-biz-07943714-b10c8-firebase-adminsdk-fbsvc-1f0d9d9bb7.json"
$envPath = ".env.local"

$json = Get-Content $jsonPath -Raw | ConvertFrom-Json | ConvertTo-Json -Compress
$content = "FIREBASE_SERVICE_ACCOUNT_KEY=" + $json
Set-Content -Path $envPath -Value $content -NoNewline
Write-Host "Done! .env.local created with service account key on single line"
