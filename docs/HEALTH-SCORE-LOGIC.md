# 🎯 HEALTH SCORE SYSTEM - LOGIC SUMMARY

---

## **Overall Score Formula**

```
Overall Score (0-100) = (Stabilitas Suhu × 70%) + (Kesehatan Kompresor × 30%)
```

### **Status Categories:**
- **80-100**: ✅ Optimal (Hijau)
- **60-79**: ⚠️ Perhatian (Orange)  
- **0-59**: ❌ Kritis (Merah)

---

## **1. Stabilitas Suhu (Sub-Cabinet Score)**

```
Stabilitas Suhu = 100 × (1 - Penalty)

Penalty = (TIB Penalty × 50%) + (HDM Penalty × 50%)
```

### **A. TIB (Time In Band) - Kestabilan Suhu**

**Formula:**
```
TIB = (Jumlah data dalam target ÷ Total data valid) × 100%

TIB Penalty:
- TIB ≥ 95%  → Penalty = 0
- TIB < 95%  → Penalty = (95 - TIB) / (95 - 70)
```

**Contoh:**
```
TIB = 96.7%
Penalty = 0  (karena > 95%)
Status: SANGAT BAIK ✅
```

### **B. HDM (Hot Degree Minutes) - Tingkat Kepanasan**

**Formula:**
```
HDM = Σ(Max(0, Suhu - Target Max) × Waktu dalam menit)
HDM per jam = Total HDM ÷ Jam valid

HDM Penalty:
- HDM ≤ 1.0  → Penalty = 0
- HDM > 1.0  → Penalty = (HDM - 1) / (5 - 1)
- HDM ≥ 5.0  → Penalty = 1
```

**Contoh:**
```
HDM = 3.7 °C·min per jam
Penalty = (3.7 - 1) / (5 - 1) = 2.7 / 4 = 0.675
Status: PERHATIAN ⚠️
```

---

## **2. Kesehatan Kompresor**

**Formula:**
```
Untuk setiap data saat kompresor aktif (current > 0.5A):
  Jika current < (Normal - Tolerance) ATAU current > (Normal + Tolerance):
    Hitung sebagai Anomali

Anomaly Ratio = Jumlah Anomali ÷ Total data aktif
Penalty = Min(1, Anomaly Ratio × 2)
Kompresor Score = 100 × (1 - Penalty)
```

**Parameter Default:**
- Normal Ampere: 1.5A
- Tolerance: ±0.3A (20%)

**Contoh:**
```
Total data kompresor aktif: 180
Data anomali: 15
Anomaly Ratio = 15 / 180 = 8.3%
Penalty = 0.083 × 2 = 0.166
Kompresor Score = 100 × (1 - 0.166) = 83.4
Status: BAIK ✅
```

---

## **3. Contoh Perhitungan Lengkap**

**Data Input (24 jam):**
```
TIB = 86.5%
HDM = 3.7 °C·min per jam
Anomaly Ratio = 8%
```

**Step 1: Hitung TIB Penalty**
```
TIB Penalty = (95 - 86.5) / (95 - 70) = 8.5 / 25 = 0.34
```

**Step 2: Hitung HDM Penalty**
```
HDM Penalty = (3.7 - 1) / (5 - 1) = 2.7 / 4 = 0.675
```

**Step 3: Hitung Sub-Cabinet Score**
```
Sub-Cabinet Penalty = (0.34 × 0.5) + (0.675 × 0.5) = 0.17 + 0.3375 = 0.5075
Sub-Cabinet Score = 100 × (1 - 0.5075) = 49.25
```

**Step 4: Hitung Kompresor Score**
```
Kompresor Penalty = 0.08 × 2 = 0.16
Kompresor Score = 100 × (1 - 0.16) = 84
```

**Step 5: Hitung Overall Score**
```
Overall Score = (49.25 × 0.7) + (84 × 0.3)
              = 34.48 + 25.2
              = 59.68
              ≈ 60/100

Status: PERHATIAN ⚠️ (Orange)
```

---

## **4. Filtering Data Valid**

**Yang Diabaikan:**
- ❌ Data saat pintu terbuka (door_open = true)
- ❌ Sensor error (temp = -127°C atau null)
- ❌ Data tidak valid lainnya

**Yang Digunakan:**
- ✅ Data 24 jam terakhir
- ✅ Interval 5 menit (disimpan dari data realtime setiap detik)
- ✅ Setelah kalibrasi offset sensor diterapkan

---

## **5. Execution**

**Cron Job:**
```typescript
@Cron(CronExpression.EVERY_HOUR)
async calculateV2HealthScore() {
  // Dijalankan setiap jam
  // Untuk semua unit dengan status ACTIVE
}
```

**Output Disimpan:**
```typescript
{
  unit_id: string,
  date: string,
  overall_score: number,        // 0-100
  sub_cabinet_score: number,    // Stabilitas Suhu
  tib_percentage: number,       // %
  hdm_value: number,            // °C·min
  confidence_score: number,     // 0.0-1.0
  lifecycle_state: string       // LEARNING/PROVISIONAL/ACTIVE
}
```

---

## **Quick Reference**

| Metric | Good | Warning | Bad |
|--------|------|---------|-----|
| **TIB** | ≥ 95% | 70-94% | < 70% |
| **HDM** | ≤ 1.0 | 1.1-5.0 | > 5.0 |
| **Anomaly** | < 10% | 10-50% | > 50% |
| **Overall** | ≥ 80 | 60-79 | < 60 |

---

**End of Logic Summary**
