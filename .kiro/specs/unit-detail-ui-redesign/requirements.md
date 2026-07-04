# Requirements Document

## Introduction

Halaman detail unit di `/id/[token]` (`page.tsx` + `id.module.css`) saat ini menggunakan design system dark glassmorphism (background `#010412`, card gelap transparan, border biru elektrik) yang tidak selaras dengan halaman portal lainnya yang menggunakan light neumorphism (background `#F2F4F7`, card putih, shadow soft). Situasi ini diperparah oleh CSS sebesar 2.259 baris yang memiliki tiga lapisan konflik: dark base + `[data-theme="light"]` overrides + `globals.css` overrides, sehingga setiap upaya revamp selalu gagal.

Spec ini mendefinisikan requirements untuk **penulisan ulang total CSS** halaman tersebut menjadi light-first, berbasis CSS variables dari `globals.css`, dengan target ~400–500 baris — selaras penuh dengan design system portal lainnya. Seluruh logika bisnis (hooks, backend) tidak diubah.

---

## Glossary

- **Halaman_Passport**: Halaman unit detail yang diakses via `/id/[token]`; berjalan standalone fullscreen tanpa sidebar portal
- **Topbar**: Bar navigasi atas horizontal berukuran 64px, putih, dengan logo Holicindo di kiri dan badge level akses di kanan
- **Carousel**: Mekanisme navigasi slide kiri-kanan yang menampilkan section-section konten satu per satu
- **Slide**: Satu unit konten di dalam Carousel; masing-masing berisi satu section (Spesifikasi, Layanan, Stats, dsb.)
- **Card**: Kontainer konten neumorphism — background `#FFFFFF`, border `1px solid rgba(0,31,63,0.06)`, shadow `-6px -6px 14px rgba(255,255,255,0.85), 6px 6px 14px rgba(0,31,63,0.1)`, border-radius 16px
- **Topbar_Badge**: Badge pill di sisi kanan Topbar yang menampilkan level akses pengguna
- **Toggle_Dark_Light**: Tombol di Topbar yang memungkinkan pengguna berpindah antara light mode (default) dan dark mode
- **Level_Akses**: Tingkat izin akses pengguna: tamu (Level 1), client (Level 2), partner (Level 3), administrator (Level 4)
- **CSS_Variables**: Token warna dan spacing yang didefinisikan di `globals.css`; tidak boleh diubah nilainya, hanya digunakan sebagai referensi
- **Light_Mode**: Mode tampilan default; menggunakan background `#F2F4F7`, card putih, teks Deep Navy
- **Dark_Mode**: Mode tampilan opsional yang diaktifkan pengguna; menggunakan dark tokens dari `globals.css`
- **Inline_Style**: Atribut `style={{...}}` di JSX yang perlu dipindahkan ke `className` dan CSS Module

---

## Requirements

### Requirement 1: Keselarasan Design System — Light Mode Default

**User Story:** Sebagai pengguna yang membuka halaman passport unit, saya ingin melihat tampilan yang konsisten dengan portal Holicindo lainnya, agar pengalaman visual terasa menyatu dan profesional.

#### Acceptance Criteria

1. IF light mode aktif, THE Halaman_Passport SHALL menggunakan background warna `var(--color-light-tech-grey)` sebagai warna dasar halaman
2. THE Card SHALL menampilkan latar belakang putih, border tipis, shadow neumorphism soft, dan sudut membulat `var(--radius-lg)` — jika token yang setara untuk border atau shadow belum tersedia di `globals.css`, maka token baru SHALL didefinisikan di sana terlebih dahulu sebelum digunakan
3. THE Card header SHALL memiliki pemisah bawah berupa border tipis horizontal menggunakan token border yang tersedia di `globals.css`
4. THE Halaman_Passport SHALL menggunakan `var(--font-heading)` (Montserrat) pada elemen h1, h2, h3, h4, h5, h6 dan `var(--font-body)` (Inter) untuk teks body
5. IF light mode aktif, THE teks pada elemen h1–h6 di Halaman_Passport SHALL menggunakan warna `var(--color-deep-navy)`
6. IF light mode aktif, THE teks body di Halaman_Passport SHALL menggunakan warna `var(--color-space-grey)`
7. THE CSS_Module SHALL tidak memuat nilai hex atau rgba yang hard-coded jika token yang setara sudah tersedia di `globals.css`

### Requirement 2: Topbar Minimal

**User Story:** Sebagai pengguna yang membuka halaman passport unit, saya ingin melihat topbar yang menampilkan identitas brand dan level akses saya, agar saya tahu saya berada di ekosistem Holicindo dan memahami izin saya.

