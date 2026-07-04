# Implementation Plan: Unit Detail UI Redesign

## Overview

Penulisan ulang total presentasi halaman `/id/[token]` — dari dark glassmorphism ke light neumorphism yang selaras dengan design system portal. Cakupan: rewrite `id.module.css`, komponen baru `PassportTopbar.tsx`, migrasi inline styles di `page.tsx`, dan penyesuaian sub-komponen. Tidak ada perubahan logika bisnis, hooks, atau backend.

## Tasks

- [x] 1. Persiapan: Audit token globals.css dan tambahkan token yang kurang
  - [x] 1.1 Baca `globals.css` dan identifikasi token yang sudah ada vs yang belum ada
    - Verifikasi keberadaan: `--color-light-tech-grey`, `--color-optic-white`, `--color-deep-navy`, `--color-space-grey`, `--color-cobalt-blue`, `--color-safety-orange`, `--font-heading`, `--font-body`, `--radius-lg`, `--radius-md`
    - _Requirements: 1.2, 7.4_

  - [x] 1.2 Tambahkan token neumorphism ke `globals.css` jika belum ada
    - Tambahkan `--shadow-card-neu`, `--border-card`, `--shadow-card-inset` ke section yang sesuai di `globals.css`
    - Pastikan token dark mode override sudah tercakup di blok `[data-theme="dark"]` di `globals.css`
    - _Requirements: 1.2, 7.3, 7.6_

- [x] 2. Buat komponen PassportTopbar
  - [x] 2.1 Buat file `PassportTopbar.tsx` dengan struktur komponen dan props interface
    - Buat file di `app/frontend/src/app/id/[token]/components/PassportTopbar.tsx`
    - Definisikan interface `PassportTopbarProps` sesuai design: `isDark`, `setIsDark`, `isGuest`, `isClient`, `isPartner`, `isAdmin`, `belongsToClient`, `hasClientRestriction`, `unit`, `token`
    - Implementasikan fungsi `getBadgeConfig(access)` yang memetakan kombinasi props ke teks badge ("LEVEL 1: PUBLIC SCAN" s.d. "LEVEL 4: ADMINISTRATOR")
    - Render subkomponen internal: `TopbarBadge`, `DarkLightToggle`, `QrPrintButton` (hanya bila `isAdmin`)
    - Tidak ada inline style untuk properti statis — semua via className
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11, 2.12, 9.1, 9.2, 9.3_

  - [ ]* 2.2 Tulis property test untuk fungsi getBadgeConfig (Property 1 & 2)
    - **Property 2: Teks Badge Sesuai Mapping Level Akses**
    - **Validates: Requirements 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.11**
    - Gunakan `fast-check` dengan `fc.record` untuk generate semua kombinasi boolean access props
    - Verifikasi bahwa output `getBadgeConfig` selalu salah satu dari 5 teks valid, minimum 100 iterasi
    - _Requirements: 2.4, 2.5, 2.6, 2.7, 2.8, 2.11_

  - [ ]* 2.3 Tulis property test untuk toggle dark/light (Property 3 & 4)
    - **Property 3: Toggle Dark/Light Membalik State**
    - **Property 4: data-theme Selalu Konsisten dengan isDark**
    - **Validates: Requirements 3.1, 3.2, 3.5**
    - Verifikasi bahwa toggle selalu menghasilkan kebalikan dari nilai awal `isDark`
    - Verifikasi bahwa `data-theme` selalu `"dark"` ketika `isDark === true` dan `"light"` ketika `false`
    - Minimum 100 iterasi
    - _Requirements: 3.1, 3.2, 3.5_

  - [ ]* 2.4 Tulis unit tests untuk PassportTopbar
    - Test badge LEVEL 1 ketika `isGuest=true`
    - Test badge LEVEL 4 ketika `isAdmin=true`
    - Test tombol QR hanya muncul ketika `isAdmin=true`
    - Test toggle memanggil `setIsDark` saat diklik
    - _Requirements: 2.4, 2.8, 2.9, 2.10, 3.1, 3.2_

