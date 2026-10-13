# 🧪 IoT Telemetry Performance Testing Guide

## Quick Start

### Option 1: Run Automated PowerShell Script (Recommended)

```powershell
# Dari root directory project
cd d:\Holicindo\unit-passport-portal
.\test-telemetry-performance.ps1
```

Script akan otomatis:
1. ✅ Login dengan credentials admin
2. ✅ Cari unit yang punya IoT data
3. ✅ Test 6 rentang waktu (1 Jam, 7 Jam, 24 Jam, 1 Bulan, 3 Bulan, 1 Tahun)
4. ✅ Measure response time, payload size, dan data points
5. ✅ Generate summary report

---

### Option 2: Manual Browser Test

#### Prerequisites:
- Backend running di `http://localhost:3001`
- Frontend running di `http://localhost:3000` (atau 3002)

#### Steps:

1. **Buka Browser** (Chrome/Edge recommended)
2. **Buka DevTools** (F12)
3. **Tab Network** → Filter by "Fetch/XHR"
4. **Navigate** ke `http://localhost:3000` (atau 3002)
5. **Login** dengan admin credentials
6. **Pilih unit** yang punya IoT telemetry data
7. **Klik IoT History tab**
8. **Test setiap rentang waktu**:
   - 1 Jam
   - 7 Jam
   - 24 Jam
   - 1 Bulan
   - 3 Bulan
   - 1 Tahun

#### What to Check:

**Network Tab:**
- **Request**: `/units/{id}/telemetry/history?hours=...`
- **Time**: Should be <100ms (green/yellow)
- **Size**: Should be <100KB
- **Status**: 200 OK

**Console Tab (Browser DevTools):**
Should show log like:
```javascript
📊 1 Bulan Data Summary: {
  range: "720h",
  dataPoints: "720",
  latestData: "...",
  note: "Pre-aggregated by backend SQL"
}
```

**Visual Check:**
- ✅ Chart renders smoothly (no lag)
- ✅ No freeze when switching time ranges
- ✅ Data points look aggregated (not thousands of dots)

---

### Option 3: Manual API Test with cURL/Postman

#### Step 1: Get JWT Token

```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@holicindo.com","password":"admin123"}'
```

Copy the `access_token` from response.

#### Step 2: Get Unit ID

```bash
curl -X GET "http://localhost:3001/units?limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

Find a unit with `iot_unit_id` populated, copy the `id`.

#### Step 3: Test Telemetry Endpoints

**Test 1 Jam:**
```bash
curl -X GET "http://localhost:3001/units/{UNIT_ID}/telemetry/history?hours=1" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -w "\nTime: %{time_total}s\nSize: %{size_download} bytes\n"
```

**Test 1 Bulan:**
```bash
curl -X GET "http://localhost:3001/units/{UNIT_ID}/telemetry/history?hours=720" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -w "\nTime: %{time_total}s\nSize: %{size_download} bytes\n"
```

**Test 1 Tahun:**
```bash
curl -X GET "http://localhost:3001/units/{UNIT_ID}/telemetry/history?hours=8760" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -w "\nTime: %{time_total}s\nSize: %{size_download} bytes\n"
```

---

## 🎯 Success Criteria

| Metric | Before Optimization | After Optimization | Target |
|--------|-------------------|-------------------|--------|
| **Response Time** | 500ms - 2s | <100ms | ✅ 90-95% faster |
| **Payload Size (1 Bulan)** | 5MB - 50MB | <100KB | ✅ 99%+ reduction |
| **Data Points (1 Bulan)** | 10k-100k+ rows | ~720 points | ✅ Aggregated |
| **Browser Performance** | Lag/freeze | Smooth | ✅ No lag |
| **Database Query** | Full table scan | Index scan | ✅ Optimized |

---

## 📊 Expected Results

### Data Points by Time Range:

| Range | Hours | Bucket Interval | Expected Points |
|-------|-------|----------------|-----------------|
| 1 Jam | 1 | 1 minute | ~60 |
| 7 Jam | 7 | 5 minutes | ~84 |
| 24 Jam | 24 | 5 minutes | ~288 |
| 1 Bulan | 720 | 1 hour | ~720 |
| 3 Bulan | 2160 | 2 hours | ~1080 |
| 1 Tahun | 8760 | 1 day | ~365 |

### Response Time Goals:

- ✅ **<50ms**: Excellent (ideal)
- ✅ **<100ms**: Good (acceptable)
- ⚠️  **<500ms**: Fair (needs tuning)
- ❌ **>500ms**: Poor (optimization failed)

### Payload Size Goals:

- ✅ **<50KB**: Excellent (ideal)
- ✅ **<100KB**: Good (acceptable)
- ⚠️  **<500KB**: Fair (needs tuning)
- ❌ **>500KB**: Poor (optimization failed)

---

## 🐛 Troubleshooting

### Backend Not Responding

```powershell
# Check if backend is running
curl http://localhost:3001

# Check backend logs
cd app/backend
npm run start:dev
```

### Database Connection Failed

```powershell
# Test RDS connection
psql -h holicindo-passport-db.cty80wocotu9.ap-southeast-2.rds.amazonaws.com -U postgres -d postgres -p 5432

# Check migration 009 applied
SELECT indexname FROM pg_indexes WHERE tablename = 'iot_telemetry_logs';
```

Expected output should include: `idx_iot_telemetry_unit_recorded`

### Data Still Not Aggregated

Check backend logs, should show:
```
📊 Fetching aggregated telemetry: unit=..., hours=720h, bucket=3600s
✅ Returned 720 aggregated data points
```

If not, verify:
1. ✅ Migration 009 executed successfully
2. ✅ Backend code deployed (`iot.service.ts` with SQL aggregation)
3. ✅ Frontend code deployed (no `downsample` function)

### Performance Still Slow

1. **Check database index**:
   ```sql
   EXPLAIN ANALYZE
   SELECT * FROM iot_telemetry_logs 
   WHERE unit_id = 'xxx' 
   AND recorded_at >= NOW() - INTERVAL '24 hours';
   ```
   Should show "Index Scan using idx_iot_telemetry_unit_recorded"

2. **Check RDS Performance Insights** (AWS Console)
3. **Check network latency** (if testing from remote)

---

## 📸 Screenshot Checklist

For reporting/documentation:

- [ ] Network tab showing request time <100ms
- [ ] Network tab showing payload size <100KB
- [ ] Console log showing "Pre-aggregated by backend SQL"
- [ ] Chart rendering smoothly (1 Year range)
- [ ] Backend logs showing aggregated data points
- [ ] Performance comparison (before vs after)

---

## ✅ Sign-off Checklist

Before marking optimization as complete:

- [ ] PowerShell test script runs successfully
- [ ] All 6 time ranges tested
- [ ] Response time < 100ms average
- [ ] Payload size < 100KB for 1 month
- [ ] Browser doesn't lag on 1 year range
- [ ] Export CSV works and file < 1MB
- [ ] Backend logs show SQL aggregation
- [ ] Database index verified active
- [ ] Production deployment tested

---

## 📞 Support

If issues persist:
1. Check `docs/IOT-TELEMETRY-OPTIMIZATION.md` for technical details
2. Review backend logs for SQL errors
3. Verify RDS index with `\d iot_telemetry_logs` in psql
4. Contact DevOps team for RDS Performance Insights

---

**Last Updated**: Oct 9, 2026  
**Author**: Kiro AI Agent  
**Related Docs**: `IOT-TELEMETRY-OPTIMIZATION.md`, `migration 009`
