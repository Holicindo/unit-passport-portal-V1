# PROPOSAL STRUKTUR BIAYA & SKEMA PRICING IOT MONITORING SYSTEM
**Holicindo Unit Passport Portal**  
*Dokumen Rujukan Komersial & Teknis Project Manager (PM) untuk Meeting Klien / Customer*

---

## 1. Executive Summary
Dokumen ini merumuskan struktur harga penawaran komersial sistem IoT Holicindo secara utuh, mencakup dua komponen utama:
1. **Hardware Device (One-Time / Capex):** Pengadaan modul IoT (ESP32 controller, PCB custom, sensor PZEM listrik, sensor suhu kabinet/evap/kondensor, door sensors, dan power supply) dibulatkan sebesar **Rp 1.000.000 / unit**.
2. **Cloud & Software Subscription (Recurring / Opex):** Biaya pemeliharaan server AWS, database riwayat telemetri, alert engine, dan portal monitoring yang didasarkan pada **real cost AWS sebesar \$96.87 / bulan (± Rp 1.550.000 / bulan)**.

Dokumen ini menyediakan **2 Opsi Model Bisnis** (Beli Putus + Langganan vs Paket Bundling Sewa) serta **Logika Harga Dinamis** untuk volume di bawah dan di atas 50 unit.

---

## 2. Struktur Modal Riil (COGS Breakdown)

### A. Modal Hardware per Unit (One-Time Cost)
| Komponen Hardware | Estimasi Biaya Modal |
| :--- | :--- |
| ESP32 Development Board + Custom PCB Fabrikasi | Rp 300.000 |
| Sensor PZEM-004T v3.0 (Tegangan, Arus, Daya Listrik) + CT Coil | Rp 200.000 |
| Sensor Suhu Waterproof DS18B20 (3 probe: Kabinet, Evap, Kondensor) | Rp 150.000 |
| Magnetic Door Switch (Sensor Pintu 1 - 4) | Rp 100.000 |
| Power Supply / Adaptor 220V-to-5V & Enclosure Box IP65 | Rp 150.000 |
| Wiring Harness, Terminal Block, & Assembling QC | Rp 100.000 |
| **TOTAL BIAYA HARDWARE (Dibulatkan)** | **Rp 1.000.000 / unit** |

### B. Modal Cloud AWS per Bulan (Recurring Fixed Cost)
*Berdasarkan AWS Cost Explorer Aktual (Oktober 2026):*
* **EC2 + Backend Compute:** \$32.83
* **Amplify Portal Frontend:** \$21.30
* **RDS PostgreSQL (db.t3.micro):** \$18.91
* **VPC Public IPv4 Fee:** \$14.14
* **Tax PPN:** \$9.60
* **S3 Storage:** \$0.08
* **TOTAL FIXED COST AWS:** **\$96.87 / bulan (± Rp 1.550.000 / bulan)**

---

## 3. Kalkulasi Modal Riil Cloud per Unit

Karena server AWS bersifat *multi-tenant* (dipakai bersama), beban biaya cloud per unit bergantung pada total unit yang aktif:

| Skala Unit Terpasang | Beban AWS per Unit / Bulan | Modal Hardware (1x di Awal) | Status Kelayakan Finansial |
| :---: | :---: | :---: | :--- |
| **10 Unit** | Rp 155.000 / bulan | Rp 1.000.000 | Skala Pilot (Fixed cost tinggi per unit) |
| **20 Unit** | Rp 77.500 / bulan | Rp 1.000.000 | Skala Menengah Awal |
| **35 Unit** | Rp 44.300 / bulan | Rp 1.000.000 | Menuju Titik Impas Server |
| **50 Unit** | **Rp 32.000 / bulan** | **Rp 1.000.000** | **Break-Even Benchmark** |
| **80 Unit** | Rp 20.625 / bulan | Rp 1.000.000 | Efisien |
| **100 Unit** | Rp 17.000 / bulan | Rp 1.000.000 | Sangat Efisien (*Economies of Scale*) |

---

## 4. Skema Penawaran Harga untuk Customer

PM dapat menawarkan **2 Opsi Struktur Pembayaran** kepada klien tergantung preferensi anggaran klien:

### OPSI 1: Beli Putus Hardware + Langganan Cloud Bulanan (Paling Direkomendasikan)
*Klien membeli perangkat di muka sehingga status alat menjadi milik klien, lalu membayar biaya cloud bulanan.*

