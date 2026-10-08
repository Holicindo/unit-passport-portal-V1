# Laporan Analisis & Logika Perhitungan Health Score (V2)

**Tanggal:** 30 September 2026
**Topik:** Pemodelan Logika Health Score Unit Pendingin (V2) dan Studi Kasus

---

## 1. Pendahuluan
Sistem *Health Score V2* dirancang untuk mengevaluasi kesehatan unit pendingin secara komprehensif berdasarkan data telemetri selama 24 jam terakhir. Sistem mengabaikan data ketika pintu sedang terbuka dan fokus pada dua komponen utama:
1. **Stabilitas Suhu Kabinet (Bobot 70%)**
2. **Kesehatan Kelistrikan / Kompresor (Bobot 30%)**

---

## 2. Metrik & Logika Penilaian

### 2.1 Stabilitas Suhu Kabinet (Suhu)
Skor suhu dievaluasi menggunakan dua metrik yang memiliki bobot masing-masing 50% di dalam kategori suhu:

*   **Time In Target Band (TIB) / Kestabilan Suhu**
    *   **Deskripsi:** Persentase waktu suhu kabinet berada di dalam rentang normal (Target Min s/d Target Max).
    *   **Batas Aman:** ≥ 95%.
    *   **Batas Kritis:** ≤ 70% (Mendapat penalti 100%).
*   **Hot Degree Minutes (HDM) / Tingkat Kepanasan**
    *   **Deskripsi:** Mengukur tingkat keparahan suhu ketika melebihi batas maksimal, dinormalisasi ke dalam *°C·menit per jam*.
    *   **Batas Aman:** ≤ 1 °C·menit/jam.
    *   **Batas Kritis:** ≥ 5 °C·menit/jam (Mendapat penalti 100%).

### 2.2 Kesehatan Kelistrikan (Kompresor)
*   **Deskripsi:** Mengevaluasi stabilitas arus (Ampere) ketika kompresor beroperasi (> 0.5A).
*   **Parameter:** Menggunakan kalibrasi standar (Arus Normal: 1.5A, Toleransi: ± 0.3A).
*   **Penalti:** Jika rasio anomali arus mencapai ≥ 50% dari total waktu kompresor menyala, maka penalti yang diberikan adalah maksimal (100%), yang berarti skor kompresor menjadi 0.

---

## 3. Studi Kasus Perhitungan (Berdasarkan Data Aktual)

Berdasarkan data sampel pada *dashboard* (Skor: 23 - Kritis), berikut adalah penjabaran perhitungannya:

**Data Input:**
*   **TIB (Kestabilan Suhu):** 86.5%
*   **HDM (Tingkat Kepanasan):** 18.1 °C·menit/jam

### Langkah 1: Kalkulasi Penalti Suhu
**A. Penalti TIB (Rentang 70% - 95%)**
> Rumus: `(95 - TIB Aktual) / 25`
> Hitungan: `(95 - 86.5) / 25` = **0.34 (34%)**

**B. Penalti HDM (Rentang 1 - 5)**
> Rumus: `(HDM Aktual - 1) / 4`
> Hitungan: `(18.1 - 1) / 4` = **4.275**
*(Karena nilai > 1, maka penalti dikunci pada angka maksimal yaitu **1.0 atau 100%**)*

### Langkah 2: Agregasi Skor Suhu Kabinet (Bobot 70%)
Skor suhu menggabungkan penalti TIB dan HDM secara berimbang (50:50).
> Total Penalti Suhu = `(0.34 × 0.5) + (1.0 × 0.5)` = `0.17 + 0.5` = **0.67**
> Skor Suhu Aktual = `100 × (1 - 0.67)` = **33 Poin**

### Langkah 3: Kalkulasi Skor Kompresor (Bobot 30%) & Skor Akhir
Dengan mengetahui Skor Suhu (33 Poin) dan Skor Akhir Aktual (23 Poin), kita dapat melakukan *reverse-engineering* untuk mengetahui skor kompresor.

> Skor Akhir = `(Skor Suhu × 0.7) + (Skor Kompresor × 0.3)`
> 23 = `(33 × 0.7) + (Skor Kompresor × 0.3)`
> 23 = `23.1 + (Skor Kompresor × 0.3)`

Karena 23.1 dibulatkan menjadi 23, maka porsi tambahan dari kompresor adalah **0**.
**Kesimpulan:** Skor kompresor adalah **0**, yang mengindikasikan bahwa rasio anomali kelistrikan kompresor telah mencapai atau melebihi 50%.

---

## 4. Kesimpulan
Skor **23 (Kritis)** yang didapatkan oleh unit diakibatkan oleh dua kegagalan fatal:
1. **Tingkat Kepanasan Ekstrem:** Nilai HDM 18.1 sangat jauh di atas ambang batas toleransi maksimal (5.0), menunjukkan bahwa ketika unit melewati batas suhu maksimal, suhunya melonjak sangat tinggi atau dibiarkan terlalu lama.
2. **Anomali Kompresor Berkelanjutan:** Bukti matematis menunjukkan bahwa kompresor gagal mempertahankan arus normalnya dalam mayoritas waktu operasionalnya, yang secara langsung menghanguskan 30% potensi skor kesehatan unit secara keseluruhan.
