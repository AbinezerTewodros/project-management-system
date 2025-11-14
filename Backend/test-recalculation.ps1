# ✅ Quick Test Script - Recalculate All Progress
# This triggers the progress recalculation endpoint

Write-Host "`n🔄 Testing Progress Recalculation Endpoint...`n" -ForegroundColor Cyan

# Wait for backend to start
Start-Sleep -Seconds 3

try {
    # Call the recalculation endpoint
    $response = Invoke-WebRequest `
        -Uri "http://localhost:8080/api/ProgressRecalculation/recalculate-all" `
        -Method POST `
        -Headers @{
            "Authorization" = "Bearer $env:TOKEN"
            "Content-Type" = "application/json"
        } `
        -UseBasicParsing

    Write-Host "✅ SUCCESS! Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "`nResponse:" -ForegroundColor Yellow
    $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 3
    
} catch {
    Write-Host "❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "`nError Details: $responseBody" -ForegroundColor Yellow
    }
}

Write-Host "`n✨ Done! Check your backend console logs for detailed progress calculation.`n" -ForegroundColor Cyan

