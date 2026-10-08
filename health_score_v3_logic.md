# Laporan: Logic & Rumus Health Score V3

> **Sistem:** Holicindo Unit Passport Portal  
> **Versi Kalkulasi:** V3 (Full Subsystem Diagnostic)  
> **Engine:** `health-score.service.ts` — Cron job setiap 1 jam  
> **Data window:** 24 jam terakhir

---

## 1. Arsitektur Kalkulasi V3

```
Data Telemetri (24 jam) 
  → Kalibrasi Sensor
  → Validasi & Masking (pintu, sensor error)
  → Segmentasi Siklus Pendinginan
  → Hitung Fitur per Subsistem
  → Hitung Penalti (0–1)
  → Hitung Skor Subsistem (0–100)
  → Overall Score (bobot)
  → Diagnostic Evidence
  → Simpan ke DB
```

---

## 2. Tahap 1 — Kalibrasi & Masking

### Kalibrasi 1-Point Offset
Setiap pembacaan sensor dikoreksi dengan offset kalibrasi unit:

```
temp_cabinet_cal = temp_cabinet_raw + cal_temp_cabinet_offset
temp_evap_cal    = temp_evaporator_raw + cal_temp_evap_offset
temp_cond_cal    = temp_condenser_raw + cal_temp_condenser_offset
```

### Data Valid Mask
Data dikecualikan dari perhitungan jika:
- `is_door_open = TRUE` (pintu sedang terbuka)
- `temp_cabinet = -127` (sensor error / disconnected)
- `temp_cabinet = NULL`

---

## 3. Tahap 2 — Metrik Dasar (Berlaku Semua Subsistem)

### TIB (Time In Band)
```
TIB% = (jumlah_pembacaan_dalam_target / total_pembacaan_valid) × 100
```
- `target_min` dan `target_max` dari pengaturan unit
- Default: -2°C hingga 10°C

### HDM (Hot Degree Minutes per Hour)
```
excursion_per_reading = max(0, temp_cabinet - target_max)
HDM_acc = Σ (excursion × 10/60)     ← 10 detik per reading → menit
HDM_per_hour = HDM_acc / total_valid_hours
```

### Duty Cycle
```
onTimeMs = jumlah_pembacaan_saat_current > 0.5A × 10.000ms
validTimeMs = jumlah_semua_pembacaan_valid × 10.000ms
duty_cycle% = (onTimeMs / validTimeMs) × 100
```

---

## 4. Tahap 3 — Segmentasi Siklus (Cycle Detection)

Sistem mendeteksi siklus ON/OFF kompresor dari sinyal `current`:

```
Transisi OFF → ON  (current ≤0.5 → >0.5):  catat startIdx, startTime
Transisi ON  → OFF (current >0.5 → ≤0.5):  catat endIdx, hitung durationMin
```

Sebuah siklus **valid** jika tidak ada pintu terbuka selama siklus berlangsung.

### Metrik dari Siklus Valid
| Metrik | Definisi |
|--------|----------|
| `starts_per_hour` | total siklus ÷ total valid hours |
| `short_cycle_fraction` | siklus < 5 menit ÷ total siklus valid |
| `condenser_peak` | suhu kondensor tertinggi per siklus (rata-rata) |

---

## 5. Tahap 4 — Fitur Per Subsistem

### 5a. Kabinet (Cabinet)

| Fitur | Cara Hitung |
|-------|-------------|
| `cabinet_cooling_rate` | Regresi linier suhu kabinet menit 2–12 setelah kompresor ON. Slope negatif = laju penurunan °C/menit |
| `cabinet_amplitude` | P95(suhu) – P5(suhu) per siklus = total variasi suhu |

### 5b. Evaporator (V3 Baru)

```
Window Pra-Siklus:  60–120 detik SEBELUM kompresor ON → baseline suhu evap
Window Awal ON:     30–180 detik SETELAH ON → hitung laju penurunan evap
Window Tengah:      30 dtk setelah ON s/d 30 dtk sebelum OFF
```

| Fitur | Rumus |
|-------|-------|
| `evap_cooling_rate` | Slope regresi linier suhu evap pada 30–180 dtk awal siklus (°C/menit) |
| `evap_drop_amplitude` | `Median(evap_pre)` − `P10(evap_during)` → seberapa jauh evap turun |
| `cab_evap_diff` | `Median(cab_during)` − `Median(evap_during)` → beda suhu antara kabinet dan evap |

> **Interpretasi:** Jika `evap_drop` kecil, evaporator tidak mengambil panas dengan baik (kotor/icing). Jika `cab_evap_diff` besar, transfer panas dari kabinet ke evap terhambat.

### 5c. Kondensor (V3 Diperluas)

| Fitur | Rumus |
|-------|-------|
| `condenser_peak` | Max suhu kondensor per siklus (rata-rata semua siklus valid) |
| `condenser_rise` | `Median(cond_during)` − `Median(cond_pre)` → kenaikan suhu kondensor per siklus |

> **Interpretasi:** `condenser_rise` tinggi = kondensor kesulitan membuang panas (kotor/airflow kurang).

---

## 6. Tahap 5 — Penalti & Skor Subsistem

Setiap penalti adalah nilai 0–1 (0 = sempurna, 1 = sangat buruk).  
Formula umum penalti linear:
```
penalti = clamp((nilai - batas_aman) / (batas_kritis - batas_aman), 0, 1)
```

