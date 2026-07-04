# Requirements Document

## Introduction

Halaman detail unit (`/id/[token]`) adalah halaman passport digital yang dapat diakses publik melalui pemindaian QR Code. Saat ini halaman ini menggunakan design system dark glassmorphism (`#010412`, card transparan) yang **tidak konsisten** dengan seluruh portal Holicindo lainnya yang menggunakan light neumorphism (`#F2F4F7`, card putih).

Selain itu, file `id.module.css` telah mencapai 2.259 baris dengan tiga lapisan styling yang saling bertabrakan (dark base + `[data-theme="light"]` overrides + `globals.css` overrides), membuat setiap iterasi desain menjadi tidak terprediksi dan sulit dikelola.

Refactor ini bertujuan untuk:
1. Menyelaraskan tampilan halaman dengan design system portal yang sudah ada
2. Menulis ulang `id.module.css` dari nol — light-first, bersih, tanpa lapisan override
3. Mengintegrasikan komponen passport (`SpecCard`, `ServiceHistory`, `ActionButtons`, `DocumentLibrary`) yang sudah tersedia namun belum dipakai
4. Menghapus semua inline styles dari `page.tsx` dan memindahkannya ke className

---

## Glossary

- **Design_System**: Kumpulan token warna, tipografi, dan shadow yang digunakan secara konsisten di seluruh portal Holicindo, bersumber dari `globals.css`
- **Light_Neumorphism**: Gaya visual dengan background `#F2F4F7` atau `#ECEEF2`, card putih, dan shadow simetris `(-6px -6px 14px rgba(255,255,255,0.85), 6px 6px 14px rgba(0,31,63,0.1))` yang digunakan di portal
- **Passport_Page**: Halaman `/id/[token]` — halaman detail unit yang dapat diakses publik tanpa login
- **Carousel**: Komponen navigasi geser kiri-kanan untuk berpindah antar section di halaman passport
- **Passport_Components**: Komponen React di `src/components/passport/` (`SpecCard`, `ServiceHistory`, `ActionButtons`, `DocumentLibrary`) yang sudah menggunakan token light
- **CSS_Module**: File `.module.css` yang digunakan oleh Next.js untuk CSS scoping per komponen
- **CSS_Token**: Variabel CSS yang didefinisikan di `globals.css` (contoh: `--color-deep-navy`, `--radius-md`)
- **Topbar**: Header standalone yang berisi logo, badge akses, dan tombol navigasi
- **Role**: Tingkat akses pengguna — Tamu (public), Client (fleet owner), Partner (teknisi), Admin
- **Inline_Style**: Properti `style={{ ... }}` yang ditulis langsung di JSX, bukan via className
- **Slide**: Satu unit konten dalam Carousel, ditampilkan sebagai card putih neumorphism
- **Stats_Card**: Slide yang menampilkan 5 status unit dalam grid
- **Service_History**: Section timeline vertikal di bawah carousel yang menampilkan riwayat servis unit
- **IoT_Telemetry**: Section data sensor real-time di bawah Service History, jika unit memiliki perangkat IoT
- **Modal**: Dialog overlay untuk form input (service request, log partner, transfer kepemilikan)
- **Dark_Mode_Toggle**: Tombol yang saat ini ada di halaman untuk beralih antara tampilan gelap/terang — akan **dihapus** dalam refactor ini

---

## Requirements

### Requirement 1: Konsistensi Design System

**User Story:** Sebagai pengguna yang membuka halaman detail unit setelah mengunjungi portal Holicindo, saya ingin tampilan halaman konsisten dengan portal, sehingga pengalaman visual terasa menyatu dan profesional.

#### Acceptance Criteria

1. THE `Passport_Page` SHALL menggunakan warna background `#F2F4F7` (Light Tech Grey) sebagai background halaman utama
2. THE `Passport_Page` SHALL menggunakan font Montserrat untuk semua heading dan Inter untuk semua body text, sesuai dengan `--font-heading` dan `--font-body` dari `Design_System`
3. WHEN elemen card ditampilkan, THE `Passport_Page` SHALL menerapkan shadow neumorphism `(-6px -6px 14px rgba(255,255,255,0.85), 6px 6px 14px rgba(0,31,63,0.1))` sesuai `Design_System`
4. THE `Passport_Page` SHALL menggunakan `--color-deep-navy` (`#001F3F`) sebagai warna teks heading utama
5. THE `Passport_Page` SHALL menggunakan `--color-space-grey` (`#717378`) sebagai warna teks body dan label
6. THE `Passport_Page` SHALL menggunakan `--color-cobalt-blue` (`#2E5BFF`) sebagai warna aksen untuk tombol, link, dan elemen aktif
7. THE `Passport_Page` SHALL menggunakan `--color-safety-orange` (`#FF6B00`) hanya untuk elemen warning, emergency, dan alert kritis
8. THE `Passport_Page` SHALL menggunakan border radius `--radius-sm` (8px), `--radius-md` (12px), dan `--radius-lg` (16px) sesuai konteks elemen
9. THE `Passport_Page` SHALL menggunakan border standar `rgba(0,31,63,0.05)` hingga `rgba(0,31,63,0.08)` untuk pemisah elemen