#### Acceptance Criteria

1. THE Topbar SHALL terlihat sebagai bar horizontal putih dengan tinggi 64px dan garis pemisah bawah yang tipis
2. THE Topbar SHALL menampilkan logo Holicindo (teks atau ikon brand) dengan tinggi maksimal 40px di sisi kiri
3. THE Topbar SHALL menampilkan Topbar_Badge level akses di sisi kanan paling ujung
4. WHEN pengguna adalah tamu, THE Topbar_Badge SHALL menampilkan teks "LEVEL 1: PUBLIC SCAN"
5. WHEN pengguna adalah client yang memiliki unit tersebut, THE Topbar_Badge SHALL menampilkan teks "LEVEL 2: FLEET OWNER"
6. WHEN pengguna adalah client yang tidak memiliki unit tersebut, THE Topbar_Badge SHALL menampilkan teks "LEVEL 2: RESTRICTED"
7. WHEN pengguna adalah partner, THE Topbar_Badge SHALL menampilkan teks "LEVEL 3: TECHNICAL PARTNER"
8. WHEN pengguna adalah administrator, THE Topbar_Badge SHALL menampilkan teks "LEVEL 4: ADMINISTRATOR"
9. THE Topbar SHALL menampilkan Toggle_Dark_Light di sebelah kiri Topbar_Badge
10. WHEN administrator mengakses halaman, THE Topbar SHALL menampilkan tombol cetak QR Code di sebelah kiri Toggle_Dark_Light; WHEN tombol diklik, SHALL membuka print preview QR Code unit tersebut
11. IF level akses pengguna tidak dapat ditentukan saat render, THEN THE Topbar_Badge SHALL menampilkan teks "LEVEL 1: PUBLIC SCAN" sebagai fallback
12. THE Topbar SHALL tetap terlihat di posisi paling atas viewport saat pengguna melakukan scroll ke bawah halaman

### Requirement 3: Toggle Dark/Light Mode

**User Story:** Sebagai pengguna halaman passport, saya ingin bisa berpindah antara tampilan light dan dark mode, agar saya dapat menyesuaikan preferensi visual saya.

#### Acceptance Criteria

1. THE Toggle_Dark_Light SHALL menampilkan ikon matahari (Sun) saat dark mode aktif dan ikon bulan (Moon) saat light mode aktif
2. WHEN Toggle_Dark_Light diklik, THE Halaman_Passport SHALL berpindah state antara light mode dan dark mode
3. WHILE light mode aktif (default), THE Halaman_Passport SHALL menampilkan visual identik dengan design system portal (background `#F2F4F7`, card putih, teks Deep Navy)
4. WHILE dark mode aktif, THE Halaman_Passport SHALL menerapkan dark tokens dari `globals.css` `[data-theme="dark"]` secara konsisten
5. THE Toggle_Dark_Light SHALL menerapkan `data-theme` attribute pada elemen root wrapper (`pageWrapper`) berisi nilai `"light"` atau `"dark"`
6. IF dark mode diaktifkan oleh pengguna, THEN THE Halaman_Passport SHALL mempertahankan dark mode tersebut selama session berlangsung

### Requirement 4: Carousel Navigasi Section

**User Story:** Sebagai pengguna halaman passport, saya ingin menavigasi antar section menggunakan slide carousel kiri-kanan, agar saya bisa fokus pada satu section di satu waktu tanpa scroll panjang.

#### Acceptance Criteria

1. THE Carousel SHALL menampilkan satu Slide penuh per tampilan (full-width visible slide)
2. THE Carousel SHALL menyediakan tombol navigasi panah kiri (`‹`) dan kanan (`›`) di sisi Carousel untuk berpindah antar Slide
3. WHEN tombol navigasi kanan diklik, THE Carousel SHALL melakukan scroll ke Slide berikutnya dengan perilaku `scroll-behavior: smooth`
4. WHEN tombol navigasi kiri diklik, THE Carousel SHALL melakukan scroll ke Slide sebelumnya dengan perilaku `scroll-behavior: smooth`
5. THE Carousel SHALL menyembunyikan scrollbar horizontal secara visual (`overflow-x: auto; scrollbar-width: none`)
6. THE Carousel SHALL menampilkan indikator dot di bawah Carousel yang menunjukkan posisi Slide aktif
7. WHEN light mode aktif, THE tombol navigasi Carousel SHALL menggunakan styling neumorphism yang selaras dengan Card (background `#F2F4F7`, shadow soft)

### Requirement 5: Retensi Seluruh Section Konten