- [x] 3. Buat PassportTopbar.module.css
  - [x] 3.1 Tulis CSS module untuk PassportTopbar
    - Buat file `app/frontend/src/app/id/[token]/components/PassportTopbar.module.css`
    - Implementasikan: `.topbar` (height 64px, white bg, border-bottom), `.topbarLogo` (max-height 40px), `.topbarRight` (flex, gap, align-center)
    - Implementasikan `.topbarBadge` (pill, warna teks brand), `.darkLightToggle` (icon button), `.qrPrintButton`
    - Semua warna menggunakan CSS variables; tidak ada hex hardcoded untuk token yang sudah ada
    - `@media (max-width: 768px)` — sembunyikan elemen non-esensial, pertahankan logo dan badge
    - _Requirements: 2.1, 2.9, 2.12, 9.3, 10.1_

- [x] 4. Checkpoint — Verifikasi PassportTopbar berdiri sendiri
  - Pastikan semua tests untuk PassportTopbar pass. Tanyakan kepada user jika ada pertanyaan.

- [x] 5. Tulis ulang id.module.css dari nol
  - [x] 5.1 Buat struktur awal id.module.css dengan seksi Reset/Base dan Header Unit
    - Hapus isi `id.module.css` lama dan tulis ulang dari baris pertama
    - Seksi 1 — Reset/Base: `.pageWrapper` (background `var(--color-light-tech-grey)`, animasi `pageFadeIn`), `.dotGrid` (dekoratif, `display: none` di mobile)
    - Seksi 3 — Header Unit: `.header`, `.serialNumber` (font `var(--font-heading)`, warna `var(--color-deep-navy)`), `.modelName`, `.verifiedBadgeTop`, `.lastUpdated`
    - Light mode adalah default — tidak ada selector `[data-theme="light"]`
    - _Requirements: 1.1, 1.4, 1.5, 5.7, 7.1, 7.2, 7.4, 7.5_

  - [x] 5.2 Tulis seksi Carousel di id.module.css
    - Seksi 4 — Carousel: `.carouselWrapper`, `.carouselContainer` (`overflow-x: auto; scrollbar-width: none`), `.carouselSlide` (full-width), `.carouselNavBtn` (neumorphism, background `var(--color-light-tech-grey)`), `.dotIndicators` + `.dot` + `.dotActive`
    - Smooth scroll behavior via `scroll-behavior: smooth`
    - `@media (max-width: 768px)` carousel tetap swipeable
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 10.2_

  - [x] 5.3 Tulis seksi Card dan Section-section di id.module.css
    - Seksi 5 — Card: `.card` (background `var(--color-optic-white)`, border `var(--border-card)`, shadow `var(--shadow-card-neu)`, border-radius `var(--radius-lg)`), `.cardHeader` (border-bottom token), `.cardContent`, `.cardHeaderLeft`
    - Seksi 6 — Sections: `.specItem`, `.statusCard`, `.statsCardGrid` (grid 5 kolom → 2 kolom di mobile), `.mediaSingleItem`, `.actionCard`, `.btnPrimary`, `.btnEmergency`
    - _Requirements: 1.2, 1.3, 5.1, 5.2, 5.3, 6.1, 6.2, 6.4, 10.3, 10.4_

  - [x] 5.4 Tulis seksi Modals, Loading/Error, Toast, dan Responsive di id.module.css
    - Seksi 7 — Modals: `.modalOverlay`, `.modalCard`, `.modalHeader`, `.modalForm`, `.formGroup`
    - State Loading: `.loadingContainer` (spinner terpusat, `var(--color-cobalt-blue)`)
    - State Error: `.errorContainer`, `.errorCard` (neumorphism putih, icon + pesan + tombol)
    - Toast: `.toastContainer` (pojok kanan atas), `.toastSuccess`/`.toastError`/`.toastInfo`
    - Seksi 8 — Responsive: `@media (max-width: 768px)` lalu `@media (max-width: 480px)` (serial number min `1.5rem`)
    - Verifikasi total baris ≤ 500
    - _Requirements: 1.6, 7.5, 10.5, 10.6, 11.1, 11.2, 11.3, 11.4_

  - [ ]* 5.5 Tulis smoke test untuk struktur id.module.css
    - Verifikasi file ≤ 500 baris
    - Verifikasi tidak ada selector `[data-theme="light"]` dan `[data-theme="dark"]`
    - Verifikasi tidak ada hex color hardcoded yang seharusnya sudah ada sebagai CSS variable
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 6. Penyesuaian sub-komponen
  - [x] 6.1 Update `ServiceHistorySection.tsx` — ganti warna dark hardcoded ke CSS variables
    - Hapus warna dark hardcoded; gunakan `var(--color-deep-navy)` dan `var(--color-space-grey)`
    - _Requirements: 9.4_

  - [x] 6.2 Update `IotTelemetryWidget.tsx` — penyesuaian border dan background ke CSS variables light-first
    - Ganti border dan background dark ke CSS variables; pastikan kompatibel dengan light mode default
    - _Requirements: 9.4_

  - [x] 6.3 Update `StyledInput.tsx` — ganti dark background ke `var(--color-light-tech-grey)`
    - Hapus `rgba(255,255,255,0.05)` dan ganti ke `var(--color-light-tech-grey)`
    - _Requirements: 9.4_