---

### Requirement 2: Penulisan Ulang CSS Module

**User Story:** Sebagai developer yang melakukan maintenance, saya ingin `id.module.css` bersih dan mudah dipahami, sehingga perubahan desain di masa depan tidak menimbulkan konflik styling yang tidak terduga.

#### Acceptance Criteria

1. THE `CSS_Module` (`id.module.css`) SHALL ditulis ulang dari nol dengan pendekatan light-first tanpa `[data-theme]` override
2. THE `CSS_Module` SHALL hanya menggunakan `CSS_Token` dari `globals.css` dan tidak mendefinisikan ulang nilai warna secara hardcoded (kecuali nilai yang memang belum tersedia sebagai token)
3. THE `CSS_Module` SHALL tidak memiliki blok `[data-theme="light"]` atau `[data-theme="dark"]` untuk override styling halaman passport
4. THE `CSS_Module` SHALL tidak memiliki lapisan override yang bertentangan antar selector untuk elemen yang sama
5. WHEN `id.module.css` selesai ditulis ulang, THE `CSS_Module` SHALL memiliki jumlah baris yang secara signifikan lebih sedikit dari versi sebelumnya (2.259 baris)
6. THE `CSS_Module` SHALL mengorganisasi selector secara berurutan mengikuti alur rendering halaman (Topbar → Header → Carousel → Section → Modal)
7. THE `CSS_Module` SHALL menyertakan komentar section untuk setiap blok fungsional utama

---

### Requirement 3: Penghapusan Inline Styles dari JSX

**User Story:** Sebagai developer, saya ingin semua styling ada di CSS Module, sehingga saya dapat memahami dan mengubah tampilan dari satu file tanpa harus menelusuri JSX.

#### Acceptance Criteria

1. THE `Passport_Page` (`page.tsx`) SHALL tidak memiliki properti `style={{ ... }}` untuk styling visual seperti warna, padding, margin, border, dan typography
2. WHEN sebuah elemen membutuhkan styling kondisional berdasarkan role atau state, THE `Passport_Page` SHALL menggunakan kombinasi `className` dengan CSS Module selector atau CSS custom property, bukan `style={{ }}`
3. THE `Passport_Page` SHALL tetap boleh menggunakan `style={{ }}` hanya untuk nilai yang benar-benar dinamis dan tidak dapat diekspresikan dengan CSS (contoh: nilai yang berasal dari kalkulasi JavaScript runtime)
4. THE `Passport_Page` SHALL menggunakan `className` dari `CSS_Module` yang telah didefinisikan untuk semua elemen yang sebelumnya memiliki `Inline_Style`

---

### Requirement 4: Integrasi Komponen Passport

**User Story:** Sebagai developer, saya ingin `page.tsx` menggunakan komponen passport yang sudah ada, sehingga tidak ada duplikasi kode dan tampilan konsisten dengan komponen-komponen tersebut.

#### Acceptance Criteria

1. THE `Passport_Page` SHALL menggunakan komponen `SpecCard` dari `src/components/passport/SpecCard.tsx` untuk menampilkan data spesifikasi unit di Slide 1 Carousel
2. THE `Passport_Page` SHALL menggunakan komponen `ServiceHistory` dari `src/components/passport/ServiceHistory.tsx` untuk menampilkan timeline riwayat servis di Section Service History
3. THE `Passport_Page` SHALL menggunakan komponen `ActionButtons` dari `src/components/passport/ActionButtons.tsx` untuk tombol aksi utama di Slide 2 (Layanan & Dukungan) sesuai role
4. THE `Passport_Page` SHALL menggunakan komponen `DocumentLibrary` dari `src/components/passport/DocumentLibrary.tsx` untuk menampilkan konten Slide 6 (Manual & Dokumen)
5. WHEN `Passport_Components` diintegrasikan, THE `Passport_Page` SHALL menghapus kode rendering duplikat yang sebelumnya menangani fungsi yang sama secara inline
6. IF komponen passport membutuhkan penyesuaian minor untuk konteks halaman, THEN THE `Passport_Components` SHALL disesuaikan dengan cara yang tidak merusak fungsionalitas di konteks lain