**User Story:** Sebagai pengguna halaman passport, saya ingin semua section informasi unit tetap tersedia, agar saya tidak kehilangan akses ke data yang sebelumnya ada.

#### Acceptance Criteria

1. THE Carousel SHALL memuat Slide "Spesifikasi Utama" yang menampilkan foto unit, spesifikasi teknis, dan tombol "Lihat Semua Spesifikasi"
2. THE Carousel SHALL memuat Slide "Layanan & Dukungan" yang menampilkan aksi sesuai Level_Akses pengguna
3. THE Carousel SHALL memuat Slide "Stats Card" yang menampilkan 5 status card (Status Unit, Garansi, Last Service, Next Service, Verifikasi)
4. THE Carousel SHALL memuat Slide "QC Reports" yang menampilkan dokumen laporan dan hasil upload
5. THE Carousel SHALL memuat Slide "Service History" yang menampilkan riwayat servis unit
6. WHERE komponen IoT telemetry tersedia, THE Carousel SHALL memuat Slide "IoT Telemetry" yang menampilkan data sensor real-time
7. THE Halaman_Passport SHALL menampilkan informasi serial number dan model unit di bawah Topbar sebagai page header

### Requirement 6: Tampilan Seragam untuk Semua Level Akses

**User Story:** Sebagai administrator Holicindo, saya ingin semua pengguna melihat tampilan visual yang sama terlepas dari level akses mereka, agar branding konsisten dan tidak ada kebingungan visual antar role.

#### Acceptance Criteria

1. THE Halaman_Passport SHALL menerapkan tema warna, layout, dan card style yang identik untuk semua Level_Akses (tamu, client, partner, administrator)
2. THE Halaman_Passport SHALL TIDAK menerapkan tema warna atau background yang berbeda berdasarkan Level_Akses
3. WHEN pengguna memiliki Level_Akses berbeda, THE konten di dalam Slide "Layanan & Dukungan" SHALL berbeda sesuai izin akses — tamu melihat tombol laporkan masalah dan ajakan login, client melihat tombol request service, partner melihat aksi teknis, administrator melihat kontrol penuh — namun semua ditampilkan dalam Card dengan visual style yang sama
4. WHEN pengguna memiliki Level_Akses berbeda, THE tombol dan aksi yang ditampilkan di dalam Card SHALL menggunakan komponen tombol yang sama (btnPrimary, btnEmergency) dengan warna brand yang konsisten, bukan warna khusus per role

### Requirement 7: Penulisan Ulang CSS dari Nol

**User Story:** Sebagai developer yang melakukan maintenance, saya ingin CSS halaman passport ditulis ulang dengan bersih dan terstruktur, agar perubahan di masa depan dapat dilakukan tanpa konflik layer.

#### Acceptance Criteria

1. THE CSS_Module (`id.module.css`) SHALL ditulis ulang total — file lama dihapus dan diganti — dengan light mode sebagai default tanpa memerlukan selector `[data-theme="light"]` untuk mengaktifkan tampilan light
2. THE CSS_Module SHALL memiliki panjang tidak lebih dari 500 baris termasuk komentar dan baris kosong
3. THE CSS_Module SHALL tidak memuat blok `[data-theme="dark"]` yang mendefinisikan warna dark mode — semua override dark mode SHALL dikelola melalui CSS variables di `globals.css`
4. THE CSS_Module SHALL menggunakan token `var(--color-*)`, `var(--font-*)`, dan `var(--radius-*)` dari `globals.css` — nilai hex atau rgba boleh muncul hanya jika token yang setara tidak tersedia di `globals.css`
5. THE CSS_Module SHALL terstruktur dengan urutan seksi berurutan: reset/base → topbar → header unit → carousel → card → section-section → modals → responsive mobile, dengan komentar seksi yang jelas
6. IF dark mode diaktifkan pengguna, THEN tampilan Halaman_Passport SHALL berubah secara otomatis melalui CSS variables yang ter-override di `globals.css` tanpa memerlukan selector tambahan di `id.module.css`

### Requirement 8: Migrasi Inline Styles ke CSS Module

**User Story:** Sebagai developer yang membaca `page.tsx`, saya ingin inline styles dipindahkan ke className, agar kode TSX lebih mudah dibaca dan di-maintain.

#### Acceptance Criteria

