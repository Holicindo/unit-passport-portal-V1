# Laporan Komprehensif: Sistem Health Score Unit Passport (V2 vs V3)

> **Proyek:** Holicindo Unit Passport Portal  
> **Dokumen:** Laporan Sinkronisasi Logika, Rumus, dan Perbandingan Health Score V2 vs V3  
> **Tanggal:** 30 September 2026  

---

## 1. Pendahuluan

Laporan ini disusun untuk menyinkronkan logika dan perhitungan *Health Score* yang saat ini berjalan di sistem (versi V3) dengan dokumentasi spesifikasi awal (versi V2) yang terdapat pada dokumen PDF/Markdown *Holic Showcase*. 

Sistem saat ini telah di-upgrade dari arsitektur 2-subsistem (V2) menjadi arsitektur 4-subsistem (V3) untuk memberikan diagnostik yang lebih presisi pada level komponen.

---

## 2. Perbandingan Arsitektur: V2 (Dokumen) vs V3 (Implementasi Saat Ini)

Perbedaan mendasar antara desain V2 di dokumen dan implementasi V3 di sistem:

| Aspek Perbandingan | V2 (Berdasarkan Dokumen) | V3 (Implementasi Saat Ini) |
| :--- | :--- | :--- |
| **Komponen Overall Score** | Suhu Kabinet (70%) + Kompresor (30%) | Kabinet (35%) + Evaporator (25%) + Kondensor (20%) + Elektrikal (20%) |
| **Jumlah Subsistem** | 2 Subsistem | **4 Subsistem Spesifik** |
| **Metode Evaluasi** | Berbasis deret waktu biasa (*time-series*) | Berbasis **Siklus Pendinginan** (*Cycle-based*) |
| **Analisis Evaporator** | ❌ Tidak Ada | ✅ Laju pendinginan (drop rate), amplitudo, beda suhu kabinet-evap |
| **Analisis Kondensor** | ❌ Tidak Ada | ✅ Suhu puncak (peak), kenaikan suhu per siklus (rise) |
| **Analisis Elektrikal** | ✅ Hanya anomali Arus (Ampere) | ✅ Anomali Arus + Duty Cycle + Starts/Hour + Short Cycling |
| **Output Analitik** | Skor (0-100) dan Status | Skor + **Diagnostic Evidence** (Probabilitas akar masalah) |

---

## 3. Logika & Formula Perhitungan V3 (Implementasi Aktual)

Berikut adalah urutan logika dan rumus matematika yang digunakan engine V3 saat ini (berjalan setiap jam via *Cron Job*).

### 3.1. Tahap 1: Kalibrasi & Validasi Data

Sistem mengambil data 24 jam terakhir dan melakukan pembersihan:

1.  **Kalibrasi (1-Point Offset):**
    *   `Temp_Kabinet = Temp_Kabinet_Raw + Offset_Kabinet`
    *   `Temp_Evap = Temp_Evap_Raw + Offset_Evap`
    *   `Temp_Cond = Temp_Cond_Raw + Offset_Cond`
2.  **Validasi (Masking):**
    Data **dibuang/diabaikan** jika:
    *   Pintu sedang terbuka (`is_door_open = true`)
    *   Sensor error / putus (`temp = -127` atau `null`)

### 3.2. Tahap 2: Metrik Dasar (Berlaku di Kabinet & Elektrikal)

*   **TIB (Time In Band):** Persentase waktu suhu kabinet berada di dalam batas target (misal: -2°C s/d 10°C).
    *   *Rumus:* `(Jumlah Data Dalam Target / Total Data Valid) * 100`
*   **HDM (Hot Degree Minutes):** Akumulasi paparan suhu panas di atas batas maksimal per jam.
    *   *Rumus:* `Σ (Max(0, Temp - Target_Max) * (Interval_Detik / 60)) / Total_Jam_Valid`
*   **Duty Cycle:** Persentase waktu kompresor menyala.
    *   *Rumus:* `(Waktu Kompresor ON / Total Waktu Valid) * 100`

### 3.3. Tahap 3: Ekstraksi Berbasis Siklus (Cycle Detection)

Ini adalah terobosan utama V3. Sistem mendeteksi kapan kompresor menyala dan mati berdasarkan sensor arus (`current` > 0.5A = ON). Dari setiap siklus (ON ke OFF), sistem menghitung:

1.  **Starts/Hour:** Frekuensi kompresor menyala per jam.
2.  **Short Cycle Fraction:** Persentase siklus yang durasinya sangat singkat (< 5 menit).

### 3.4. Tahap 4: Perhitungan Penalti & Skor Subsistem (Bobot & Rumus)

Setiap subsistem dihitung penaltinya (0.0 sampai 1.0) dengan interpolasi linear:
`Penalti = clamp((Nilai_Aktual - Batas_Aman) / (Batas_Kritis - Batas_Aman), 0, 1)`

#### A. Skor Kabinet (Bobot 35%)
| Metrik | Batas Aman (Penalti 0) | Batas Kritis (Penalti 1) | Bobot Internal |
| :--- | :--- | :--- | :--- |
| TIB | ≥ 95% | ≤ 70% | 40% |
| HDM/jam | ≤ 1.0 °C·min | ≥ 5.0 °C·min | 40% |
| Cooling Rate | ≥ 0.20 °C/min | ≤ 0.05 °C/min | 20% |
*Rumus:* `Skor Kabinet = 100 * (1 - Total_Penalti_Kabinet)`