---

### Requirement 5: Topbar Standalone

**User Story:** Sebagai pengguna yang mengakses halaman passport, saya ingin ada navigasi yang jelas di bagian atas halaman, sehingga saya dapat mengidentifikasi platform dan level akses saya.

#### Acceptance Criteria

1. THE `Passport_Page` SHALL menampilkan Topbar dengan background putih (`--color-optic-white`) dan shadow tipis di bagian paling atas halaman
2. THE Topbar SHALL menampilkan logo Holicindo di sisi kiri
3. THE Topbar SHALL menampilkan badge level akses pengguna di sisi kanan dengan label sesuai role:
   - Tamu: `LEVEL 1: PUBLIC SCAN`
   - Client (milik sendiri): `LEVEL 2: FLEET OWNER`
   - Client (unit franchise lain): `LEVEL 2: RESTRICTED`
   - Partner: `LEVEL 3: TECHNICAL PARTNER`
   - Admin: `LEVEL 4: ADMINISTRATOR`
4. WHEN pengguna memiliki riwayat navigasi, THE Topbar SHALL menampilkan tombol kembali di sisi kiri
5. THE Topbar SHALL tidak menampilkan toggle dark/light mode
6. THE Topbar SHALL konsisten dengan style topbar yang digunakan di halaman portal lainnya

---

### Requirement 6: Header Unit

**User Story:** Sebagai pengguna yang memindai QR, saya ingin langsung melihat identitas unit secara jelas, sehingga saya yakin sedang melihat informasi unit yang benar.

#### Acceptance Criteria

1. THE `Passport_Page` SHALL menampilkan serial number unit dengan font Montserrat bold, ukuran besar, warna `--color-deep-navy`
2. THE `Passport_Page` SHALL menampilkan nama model unit di bawah serial number dengan warna `--color-space-grey`
3. THE `Passport_Page` SHALL menampilkan badge "Terverifikasi" dengan ikon CheckCircle di samping serial number
4. THE `Passport_Page` SHALL menampilkan badge tipe unit (Showcase/Mesin) dengan warna sesuai konstanta `UNIT_TYPE_COLORS`
5. THE `Passport_Page` SHALL menampilkan timestamp "Terakhir diperbarui" dengan format tanggal Indonesia di bawah header unit
6. THE `Passport_Page` SHALL tidak menampilkan tombol toggle dark/light mode di area header

---

### Requirement 7: Struktur Carousel

**User Story:** Sebagai pengguna di perangkat mobile, saya ingin dapat menggeser layar untuk berpindah antar section informasi unit, sehingga semua informasi dapat diakses tanpa scroll yang panjang.

#### Acceptance Criteria

1. THE Carousel SHALL memuat 6 Slide yang dapat digeser secara horizontal
2. THE Carousel SHALL menyediakan tombol navigasi panah kiri dan kanan untuk berpindah antar Slide
3. WHEN pengguna menggeser atau mengklik tombol navigasi, THE Carousel SHALL menampilkan satu Slide penuh dalam viewport
4. THE Carousel SHALL menampilkan setiap Slide sebagai card putih (`--color-optic-white`) dengan shadow neumorphism
5. WHEN Carousel ditampilkan di layar desktop (lebar > 768px), THE Carousel SHALL menampilkan sebagian dari Slide berikutnya untuk memberikan visual cue bahwa konten dapat digeser
6. THE Carousel SHALL mempertahankan posisi scroll saat pengguna kembali ke halaman dalam sesi yang sama

---

### Requirement 8: Slide 1 — Spesifikasi Utama

**User Story:** Sebagai pengguna yang memindai QR, saya ingin melihat spesifikasi teknis unit dengan jelas, sehingga saya dapat memahami kapabilitas unit yang saya hadapi.

#### Acceptance Criteria