1. THE `page.tsx` SHALL memindahkan Inline_Style yang berisi properti CSS statis — termasuk namun tidak terbatas pada `display`, `gap`, `padding`, `margin`, `fontSize`, `fontWeight`, `color`, `background`, `borderRadius`, `flexDirection`, `alignItems`, `justifyContent`, `width`, `height` — ke className pada CSS_Module, selama nilai properti tersebut tidak dihitung dari data runtime maupun state komponen
2. THE `page.tsx` SHALL mempertahankan Inline_Style hanya untuk: (a) nilai yang berasal dari data unit runtime (contoh: `background: UNIT_TYPE_COLORS[autoUnitType].bg`, `color: s.color`), atau (b) nilai yang merupakan toggle kondisional berdasarkan state komponen yang berubah saat runtime (contoh: `opacity: qcUploading['test_run_url'] ? 0.6 : 1`)
3. THE `page.tsx` SHALL tetap berupa satu file — tidak dipecah menjadi sub-komponen baru
4. THE `page.tsx` SHALL mempertahankan semua logika bisnis yang ada: hook calls, conditional rendering logic, event handler callbacks, dan nilai DOM yang dirender tetap identik sebelum dan sesudah migrasi
5. THE `page.tsx` SHALL TIDAK mengubah hook calls, event handler, atau conditional rendering yang sudah ada

### Requirement 9: Topbar Komponen Baru

**User Story:** Sebagai developer yang mengimplementasikan Topbar, saya ingin Topbar diimplementasikan sebagai komponen tersendiri di dalam direktori `components/`, agar `page.tsx` tetap bersih dan Topbar dapat diuji secara terpisah.

#### Acceptance Criteria

1. THE Topbar SHALL diimplementasikan sebagai komponen React baru di `app/frontend/src/app/id/[token]/components/PassportTopbar.tsx`
2. THE Topbar SHALL menerima props: `isDark`, `setIsDark`, `isGuest`, `isClient`, `isPartner`, `isAdmin`, `belongsToClient`, `hasClientRestriction`, `isAdmin`, dan `unit` (untuk serial number dan tombol QR)
3. THE Topbar SHALL menggunakan CSS Module tersendiri atau className dari `id.module.css` — tidak ada Inline_Style untuk layout dan warna statis
4. IF terdapat sub-komponen di `components/` yang masih menggunakan dark glassmorphism styling, THEN THE sub-komponen tersebut SHALL disesuaikan menggunakan CSS variables yang selaras dengan light mode

### Requirement 10: Kompatibilitas Mobile Responsif

**User Story:** Sebagai pengguna yang membuka halaman passport dari smartphone, saya ingin tampilan yang optimal di layar kecil, agar saya bisa membaca informasi unit dengan nyaman.

#### Acceptance Criteria

1. WHEN lebar viewport kurang dari atau sama dengan 768px, THE Topbar SHALL menyembunyikan elemen non-esensial dan mempertahankan logo serta badge level akses
2. WHEN lebar viewport kurang dari atau sama dengan 768px, THE Carousel SHALL tetap dapat di-swipe secara horizontal dengan touch gesture
3. WHEN lebar viewport kurang dari atau sama dengan 768px, THE Card SHALL memiliki padding yang dikurangi (`14px`) dibanding desktop (`20px`) untuk memaksimalkan area konten
4. WHEN lebar viewport kurang dari atau sama dengan 768px, THE Stats Card SHALL ditampilkan dalam grid 2 kolom
5. WHEN lebar viewport kurang dari atau sama dengan 480px, THE serial number heading SHALL menggunakan ukuran font minimal `1.5rem` agar tetap terbaca
6. THE Halaman_Passport SHALL menggunakan media query breakpoint `768px` dan `480px` yang konsisten dengan breakpoint portal lainnya

### Requirement 11: State Loading dan Error

**User Story:** Sebagai pengguna yang membuka halaman passport, saya ingin melihat feedback visual yang jelas saat data sedang dimuat atau terjadi kesalahan, agar saya tahu status halaman dan langkah selanjutnya.

#### Acceptance Criteria

1. WHEN data unit sedang dimuat, THE Halaman_Passport SHALL menampilkan spinner loading yang terpusat di tengah viewport dengan teks "Memindai QR Passport..."
2. IF data unit tidak ditemukan atau token tidak valid, THEN THE Halaman_Passport SHALL menampilkan error card putih neumorphism dengan ikon peringatan, pesan deskriptif, dan tombol "Kembali ke Beranda"
3. THE spinner loading SHALL menggunakan warna `var(--color-cobalt-blue)` untuk konsistensi brand
4. WHEN toast notification muncul, THE Halaman_Passport SHALL menampilkan toast di pojok kanan atas dengan warna sesuai tipe (success: hijau, error: merah, info: biru Cobalt) dan tombol dismiss