1. **Biaya Pengadaan Hardware (One-Time di Awal):**
   - **Harga Jual:** **Rp 1.250.000 / unit**  
     *(Modal Rp 1.000.000 + Margin Perakitan, Flashing Firmware, & QC Rp 250.000)*.

2. **Biaya Langganan Cloud (Recurring Dinamis):**
   - **Pemakaian < 50 Unit:** **Rp 55.000 / unit / bulan** (~ \$3.50)
   - **Pemakaian ≥ 50 Unit:** **Rp 35.000 / unit / bulan** (~ \$2.20) — *Diskon Volume 36%*

#### Simulasi Perhitungan Klien (Opsi 1):
* **Skenario 20 Unit (Pilot Project / < 50 Unit):**
  - Biaya Hardware (1x di muka): `20 × Rp 1.250.000` = **Rp 25.000.000**
  - Biaya Cloud Bulanan: `20 × Rp 55.000` = **Rp 1.100.000 / bulan**
* **Skenario 60 Unit (Rollout Menyeluruh / ≥ 50 Unit):**
  - Biaya Hardware (1x di muka): `60 × Rp 1.250.000` = **Rp 75.000.000**
  - Biaya Cloud Bulanan: `60 × Rp 35.000` = **Rp 2.100.000 / bulan**

---

### OPSI 2: Paket All-in Bundling (Hardware + Cloud Sewa Bulanan)
*Cocok jika klien menolak mengeluarkan modal besar di awal (No Capex). Modal hardware diamortisasi selama kontrak 12 atau 24 bulan.*

* **Pemakaian < 50 Unit:** **Rp 110.000 / unit / bulan** *(Kontrak min. 12 bulan)*
  - *Breakdown:* Amortisasi hardware Rp 55.000 + Cloud & Service Rp 55.000.
* **Pemakaian ≥ 50 Unit:** **Rp 75.000 / unit / bulan** *(Kontrak min. 12 bulan)*
  - *Breakdown:* Amortisasi hardware Rp 40.000 + Cloud & Service Rp 35.000.

---

## 5. Ringkasan Perbandingan untuk Meeting Customer

Tabel perbandingan siap pakai untuk presentasi PM:

| Skema Paket | Investasi Hardware Awal | Biaya Cloud: < 50 Unit | Biaya Cloud: ≥ 50 Unit | Keuntungan untuk Klien |
| :--- | :---: | :---: | :---: | :--- |
| **Opsi 1: Beli Putus + Cloud** *(Best Seller)* | **Rp 1.250.000** / unit *(1x bayar)* | **Rp 55.000** / unit / bln | **Rp 35.000** / unit / bln | Biaya bulanan sangat ringan, alat jadi aset klien |
| **Opsi 2: All-in Sewa Bulanan** | **Rp 0** *(Tanpa DP)* | **Rp 110.000** / unit / bln | **Rp 75.000** / unit / bln | Nol biaya awal, cocok untuk anggaran OPEX operasional |

---

## 6. Kesiapan Teknis Sistem (Bukti Validasi Produksi)

Seluruh fitur yang dijanjikan pada penawaran ini telah berjalan di sistem Holicindo:
1. **Konektivitas Telemetri Real-Time (ESP32):**
   - Mengirim tegangan listrik, arus, daya, suhu kabinet, suhu evaporator, suhu kondensor, dan status 4 pintu setiap saat via MQTT (`iot.service.ts:141-152`).
2. **Early Warning & Threshold Alerts:**
   - Deteksi dini suhu kabinet > 10°C, tegangan drop < 190V atau lonjakan > 240V, serta pintu lupa ditutup (`iot.service.ts:193-250`).
3. **Smart Health Score & Rekomendasi:**
   - Menghitung skor kesehatan mesin 0-100% dan rekomendasi perbaikan pencegahan (`UnitHealthWidget.tsx:9-45`).
4. **Data Retention & Compliance Log:**
   - Riwayat data tersimpan otomatis per 5 menit di AWS RDS PostgreSQL untuk audit kepatuhan suhu (`iot.service.ts:115-137`).

---
*Dokumen ini diterbitkan secara resmi untuk kebutuhan penawaran komersial Holicindo Unit Passport Portal.*