1. THE Slide SHALL menampilkan foto utama unit jika tersedia di `specs.photo_gallery`, atau placeholder icon Package jika tidak ada foto
2. THE Slide SHALL menampilkan spesifikasi unit menggunakan komponen `SpecCard` dengan data yang sesuai tipe unit (MESIN atau SHOWCASE)
3. WHEN tipe unit adalah MESIN, THE Slide SHALL menampilkan: Dimensi, Daya/Power, Kapasitas, Kompresor, Refrigeran
4. WHEN tipe unit adalah SHOWCASE, THE Slide SHALL menampilkan: Kompresor, Refrigeran, Daya/Power, Dimensi, Kapasitas
5. THE Slide SHALL menampilkan tombol "Lihat Semua Spesifikasi" yang membuka modal AllSpecs
6. WHEN pengguna adalah Admin dan mengklik tombol Revise, THE Slide SHALL menampilkan form edit inline untuk semua field spesifikasi

---

### Requirement 9: Slide 2 — Layanan & Dukungan

**User Story:** Sebagai pengguna dengan role yang berbeda, saya ingin melihat aksi yang relevan dengan level akses saya, sehingga saya dapat melakukan tindakan yang sesuai tanpa kebingungan.

#### Acceptance Criteria

1. WHEN pengguna adalah Tamu (guest), THE Slide SHALL menampilkan tombol "Laporkan Masalah / Request Service" dan tombol "Sign In" menggunakan komponen `ActionButtons`
2. WHEN pengguna adalah Client dengan unit milik sendiri, THE Slide SHALL menampilkan label "Akses Pemilik (Fleet Owner)" dan tombol "Request Emergency Service"
3. WHEN pengguna adalah Client dengan unit milik franchise lain, THE Slide SHALL menampilkan pesan "Akses Terbatas" tanpa tombol aksi internal
4. WHEN pengguna adalah Partner, THE Slide SHALL menampilkan: notifikasi tiket aktif (jika ada), tombol "Selesaikan & Tutup Tiket", dan tombol "Tambah Catatan Servis"
5. WHEN pengguna adalah Admin, THE Slide SHALL menampilkan: tombol "Request Service" dan tombol "Pindahkan Kepemilikan"
6. THE Slide SHALL menggunakan komponen `ActionButtons` untuk rendering tombol aksi utama
7. THE Slide SHALL menampilkan ikon yang sesuai role (Lock untuk tamu, UserCheck untuk client, Wrench untuk partner, ShieldAlert untuk admin)

---

### Requirement 10: Slide 3 — Stats Card

**User Story:** Sebagai pengguna, saya ingin melihat ringkasan status unit dalam satu tampilan, sehingga saya dapat dengan cepat mengetahui kondisi unit secara keseluruhan.

#### Acceptance Criteria

1. THE Slide SHALL menampilkan 5 status card dalam grid: Status Unit, Garansi, Last Service, Next Service, Verifikasi
2. THE Stats_Card SHALL menampilkan ikon, judul, status, dan keterangan singkat untuk setiap item
3. WHEN garansi aktif, THE Stats_Card untuk Garansi SHALL menampilkan warna aksen biru dengan teks tanggal berakhir
4. WHEN garansi sudah kedaluwarsa, THE Stats_Card untuk Garansi SHALL menampilkan warna warning amber dengan teks "Hubungi support"
5. THE Stats_Card SHALL menampilkan tooltip informatif ketika kursor diarahkan ke ikon HelpCircle di setiap kartu
6. THE Slide SHALL menggunakan card putih neumorphism yang konsisten dengan Slide lainnya

---

### Requirement 11: Slide 4 — QC Reports

**User Story:** Sebagai pengguna yang ingin memverifikasi kualitas unit, saya ingin mengakses laporan QC dengan mudah, sehingga saya dapat memvalidasi standar kualitas unit.

#### Acceptance Criteria

1. THE Slide SHALL menampilkan daftar link ke laporan QC yang tersedia: Test Run Results, laporan sistem pendingin, QC Service Report, dan QC Service Form
2. WHEN laporan tersedia, THE Slide SHALL menampilkan jumlah laporan yang ada di sebelah label
3. WHEN laporan hanya ada satu, THE Slide SHALL langsung membuka laporan tersebut saat diklik
4. WHEN laporan lebih dari satu, THE Slide SHALL menampilkan submenu atau navigasi ke daftar laporan
5. WHEN pengguna adalah Admin dan mengklik Revise, THE Slide SHALL menampilkan form upload file untuk Test Run Results
6. THE Slide SHALL menggunakan styling card putih neumorphism yang konsisten dengan Slide lainnya