#### B. Skor Evaporator (Bobot 25%)
| Metrik | Batas Aman (Penalti 0) | Batas Kritis (Penalti 1) | Bobot Internal |
| :--- | :--- | :--- | :--- |
| Evap Cooling Rate | ≥ 0.50 °C/min | ≤ 0.10 °C/min | 40% |
| Drop Amplitude | ≥ 15.0 °C | ≤ 5.0 °C | 30% |
| Cab-Evap Diff | ≤ 15.0 °C | ≥ 25.0 °C | 30% |
*Rumus:* `Skor Evaporator = 100 * (1 - Total_Penalti_Evaporator)`
*(Catatan: Jika kompresor mati total / Duty Cycle 0%, skor Evaporator = 0)*

#### C. Skor Kondensor (Bobot 20%)
| Metrik | Batas Aman (Penalti 0) | Batas Kritis (Penalti 1) | Bobot Internal |
| :--- | :--- | :--- | :--- |
| Condenser Peak | ≤ 45.0 °C | ≥ 55.0 °C | 60% |
| Rise per Siklus | ≤ 15.0 °C | ≥ 25.0 °C | 40% |
*Rumus:* `Skor Kondensor = 100 * (1 - Total_Penalti_Kondensor)`

#### D. Skor Elektrikal (Bobot 20%)
| Metrik | Batas Aman (Penalti 0) | Batas Kritis (Penalti 1) | Bobot Internal |
| :--- | :--- | :--- | :--- |
| Duty Cycle | ≤ 60% | ≥ 80% | 30% |
| Starts/Hour | ≤ 4x | ≥ 6x | 20% |
| Short Cycle | ≤ 10% | ≥ 30% | 20% |
| Arus Anomali | ≤ 5% | ≥ 50% | 30% |
*Rumus:* `Skor Elektrikal = 100 * (1 - Total_Penalti_Elektrikal)`

---

## 4. Overall Score & Diagnostic Evidence

### Overall Score
*Rumus:* 
`Overall = (Kabinet * 0.35) + (Evaporator * 0.25) + (Kondensor * 0.20) + (Elektrikal * 0.20)`

*Kategori:*
*   🟢 **Optimal (80-100)**
*   🟡 **Perhatian (60-79)**
*   🔴 **Kritis (<60)**

### Diagnostic Evidence (Probabilitas Masalah)
Sistem V3 menyilangkan data penalti antar-subsistem untuk menebak akar masalah:
1.  **Masalah Kondensor:** `(Cond_Rise * 0.3) + (Cond_Peak * 0.2) + (Duty * 0.2) + (HDM * 0.1)`
2.  **Masalah Evaporator:** `(Cab_Evap_Diff * 0.3) + (HDM * 0.2) + (Duty * 0.2) + (Evap_Cool * 0.15)`
3.  **Pendinginan Lemah:** `(HDM * 0.3) + (Cab_Cooling * 0.25) + (Duty * 0.15)`

---

## 5. Sinkronisasi dengan Dokumen "Holic Showcase" PDF (Gap Analysis)

Berdasarkan pengecekan terhadap dokumen PDF usulan, implementasi kita saat ini (V3) **sudah melampaui** spesifikasi dasar V2. Namun, ada beberapa fitur spesifik dari dokumen "Holic Showcase" yang belum diterapkan (sebagai target V4 atau iterasi selanjutnya):

| Fitur dari Dokumen | Status Implementasi | Keterangan |
| :--- | :--- | :--- |
| **TIB & HDM Calculation** | ✅ Selesai (V2/V3) | Logika dan batasan sudah sinkron 100%. |
| **Electrical Anomaly** | ✅ Selesai (V2/V3) | Diperluas dengan deteksi Duty Cycle & Short Cycle di V3. |
| **Subsystem Isolation** | ✅ Selesai (V3) | Evaporator dan Kondensor sudah dipisah skornya. |
| **Door Recovery Score** | ❌ Belum Ada | Analisis berapa lama suhu pulih setelah pintu ditutup belum diimplementasikan. |
| **Defrost Cycle Detection** | ❌ Belum Ada | Belum ada deteksi khusus untuk membedakan *defrost* normal vs abnormal. |
| **Baseline Commissioning** | ❌ Belum Ada | Perbandingan performa dengan 14 hari pertama (saat unit baru) belum diterapkan. |
| **Voltage Anomaly** | ❌ Belum Ada | Deteksi tegangan/voltase listrik tidak stabil belum masuk kalkulasi. |

---

## 6. Kesimpulan & Rekomendasi

1.  **Validasi Logika:** Logika perhitungan V3 yang diterapkan saat ini secara matematis valid dan merupakan pengembangan signifikan dari V2. Penggunaan segmentasi siklus (*cycle-based*) membuat deteksi masalah (seperti kondensor kotor atau evaporator beku) menjadi jauh lebih akurat dibanding deret waktu biasa.
2.  **Isu Data 0% (Screenshot):** Skor 0 pada evaporator/kondensor/elektrikal di dashboard terjadi akibat **tidak adanya data arus kompresor (Duty cycle = 0%)** pada 24 jam terakhir. Sensor arus perlu dipastikan mengirim data dengan benar.
3.  **Next Steps (Pengembangan Lanjutan):** Jika ingin mengadopsi 100% ide dari dokumen PDF, target selanjutnya adalah menambahkan fitur:
    *   *Door Recovery Analytics*
    *   *Voltage Stability Penalty*
    *   *Defrost Analytics*