### 6a. Skor Kabinet (Bobot 35%)
| Komponen | Batas Aman | Batas Kritis | Bobot |
|----------|-----------|--------------|-------|
| TIB | ≥ 95% | ≤ 70% | 40% |
| HDM/hour | ≤ 1 °C·min | ≥ 5 °C·min | 40% |
| Cabinet Cooling Rate | ≥ 0.20 °C/min | ≤ 0.05 °C/min | 20% |

```
penalti_kabinet = (pTIB × 0.4) + (pHDM × 0.4) + (pCool × 0.2)
skor_kabinet    = 100 × (1 − penalti_kabinet)
```

### 6b. Skor Evaporator (Bobot 25%)
| Komponen | Batas Aman | Batas Kritis | Bobot |
|----------|-----------|--------------|-------|
| Evap Cooling Rate | ≥ 0.50 °C/min | ≤ 0.10 °C/min | 40% |
| Evap Drop Amplitude | ≥ 15 °C | ≤ 5 °C | 30% |
| Cab-Evap Diff | ≤ 15 °C | ≥ 25 °C | 30% |

```
penalti_evap = (pEvapCool × 0.4) + (pEvapDrop × 0.3) + (pCabEvapDiff × 0.3)
skor_evap    = 100 × (1 − penalti_evap)
```

> ⚠️ **Jika tidak ada siklus terdeteksi (duty cycle = 0%), skor evap = 0** karena semua fitur = 0 → penalti penuh.

### 6c. Skor Kondensor (Bobot 20%)
| Komponen | Batas Aman | Batas Kritis | Bobot |
|----------|-----------|--------------|-------|
| Condenser Peak | ≤ 45 °C | ≥ 55 °C | 60% |
| Condenser Rise | ≤ 15 °C | ≥ 25 °C | 40% |

```
penalti_kondensor = (pCondPeak × 0.6) + (pCondRise × 0.4)
skor_kondensor    = 100 × (1 − penalti_kondensor)
```

### 6d. Skor Elektrikal (Bobot 20%)
| Komponen | Batas Aman | Batas Kritis | Bobot |
|----------|-----------|--------------|-------|
| Duty Cycle | ≤ 60% | ≥ 80% | 30% |
| Starts/Hour | ≤ 4x | ≥ 6x | 20% |
| Short Cycle Fraction | ≤ 10% | ≥ 30% | 20% |
| Ampere Anomaly | ≤ 5% | ≥ 50% | 30% |

```
penalti_elec = (pDuty × 0.3) + (pStarts × 0.2) + (pShort × 0.2) + (pAmp × 0.3)
skor_elec    = 100 × (1 − penalti_elec)
```

---

## 7. Overall Score V3

```
overall_score = (skor_kabinet × 0.35)
              + (skor_evap × 0.25)
              + (skor_kondensor × 0.20)
              + (skor_elec × 0.20)
```

| Status | Range |
|--------|-------|
| 🟢 Optimal | ≥ 80 |
| 🟡 Perhatian | 60–79 |
| 🔴 Kritis | < 60 |

---

## 8. Diagnostic Evidence

Evidence bukan skor, melainkan **probabilitas** masalah pada komponen tertentu berdasarkan kombinasi sinyal:

```
evidence_condenser  = (pCondRise × 0.3) + (pCondPeak × 0.2) + (pDuty × 0.2) + (pHDM × 0.1)
evidence_evaporator = (pCabEvapDiff × 0.3) + (pHDM × 0.2) + (pDuty × 0.2) + (pEvapCool × 0.15)
evidence_weak       = (pHDM × 0.3) + (pCool × 0.25) + (pDuty × 0.15)
```

| Level | Rentang |
|-------|---------|
| 🟢 Rendah | 0–30% |
| 🟡 Sedang | 30–60% |
| 🔴 Tinggi | > 60% |

---

## 9. Analisis Screenshot Saat Ini

Dari tampilan UI yang terlihat:

| Metrik | Nilai | Analisis |
|--------|-------|---------|
| Overall Score | **23** | 🔴 Kritis |
| TIB | 86.5% | ⚠️ Di bawah target 95% (penalti TIB aktif) |
| HDM | 18.1 °C·min | 🔴 Jauh di atas batas 5 (penalti HDM penuh) |
| Duty Cycle | **0.0%** | ⚠️ Tidak ada data arus kompresor |
| Starts/Hour | **0.0x** | ⚠️ Tidak ada siklus terdeteksi |

### Root Cause Skor 0 di Evaporator, Kondensor, Elektrikal

> Karena **Duty Cycle = 0%**, sistem tidak mendeteksi siklus ON/OFF kompresor. Ini terjadi karena:
> 1. Sensor arus (`current`) tidak mengirim data / bernilai 0
> 2. Atau data belum di-refresh (cron job belum jalan sejak V3 di-deploy)
>
> Akibatnya `validCyclesCount = 0`, semua fitur evaporator & kondensor = 0, dan penaltinya = maksimum.

### Solusi
Cron akan otomatis kalkulasi ulang dalam 1 jam. Atau trigger manual via:
```
POST /api/health-score/calculate/:unitId
```

---

## 10. Lifecycle States

| State | Syarat | Kepercayaan |
|-------|--------|-------------|
| LEARNING | 0–2 hari setelah aktivasi | Data terbatas, skor indikatif |
| PROVISIONAL | 3–6 hari | Data memadai, skor mulai akurat |
| ACTIVE | 7+ hari | Full accuracy |

**Confidence Score** = `min(1.0, total_valid_readings / (24 × 360))` — proporsi dari ideal 24 jam penuh.