- [x] 7. Migrasi inline styles di page.tsx
  - [x] 7.1 Import PassportTopbar dan ganti JSX topbar lama di page.tsx
    - Tambahkan import `PassportTopbar` dari `./components/PassportTopbar`
    - Hapus blok JSX `<header>` topbar lama
    - Render `<PassportTopbar>` dengan props yang sesuai (ambil dari state dan hooks yang sudah ada)
    - _Requirements: 8.3, 8.4, 8.5, 9.1_

  - [x] 7.2 Migrasi inline styles statis dari page.tsx ke className di id.module.css
    - Identifikasi semua inline styles yang berisi properti statis: `display`, `gap`, `padding`, `margin`, `fontSize`, `fontWeight`, `flexDirection`, `alignItems`, `justifyContent`, `width`, `height`
    - Pindahkan ke className yang sesuai di `id.module.css`
    - Pertahankan inline style hanya untuk nilai runtime: `UNIT_TYPE_COLORS[autoUnitType].bg`, `s.color`, `opacity: qcUploading[...] ? 0.6 : 1`
    - Pastikan tidak ada komponen baru — `page.tsx` tetap satu file
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ]* 7.3 Tulis property test untuk Card class consistency (Property 5)
    - **Property 5: Semua Level Akses Menggunakan Card Class yang Sama**
    - **Validates: Requirements 6.1, 6.2**
    - Render halaman dengan berbagai kombinasi level akses dan verifikasi class CSS elemen Card selalu identik
    - Minimum 100 iterasi
    - _Requirements: 6.1, 6.2_

  - [ ]* 7.4 Tulis property test untuk class tombol aksi (Property 6)
    - **Property 6: Tombol Aksi Selalu Menggunakan Class Standar**
    - **Validates: Requirements 6.4**
    - Verifikasi semua tombol di Slide "Layanan & Dukungan" selalu menggunakan `btnPrimary` atau `btnEmergency`, tidak pernah class lain untuk warna
    - Minimum 100 iterasi
    - _Requirements: 6.4_

  - [ ]* 7.5 Tulis property test untuk warna toast (Property 7)
    - **Property 7: Toast Warna Sesuai Tipe**
    - **Validates: Requirements 11.4**
    - Verifikasi bahwa setiap tipe toast (`success`, `error`, `info`) selalu mendapat class warna yang tepat
    - Minimum 100 iterasi
    - _Requirements: 11.4_

  - [ ]* 7.6 Tulis snapshot tests untuk page.tsx
    - Snapshot light mode default (isGuest), dark mode, loading state, error state
    - _Requirements: 1.1, 3.3, 3.4, 11.1, 11.2_

- [x] 8. Checkpoint Akhir — Verifikasi menyeluruh
  - Pastikan semua tests pass. Verifikasi `id.module.css` ≤ 500 baris, tidak ada selector `[data-theme]`, tidak ada hex hardcoded. Tanyakan kepada user jika ada pertanyaan sebelum dinyatakan selesai.

## Notes

- Task bertanda `*` bersifat opsional dan dapat dilewati untuk implementasi lebih cepat (MVP)
- Setiap task mereferensikan requirement spesifik untuk keterlacakan
- Property tests menggunakan library `fast-check` dengan minimum 100 iterasi
- Tidak ada perubahan pada hooks, backend, API, atau logika bisnis — ini adalah refactor presentasi murni
- Urutan task penting: token globals.css harus diselesaikan sebelum CSS module ditulis

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["2.1", "5.1"] },
    { "id": 3, "tasks": ["2.2", "2.3", "2.4", "3.1", "5.2"] },
    { "id": 4, "tasks": ["5.3"] },
    { "id": 5, "tasks": ["5.4", "6.1", "6.2", "6.3"] },
    { "id": 6, "tasks": ["5.5", "7.1"] },
    { "id": 7, "tasks": ["7.2"] },
    { "id": 8, "tasks": ["7.3", "7.4", "7.5", "7.6"] }
  ]
}
```
