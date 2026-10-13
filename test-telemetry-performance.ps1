# ============================================================================
# IoT Telemetry Performance Test Script
# ============================================================================
# Usage: .\test-telemetry-performance.ps1
#
# This script tests the optimized telemetry API endpoints and measures:
# - Response time (should be <100ms)
# - Payload size (should be <100KB)
# - Data points count (should match aggregation bucket)
# ============================================================================

Write-Host "🧪 IoT Telemetry Performance Test" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$baseUrl = "http://localhost:3001"
$adminEmail = "admin@holicindo.com"
$adminPassword = "admin123"

# Step 1: Login
Write-Host "🔐 Step 1: Logging in..." -ForegroundColor Yellow

$loginBody = @{
    email = $adminEmail
    password = $adminPassword
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.access_token
    Write-Host "✅ Login successful!" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $token"
}

# Step 2: Get a unit with IoT data
Write-Host "📦 Step 2: Finding unit with IoT data..." -ForegroundColor Yellow

try {
    $unitsResponse = Invoke-RestMethod -Uri "$baseUrl/units?limit=50" -Method GET -Headers $headers -TimeoutSec 10
    $unitsWithIot = $unitsResponse | Where-Object { $_.iot_unit_id -ne $null -and $_.iot_unit_id -ne "" }
    
    if ($unitsWithIot.Count -eq 0) {
        Write-Host "⚠️  No units with IoT data found" -ForegroundColor Yellow
        Write-Host "Please ensure at least one unit has iot_unit_id populated" -ForegroundColor Yellow
        exit 1
    }
    
    $testUnit = $unitsWithIot[0]
    Write-Host "✅ Found test unit:" -ForegroundColor Green
    Write-Host "   ID: $($testUnit.id)" -ForegroundColor Gray
    Write-Host "   Serial: $($testUnit.serial_number)" -ForegroundColor Gray
    Write-Host "   IoT Unit ID: $($testUnit.iot_unit_id)" -ForegroundColor Gray
    Write-Host "   Model: $($testUnit.model_name)" -ForegroundColor Gray
    Write-Host ""
    
} catch {
    Write-Host "❌ Failed to get units: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 3: Test telemetry endpoints
Write-Host "🎯 Step 3: Testing telemetry performance..." -ForegroundColor Yellow
Write-Host ""

$testRanges = @(
    @{ hours = 1; expectedPoints = 60; label = "1 Jam (1 min bucket)" },
    @{ hours = 7; expectedPoints = 84; label = "7 Jam (5 min bucket)" },
    @{ hours = 24; expectedPoints = 288; label = "24 Jam (5 min bucket)" },
    @{ hours = 720; expectedPoints = 720; label = "1 Bulan (1 hour bucket)" },
    @{ hours = 2160; expectedPoints = 1080; label = "3 Bulan (2 hour bucket)" },
    @{ hours = 8760; expectedPoints = 365; label = "1 Tahun (1 day bucket)" }
)

$results = @()

foreach ($range in $testRanges) {
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    Write-Host "📊 Testing: $($range.label)" -ForegroundColor Cyan
    
    $sw = [Diagnostics.Stopwatch]::StartNew()
    
    try {
        $telemetryResponse = Invoke-RestMethod `
            -Uri "$baseUrl/units/$($testUnit.id)/telemetry/history?hours=$($range.hours)" `
            -Method GET `
            -Headers $headers `
            -TimeoutSec 30
        
        $sw.Stop()
        $elapsed = $sw.ElapsedMilliseconds
        
        # Calculate metrics
        $dataPoints = $telemetryResponse.Count
        $jsonPayload = $telemetryResponse | ConvertTo-Json -Depth 3 -Compress
        $payloadSizeKB = [Math]::Round($jsonPayload.Length / 1024, 2)
        
        # Determine performance rating
        $timeRating = if ($elapsed -lt 100) { "🎉 EXCELLENT" } elseif ($elapsed -lt 500) { "✅ GOOD" } else { "⚠️  NEEDS IMPROVEMENT" }
        $sizeRating = if ($payloadSizeKB -lt 100) { "🎉 EXCELLENT" } elseif ($payloadSizeKB -lt 500) { "✅ GOOD" } else { "⚠️  TOO LARGE" }
        
        $pointsDiff = [Math]::Abs($dataPoints - $range.expectedPoints)
        $pointsRating = if ($pointsDiff -lt 50) { "✅ CORRECT" } else { "⚠️  UNEXPECTED" }
        
        Write-Host "   ⏱️  Response Time: $elapsed ms ($timeRating)" -ForegroundColor $(if ($elapsed -lt 100) { "Green" } elseif ($elapsed -lt 500) { "Yellow" } else { "Red" })
        Write-Host "   📦 Data Points: $dataPoints points (expected ~$($range.expectedPoints)) ($pointsRating)" -ForegroundColor $(if ($pointsDiff -lt 50) { "Green" } else { "Yellow" })
        Write-Host "   💾 Payload Size: $payloadSizeKB KB ($sizeRating)" -ForegroundColor $(if ($payloadSizeKB -lt 100) { "Green" } elseif ($payloadSizeKB -lt 500) { "Yellow" } else { "Red" })
        
        # Sample first data point to verify aggregation
        if ($telemetryResponse.Count -gt 0) {
            $firstPoint = $telemetryResponse[0]
            Write-Host "   📅 First Data Point: $($firstPoint.recorded_at)" -ForegroundColor Gray
            Write-Host "   🌡️  Sample Temp (Cabinet): $($firstPoint.temp_cabinet)°C" -ForegroundColor Gray
        }
        
        $results += @{
            Range = $range.label
            Hours = $range.hours
            ResponseTime = $elapsed
            DataPoints = $dataPoints
            ExpectedPoints = $range.expectedPoints
            PayloadSizeKB = $payloadSizeKB
            Success = $true
        }
        
    } catch {
        $sw.Stop()
        Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        
        $results += @{
            Range = $range.label
            Hours = $range.hours
            ResponseTime = $sw.ElapsedMilliseconds
            DataPoints = 0
            ExpectedPoints = $range.expectedPoints
            PayloadSizeKB = 0
            Success = $false
        }
    }
    
    Write-Host ""
    Start-Sleep -Milliseconds 500
}

# Step 4: Summary Report
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "📈 Performance Test Summary" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""

$successCount = ($results | Where-Object { $_.Success }).Count
$totalCount = $results.Count

Write-Host "Success Rate: $successCount / $totalCount tests" -ForegroundColor $(if ($successCount -eq $totalCount) { "Green" } else { "Yellow" })
Write-Host ""

# Create summary table
$results | Where-Object { $_.Success } | ForEach-Object {
    $row = $_
    $timeStatus = if ($row.ResponseTime -lt 100) { "✅" } elseif ($row.ResponseTime -lt 500) { "⚠️ " } else { "❌" }
    $sizeStatus = if ($row.PayloadSizeKB -lt 100) { "✅" } elseif ($row.PayloadSizeKB -lt 500) { "⚠️ " } else { "❌" }
    
    Write-Host "$($row.Range.PadRight(25)) | Time: $timeStatus $($row.ResponseTime)ms | Size: $sizeStatus $($row.PayloadSizeKB)KB | Points: $($row.DataPoints)"
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

# Check for optimization success
$avgResponseTime = ($results | Where-Object { $_.Success } | Measure-Object -Property ResponseTime -Average).Average
$avgPayloadSize = ($results | Where-Object { $_.Success } | Measure-Object -Property PayloadSizeKB -Average).Average

Write-Host ""
Write-Host "🎯 Optimization Goals:" -ForegroundColor Cyan
Write-Host "   Response Time: $(if ($avgResponseTime -lt 100) { '✅ ACHIEVED' } else { '⚠️  NOT YET' }) (avg: $([Math]::Round($avgResponseTime, 0))ms, target: <100ms)" -ForegroundColor $(if ($avgResponseTime -lt 100) { "Green" } else { "Yellow" })
Write-Host "   Payload Size: $(if ($avgPayloadSize -lt 100) { '✅ ACHIEVED' } else { '⚠️  NOT YET' }) (avg: $([Math]::Round($avgPayloadSize, 2))KB, target: <100KB)" -ForegroundColor $(if ($avgPayloadSize -lt 100) { "Green" } else { "Yellow" })
Write-Host ""

if ($avgResponseTime -lt 100 -and $avgPayloadSize -lt 100) {
    Write-Host "🎉 OPTIMIZATION SUCCESSFUL! Performance goals achieved!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Optimization incomplete. Review results above." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Test completed!" -ForegroundColor Green