---

### Requirement 12: Slide 5 — Foto & Galeri

**User Story:** Sebagai pengguna, saya ingin melihat foto-foto unit, sehingga saya dapat memverifikasi kondisi fisik unit secara visual.

#### Acceptance Criteria

1. THE Slide SHALL menampilkan galeri foto dari `specs.photo_gallery` jika tersedia
2. WHEN tidak ada foto tersedia, THE Slide SHALL menampilkan pesan kosong yang informatif
3. WHEN ada foto, THE Slide SHALL menampilkan foto dalam grid yang dapat diklik untuk memperbesar
4. WHEN pengguna mengklik foto, THE Slide SHALL membuka lightbox atau modal preview foto
5. WHEN pengguna adalah Admin dan mengklik Revise, THE Slide SHALL menampilkan form upload foto dengan preview
6. THE Slide SHALL menggunakan styling card putih neumorphism yang konsisten dengan Slide lainnya

---

### Requirement 13: Slide 6 — Manual & Dokumen

**User Story:** Sebagai pengguna yang ingin mengoperasikan atau merawat unit, saya ingin mengakses dokumen manual dengan mudah, sehingga saya dapat merujuk ke panduan resmi.

#### Acceptance Criteria

1. THE Slide SHALL menggunakan komponen `DocumentLibrary` untuk menampilkan daftar manual dan dokumen unit
2. WHEN dokumen tersedia, THE Slide SHALL menampilkan nama dokumen, tipe file, dan tombol aksi (unduh/lihat)
3. WHEN tidak ada dokumen tersedia, THE Slide SHALL menampilkan pesan kosong yang informatif
4. WHEN pengguna adalah Admin dan mengklik Revise, THE Slide SHALL menampilkan form upload dokumen
5. THE Slide SHALL menggunakan styling card putih neumorphism yang konsisten dengan Slide lainnya

---

### Requirement 14: Section Service History

**User Story:** Sebagai client atau partner, saya ingin melihat riwayat servis unit secara lengkap, sehingga saya dapat memahami histori perawatan dan masalah yang pernah terjadi.

#### Acceptance Criteria

1. THE `Passport_Page` SHALL menampilkan Section Service History di bawah Carousel menggunakan komponen `ServiceHistory`
2. THE `ServiceHistory` SHALL menampilkan riwayat servis dalam format timeline vertikal dengan dot dan garis penghubung
3. WHEN tidak ada riwayat servis, THE `ServiceHistory` SHALL menampilkan pesan kosong yang sesuai
4. WHEN pengguna adalah Tamu atau Client dengan akses terbatas, THE `ServiceHistory` SHALL menampilkan pesan informasi bahwa riwayat lengkap hanya tersedia untuk pengguna yang login
5. THE `ServiceHistory` SHALL menampilkan untuk setiap entri: tipe log, tanggal, nama teknisi, status, dan catatan servis
6. THE `ServiceHistory` SHALL menggunakan design token light sesuai yang sudah diimplementasikan di `ServiceHistory.module.css`

---

### Requirement 15: Section IoT Telemetry

**User Story:** Sebagai partner atau admin, saya ingin melihat data sensor real-time unit, sehingga saya dapat memantau kondisi operasional unit dari jarak jauh.

#### Acceptance Criteria

1. WHEN unit memiliki data IoT, THE `Passport_Page` SHALL menampilkan Section IoT Telemetry di bawah Section Service History
2. WHEN unit tidak memiliki data IoT, THE `Passport_Page` SHALL tidak menampilkan Section IoT Telemetry
3. THE IoT Section SHALL menggunakan styling card putih neumorphism yang konsisten dengan section lainnya
4. THE IoT Section SHALL menggunakan komponen `IotTelemetryWidget` yang sudah tersedia tanpa modifikasi logika

---

### Requirement 16: Modal Dialog

**User Story:** Sebagai pengguna yang ingin melakukan aksi (request service, tambah log), saya ingin modal dialog yang bersih dan mudah diisi, sehingga proses input terasa lancar dan tidak mengganggu.

#### Acceptance Criteria

1. THE Modal SHALL menggunakan background putih bersih (`#ffffff`) untuk card modal pada semua ukuran layar
2. THE Modal SHALL menggunakan styling form yang konsisten dengan form-form di portal lainnya
3. WHEN Modal ditampilkan di layar mobile (lebar ≤ 768px), THE Modal SHALL menjadi full-screen dengan animasi slide-up
4. WHEN Modal ditampilkan di layar desktop, THE Modal SHALL menjadi dialog terpusat dengan overlay semi-transparan
5. THE Modal SHALL tidak terpengaruh oleh perubahan styling pada `id.module.css` untuk komponen carousel dan header
6. THE `Passport_Page` SHALL mempertahankan semua Modal yang ada (`ServiceRequestModal`, `PartnerLogModal`, `AdminTransferModal`, `AllSpecsModal`) tanpa perubahan logika

---

### Requirement 17: Aksesibilitas Publik

**User Story:** Sebagai tamu yang memindai QR tanpa akun, saya ingin dapat melihat informasi dasar unit tanpa hambatan, sehingga saya dapat memverifikasi keaslian dan spesifikasi unit.

#### Acceptance Criteria

1. THE `Passport_Page` SHALL dapat diakses tanpa autentikasi (tidak memerlukan login)
2. THE `Passport_Page` SHALL tidak mengarahkan pengguna yang belum login ke halaman redirect, melainkan menampilkan konten sesuai level akses Tamu
3. THE `Passport_Page` SHALL menampilkan semua informasi spesifikasi unit yang tidak bersifat sensitif kepada Tamu
4. WHEN pengguna adalah Tamu, THE `Passport_Page` SHALL menampilkan ajakan soft login di Slide 2 tanpa memblokir akses ke Slide lainnya
5. IF token QR tidak valid atau unit tidak terdaftar, THEN THE `Passport_Page` SHALL menampilkan halaman error yang informatif dengan tombol kembali ke beranda

---

### Requirement 18: Responsivitas Mobile

**User Story:** Sebagai pengguna yang memindai QR dengan smartphone, saya ingin halaman passport nyaman digunakan di layar kecil, sehingga saya dapat mengakses semua informasi tanpa perlu zoom atau scroll horizontal.

#### Acceptance Criteria

1. THE `Passport_Page` SHALL menampilkan layout single-column pada layar dengan lebar ≤ 768px
2. WHEN ditampilkan di mobile, THE Carousel SHALL mengisi lebar penuh layar dengan padding minimal
3. WHEN ditampilkan di mobile, THE Topbar SHALL menggunakan ukuran yang kompak namun tetap terbaca
4. WHEN ditampilkan di mobile, THE `Passport_Page` SHALL tidak memiliki scroll horizontal
5. THE `CSS_Module` SHALL mendefinisikan responsive breakpoints di `@media (max-width: 768px)` dan `@media (max-width: 480px)` untuk semua komponen utama halaman
6. WHEN ditampilkan di mobile, THE tombol dan elemen interaktif SHALL memiliki area sentuh minimal 44x44 piksel

---

### Requirement 19: Isolasi dari Logika Bisnis

**User Story:** Sebagai developer, saya ingin refactor UI tidak menyentuh logika bisnis dan hooks, sehingga risiko regresi fungsionalitas diminimalkan.

#### Acceptance Criteria

1. THE refactor SHALL tidak mengubah file hooks: `usePassportData`, `useAdminActions`, `useSmartRouting`
2. THE refactor SHALL tidak mengubah file komponen lokal: `ServiceRequestModal`, `PartnerLogModal`, `AdminTransferModal`, `AllSpecsModal`, `AirflowDiagram`, `IotTelemetryWidget`, `StyledInput`
3. THE refactor SHALL tidak mengubah file `globals.css`
4. THE refactor SHALL tidak mengubah file backend atau API
5. WHEN refactor selesai, THE `Passport_Page` SHALL menampilkan data yang identik secara fungsional dengan versi sebelumnya — hanya tampilan visual yang berubah

---

### Requirement 20: Penghapusan Toggle Dark Mode

**User Story:** Sebagai developer dan pengguna, saya ingin halaman passport selalu tampil dengan tema terang, sehingga konsisten dengan design system portal dan tidak membingungkan pengguna.

#### Acceptance Criteria

1. THE `Passport_Page` SHALL tidak menampilkan tombol toggle dark/light mode
2. THE `CSS_Module` SHALL tidak memiliki styling `[data-theme="dark"]` untuk elemen halaman passport
3. THE `Passport_Page` SHALL menghapus state `isDark` dan semua logika yang berkaitan dengannya dari `page.tsx`
4. THE `Passport_Page` SHALL selalu merender dengan tampilan light (tidak ada `data-theme="dark"` pada root element)

