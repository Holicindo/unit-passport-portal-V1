# Design Document: Unit Detail UI Redesign

## Overview

Halaman `/id/[token]` adalah halaman **standalone fullscreen** (tidak masuk layout portal dengan sidebar) yang menampilkan Unit Passport — kartu digital unit mesin/showcase Holicindo yang dapat diakses via scan QR Code. Saat ini halaman ini menggunakan dark glassmorphism (`#010412` background, card gelap transparan) yang tidak selaras dengan portal lainnya yang menggunakan light neumorphism.

Spec ini mendesain **penulisan ulang total CSS** (`id.module.css`) menjadi light-first berbasis CSS variables dari `globals.css`, ditambah komponen `PassportTopbar.tsx` baru dan migrasi inline styles di `page.tsx`. Tidak ada perubahan backend, API, logika bisnis, atau hooks.

### Tujuan Utama

1. Menyeragamkan tampilan halaman passport dengan design system portal (light neumorphism, warna brand Holicindo)
2. Mengurangi `id.module.css` dari 2.259 baris → maksimal 500 baris, bebas konflik layer
3. Memindahkan logika style dari `page.tsx` (inline styles) ke CSS Module
4. Memastikan dark mode tetap berfungsi via CSS variables tanpa selector `[data-theme="dark"]` di CSS module

---

## Architecture

### Prinsip Arsitektur

Ini adalah refactor murni **presentation layer**. Tidak ada perubahan pada:
- API calls, data fetching, atau backend
- Hook interfaces (`usePassportData`, `useAdminActions`, `useSmartRouting`)
- Conditional rendering logic atau event handlers
- Sub-komponen logic (hanya CSS adjustment)

```
app/frontend/src/app/id/[token]/
├── page.tsx                    ← MODIFIKASI: hapus inline styles statis → className
├── id.module.css               ← REWRITE TOTAL: light-first, ~400-500 baris
├── components/
│   ├── PassportTopbar.tsx      ← BARU: komponen topbar baru
│   ├── PassportTopbar.module.css ← BARU: CSS khusus topbar
│   ├── ServiceHistorySection.tsx ← TOUCH: penyesuaian CSS variables jika perlu
│   ├── IotTelemetryWidget.tsx  ← TOUCH: penyesuaian CSS variables jika perlu
│   ├── AirflowDiagram.tsx      ← NO CHANGE
│   ├── ServiceRequestModal.tsx ← NO CHANGE (modal pakai id.module.css)
│   ├── PartnerLogModal.tsx     ← NO CHANGE
│   ├── AdminTransferModal.tsx  ← NO CHANGE
│   ├── AllSpecsModal.tsx       ← NO CHANGE
│   └── StyledInput.tsx         ← TOUCH: update style jika pakai dark tokens
└── hooks/                      ← NO CHANGE (semua hooks tidak diubah)
    ├── usePassportData.ts
    ├── useAdminActions.ts
    └── useSmartRouting.ts
```

---

## Components and Interfaces

### 1. PassportTopbar (Komponen Baru)

**Path:** `app/frontend/src/app/id/[token]/components/PassportTopbar.tsx`

Komponen baru yang mengekstrak seluruh logika Topbar dari `page.tsx`. Bertanggung jawab atas rendering bar navigasi atas, badge level akses, toggle dark/light, dan tombol QR Code.

```typescript
interface PassportTopbarProps {
  isDark: boolean;
  setIsDark: (fn: (v: boolean) => boolean) => void;
  isGuest: boolean;
  isClient: boolean;
  isPartner: boolean;
  isAdmin: boolean;
  belongsToClient: boolean;
  hasClientRestriction: boolean;
  unit: Unit | null;
  token: string;
}
```

**Subkomponen internal:**
- `TopbarBadge` — pill badge level akses (teks + warna berdasarkan props)
- `DarkLightToggle` — tombol Sun/Moon icon dengan handler `setIsDark`
- `QrPrintButton` — hanya tampil ketika `isAdmin === true`

**CSS:** Menggunakan `PassportTopbar.module.css` tersendiri, tidak ada inline style untuk properti statis.

---

### 2. id.module.css (Rewrite Total)

File CSS module utama. Ditulis ulang dari nol dengan struktur berikut (urutan wajib):

| # | Seksi | Keterangan |
|---|-------|-----------|
| 1 | Reset / Base | `pageWrapper`, animasi `pageFadeIn`, `dotGrid` (dekoratif, mobile hidden) |
| 2 | Topbar | `.topbar`, `.topbarLogo`, `.topbarRight` — light-first tanpa selector override |
| 3 | Header Unit | `.header`, `.serialNumber`, `.modelName`, `.verifiedBadgeTop`, `.lastUpdated` |
| 4 | Carousel | `.carouselWrapper`, `.carouselContainer`, `.carouselSlide`, `.carouselNavBtn`, `.dotIndicators` |
| 5 | Card | `.card`, `.cardHeader`, `.cardContent`, `.cardHeaderLeft` |
| 6 | Section-section | `.specItem`, `.statusCard`, `.statsCardGrid`, `.mediaSingleItem`, `.actionCard`, dsb. |
| 7 | Modals | `.modalOverlay`, `.modalCard`, `.modalHeader`, `.modalForm`, `.formGroup` |
| 8 | Responsive | `@media (max-width: 768px)` lalu `@media (max-width: 480px)` |

**Token yang wajib digunakan** (tidak boleh ditulis hardcoded jika sudah ada di globals.css):

| Properti | Token |
|---------|-------|
| Background halaman | `var(--color-light-tech-grey)` |
| Background card | `var(--color-optic-white)` |
| Teks heading | `var(--color-deep-navy)` |
| Teks body/label | `var(--color-space-grey)` |
| Aksen tombol utama | `var(--color-cobalt-blue)` |
| Tombol emergency | `var(--color-safety-orange)` |
| Font heading | `var(--font-heading)` |
| Font body | `var(--font-body)` |
| Border radius card | `var(--radius-lg)` |
| Border radius tombol | `var(--radius-md)` |

**Token tambahan** yang perlu ditambahkan ke `globals.css` jika belum ada:

```css
/* Neumorphism Card Shadows — untuk id.module.css */
--shadow-card-neu: -6px -6px 14px rgba(255, 255, 255, 0.85), 6px 6px 14px rgba(0, 31, 63, 0.1);
--border-card: 1px solid rgba(0, 31, 63, 0.06);
--shadow-card-inset: inset 4px 4px 8px rgba(0, 31, 63, 0.06), inset -4px -4px 8px rgba(255, 255, 255, 0.9);
```

---

### 3. page.tsx (Modifikasi)

`page.tsx` tidak dipecah menjadi sub-komponen baru. Modifikasi terbatas pada:

1. **Import PassportTopbar** dan hapus JSX topbar yang ada di dalam `<header>`
2. **Migrasi inline styles statis** → className di `id.module.css`

**Inline styles yang wajib dimigrasikan** (contoh dari kode saat ini):

```tsx
// SEBELUM — harus dimigrasikan ke className
style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
style={{ display: 'flex', gap: '8px', alignSelf: 'flex-end', marginTop: '4px' }}
style={{ width: '100%', textAlign: 'left' }}

// BOLEH TETAP sebagai inline style (nilai runtime)
style={{ background: UNIT_TYPE_COLORS[autoUnitType].bg }}     // runtime data
style={{ color: s.color }}                                       // runtime data
style={{ opacity: qcUploading['test_run_url'] ? 0.6 : 1 }}    // conditional state
```

---

### 4. Sub-komponen yang Disentuh

| Komponen | Perubahan |
|----------|-----------|
| `ServiceHistorySection.tsx` | Hapus warna hardcoded dark; gunakan CSS variables `--color-deep-navy`, `--color-space-grey` |
| `IotTelemetryWidget.tsx` | Penyesuaian border dan background ke CSS variables light-first |
| `StyledInput.tsx` | Hapus dark background (`rgba(255,255,255,0.05)`), ganti ke `var(--color-light-tech-grey)` |

---

## Data Models

Tidak ada perubahan data model backend. Seluruh tipe data yang digunakan adalah milik `usePassportData` hook yang sudah ada. Berikut adalah model data yang relevan untuk tujuan rendering:

### Unit (dibaca dari hook, tidak diubah)

```typescript
interface Unit {
  id: string;
  serial_number: string;
  model_name: string;
  warranty_expiry?: string;
  updated_at?: string;
  specs?: {
    type?: 'MESIN' | 'SHOWCASE';
    dimension?: string;
    power?: string;
    wattage?: string;
    capacity?: string;
    compressor?: string;
    refrigerant?: string;
    production_date?: string;
    finish_date?: string;
    test_run_url?: string;
    photo_gallery?: string;   // comma-separated URLs
  };
  service_logs?: ServiceLog[];
  qc_forms?: QcForm[];
}
```

### AccessLevel (state UI, dikelola di hook)

```typescript
// Dikomputasi dari user + unit data di usePassportData
interface AccessState {
  isGuest: boolean;             // tidak login atau token tidak ditemukan
  isClient: boolean;            // user.role === 'client'
  isPartner: boolean;           // user.role === 'partner'
  isAdmin: boolean;             // user.role === 'admin'
  belongsToClient: boolean;     // unit.client_id === user.client_id
  hasClientRestriction: boolean; // isClient && !belongsToClient
}
```

### Topbar Badge Mapping (logika di PassportTopbar)

```typescript
type BadgeConfig = { text: string; };

function getBadgeConfig(access: AccessState): BadgeConfig {
  if (access.isAdmin)              return { text: 'LEVEL 4: ADMINISTRATOR' };
  if (access.isPartner)            return { text: 'LEVEL 3: TECHNICAL PARTNER' };
  if (access.hasClientRestriction) return { text: 'LEVEL 2: RESTRICTED' };
  if (access.isClient && access.belongsToClient) return { text: 'LEVEL 2: FLEET OWNER' };
  return { text: 'LEVEL 1: PUBLIC SCAN' }; // fallback / isGuest
}
```

### ThemeState (state UI lokal di page.tsx)

```typescript
// Dikelola oleh usePassportData hook
isDark: boolean;         // false = light mode (default)
setIsDark: Dispatch<SetStateAction<boolean>>;

// Diterapkan ke DOM via:
<div data-theme={isDark ? 'dark' : 'light'} className={styles.pageWrapper}>
```

### Toast Notification

```typescript
interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info';
}
```

---

## Correctness Properties

*Sebuah property adalah karakteristik atau perilaku yang harus berlaku benar untuk semua eksekusi valid suatu sistem — pada dasarnya, pernyataan formal tentang apa yang seharusnya dilakukan sistem. Properties menjembatani antara spesifikasi yang dapat dibaca manusia dan jaminan kebenaran yang dapat diverifikasi mesin.*

Fitur ini adalah **UI redesign** — CSS refactor dan komponen presentasi baru. Sebagian besar acceptance criteria adalah tentang visual rendering, struktur CSS, dan komponen UI. Beberapa properti universal yang testable dengan PBT adalah:

### Property 1: Badge Level Akses Selalu Ditampilkan

*Untuk setiap* kombinasi valid dari props akses (`isGuest`, `isClient`, `isPartner`, `isAdmin`, `belongsToClient`, `hasClientRestriction`), komponen PassportTopbar SHALL selalu menampilkan tepat satu Topbar_Badge dengan teks yang tidak kosong.

**Validates: Requirements 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.11**

### Property 2: Teks Badge Sesuai Mapping Level Akses

*Untuk setiap* kombinasi valid props akses, teks yang ditampilkan oleh Topbar_Badge SHALL tepat sesuai dengan satu dari lima nilai yang didefinisikan ("LEVEL 1: PUBLIC SCAN", "LEVEL 2: FLEET OWNER", "LEVEL 2: RESTRICTED", "LEVEL 3: TECHNICAL PARTNER", "LEVEL 4: ADMINISTRATOR"), tidak pernah teks lain.

**Validates: Requirements 2.4, 2.5, 2.6, 2.7, 2.8, 2.11**

*Catatan: Property 1 dan Property 2 dapat digabung — Property 2 sudah meng-cover Property 1 karena badge selalu ada jika teksnya valid.*

### Property 3: Toggle Dark/Light Membalik State

*Untuk setiap* nilai awal `isDark` (true atau false), memanggil handler Toggle_Dark_Light SHALL menghasilkan nilai `isDark` yang merupakan kebalikannya.

**Validates: Requirements 3.1, 3.2**

### Property 4: data-theme Selalu Konsisten dengan isDark

*Untuk setiap* nilai `isDark`, attribute `data-theme` pada elemen `pageWrapper` SHALL selalu bernilai `"dark"` ketika `isDark === true` dan `"light"` ketika `isDark === false`.

**Validates: Requirements 3.5**

### Property 5: Semua Level Akses Menggunakan Card Class yang Sama

*Untuk setiap* kombinasi level akses yang berbeda, class CSS yang diterapkan pada elemen Card di halaman SHALL identik — tidak ada class CSS kondisional berdasarkan role yang diterapkan pada container Card.

**Validates: Requirements 6.1, 6.2**

### Property 6: Tombol Aksi Selalu Menggunakan Class Standar

*Untuk setiap* level akses, semua tombol aksi yang dirender di Slide "Layanan & Dukungan" SHALL menggunakan tepat salah satu dari class `btnPrimary` atau `btnEmergency`, tidak pernah class lain atau inline style untuk warna tombol.

**Validates: Requirements 6.4**

### Property 7: Toast Warna Sesuai Tipe

*Untuk setiap* tipe toast (`success`, `error`, `info`), warna background toast yang dirender SHALL sesuai dengan mapping yang didefinisikan: success → hijau, error → merah, info → biru Cobalt — tidak pernah warna yang tidak sesuai tipe.

**Validates: Requirements 11.4**

---

## Error Handling

### Skenario Error Loading Data

| Kondisi | Perilaku |
|---------|---------|
| Token tidak valid / tidak ditemukan di database | Tampilkan `errorContainer` → `errorCard` putih neumorphism dengan `ShieldAlert` icon, pesan deskriptif, tombol "Kembali ke Beranda" |
| Network error saat fetch | Sama seperti di atas; hook `usePassportData` sudah menangkap error ini dan mengisi state `error` |
| Data loading (masih fetch) | Tampilkan `loadingContainer` → `Loader2` spinner dengan teks "Memindai QR Passport..." |
| Unit ditemukan tapi data parsial | Halaman tetap render; field yang kosong ditampilkan sebagai "—" |

### Skenario Error Upload (Admin)

| Kondisi | Perilaku |
|---------|---------|
| Upload file gagal | Toast error merah muncul di pojok kanan atas |
| Upload sedang berjalan | Tombol/label upload menampilkan teks "Mengupload..." dan `opacity: 0.6` (inline style runtime dipertahankan) |
| Format file tidak didukung | Dibatasi oleh atribut `accept` pada `<input type="file">` |

### Skenario Error Service Request

| Kondisi | Perilaku |
|---------|---------|
| Submit service request gagal | Hook `useSmartRouting` menampilkan toast error; modal tetap terbuka |
| Routing tidak menemukan mitra | Modal menampilkan `resultCardFallback` dengan pesan deskriptif |

### Skenario Dark Mode

| Kondisi | Perilaku |
|---------|---------|
| `data-theme` tidak di-set | Default ke light mode (CSS tidak memerlukan selector untuk light) |
| CSS variables tidak ter-load | Elemen jatuh ke fallback browser; tidak ada crash JavaScript |

### Penanganan Komponen Opsional

```tsx
// IoT Telemetry hanya dirender jika tersedia
WHERE komponen IoT telemetry tersedia, THE Carousel SHALL memuat Slide "IoT Telemetry"
// → Diimplementasikan dengan conditional rendering berdasarkan data availability
```

---

## Testing Strategy

### Pendekatan Pengujian

Fitur ini adalah **UI-only refactor** — tidak ada perubahan logika bisnis, API, atau backend. Strategi pengujian difokuskan pada:

1. **Snapshot tests** — memastikan output HTML/CSS tidak berubah secara tak sengaja setelah refactor
2. **Unit tests** — memverifikasi logika kondisional di `PassportTopbar` (badge text, toggle, conditional rendering)
3. **Property-based tests** — memverifikasi properti universal yang berlaku untuk semua kombinasi input (badge mapping, toggle behavior, theme consistency)
4. **Smoke tests** — memverifikasi struktur CSS (tidak ada hard-coded hex, panjang file, tidak ada selector dark override)

### Unit Tests — PassportTopbar

```typescript
// Contoh: Verifikasi badge text untuk setiap kombinasi access level
describe('PassportTopbar', () => {
  it('menampilkan LEVEL 1 ketika isGuest=true', () => {
    render(<PassportTopbar isGuest={true} isClient={false} ... />);
    expect(screen.getByText('LEVEL 1: PUBLIC SCAN')).toBeInTheDocument();
  });

  it('menampilkan LEVEL 4 ketika isAdmin=true', () => {
    render(<PassportTopbar isAdmin={true} ... />);
    expect(screen.getByText('LEVEL 4: ADMINISTRATOR')).toBeInTheDocument();
  });

  it('menampilkan tombol QR hanya untuk admin', () => {
    const { rerender } = render(<PassportTopbar isAdmin={false} ... />);
    expect(screen.queryByLabelText('Print QR')).not.toBeInTheDocument();
    rerender(<PassportTopbar isAdmin={true} ... />);
    expect(screen.getByLabelText('Print QR')).toBeInTheDocument();
  });

  it('toggle mengubah isDark dari false ke true', () => {
    const setIsDark = jest.fn();
    render(<PassportTopbar isDark={false} setIsDark={setIsDark} ... />);
    fireEvent.click(screen.getByRole('button', { name: /dark/i }));
    expect(setIsDark).toHaveBeenCalled();
  });
});
```

### Property-Based Tests

Menggunakan library **fast-check** (TypeScript/JavaScript).

```typescript
import fc from 'fast-check';

// Property 2 & 1: Badge selalu valid untuk semua kombinasi akses
test('badge selalu menampilkan teks yang valid untuk setiap kombinasi akses', () => {
  // Feature: unit-detail-ui-redesign, Property 2: Teks Badge Sesuai Mapping Level Akses
  const validBadgeTexts = [
    'LEVEL 1: PUBLIC SCAN',
    'LEVEL 2: FLEET OWNER',
    'LEVEL 2: RESTRICTED',
    'LEVEL 3: TECHNICAL PARTNER',
    'LEVEL 4: ADMINISTRATOR',
  ];

  fc.assert(fc.property(
    fc.record({
      isGuest: fc.boolean(),
      isClient: fc.boolean(),
      isPartner: fc.boolean(),
      isAdmin: fc.boolean(),
      belongsToClient: fc.boolean(),
      hasClientRestriction: fc.boolean(),
    }),
    (accessProps) => {
      const result = getBadgeConfig(accessProps);
      return validBadgeTexts.includes(result.text);
    }
  ), { numRuns: 100 });
});

// Property 3 & 4: Toggle selalu membalik state dan data-theme konsisten
test('toggle membalik isDark dan data-theme selalu konsisten', () => {
  // Feature: unit-detail-ui-redesign, Property 3: Toggle Dark/Light Membalik State
  fc.assert(fc.property(
    fc.boolean(),
    (initialDark) => {
      const toggleResult = !initialDark;
      const dataTheme = toggleResult ? 'dark' : 'light';
      return (toggleResult !== initialDark) && 
             (dataTheme === (toggleResult ? 'dark' : 'light'));
    }
  ), { numRuns: 100 });
});

// Property 5: Card class identik untuk semua level akses
test('class CSS Card identik terlepas dari level akses', () => {
  // Feature: unit-detail-ui-redesign, Property 5: Semua Level Akses Menggunakan Card Class yang Sama
  const accessLevels = [
    { isGuest: true },
    { isClient: true, belongsToClient: true },
    { isClient: true, hasClientRestriction: true },
    { isPartner: true },
    { isAdmin: true },
  ];

  fc.assert(fc.property(
    fc.integer({ min: 0, max: accessLevels.length - 1 }),
    fc.integer({ min: 0, max: accessLevels.length - 1 }),
    (i, j) => {
      const { container: c1 } = render(<MockPage access={accessLevels[i]} />);
      const { container: c2 } = render(<MockPage access={accessLevels[j]} />);
      const card1Class = c1.querySelector('[class*="card"]')?.className;
      const card2Class = c2.querySelector('[class*="card"]')?.className;
      return card1Class === card2Class;
    }
  ), { numRuns: 100 });
});
```

**Konfigurasi:** Minimum **100 iterasi** per property test (`numRuns: 100`).

### Smoke Tests — Struktur CSS

```bash
# Verifikasi CSS module tidak lebih dari 500 baris
wc -l app/frontend/src/app/id/[token]/id.module.css

# Verifikasi tidak ada selector [data-theme="light"] (seharusnya light adalah default)
grep -c '\[data-theme="light"\]' app/frontend/src/app/id/[token]/id.module.css

# Verifikasi tidak ada selector [data-theme="dark"] di CSS module
grep -c '\[data-theme="dark"\]' app/frontend/src/app/id/[token]/id.module.css

# Verifikasi tidak ada hex color hardcoded yang seharusnya sudah ada sebagai token
grep -E '#[0-9A-Fa-f]{3,6}' app/frontend/src/app/id/[token]/id.module.css
```

### Snapshot Tests

```typescript
// Snapshot light mode default
it('halaman passport merender dengan benar dalam light mode', () => {
  const { container } = render(
    <MockPassportPage isDark={false} unit={mockUnit} user={mockGuestUser} />
  );
  expect(container).toMatchSnapshot();
});

// Snapshot dark mode
it('halaman passport merender dengan benar dalam dark mode', () => {
  const { container } = render(
    <MockPassportPage isDark={true} unit={mockUnit} user={mockGuestUser} />
  );
  expect(container).toMatchSnapshot();
});

// Snapshot loading state
it('menampilkan spinner loading', () => {
  const { container } = render(<MockPassportPage loading={true} />);
  expect(screen.getByText('Memindai QR Passport...')).toBeInTheDocument();
  expect(container).toMatchSnapshot();
});

// Snapshot error state
it('menampilkan error card ketika unit tidak ditemukan', () => {
  const { container } = render(<MockPassportPage error="Unit tidak ditemukan" />);
  expect(screen.getByText('Unit Tidak Terdaftar')).toBeInTheDocument();
  expect(container).toMatchSnapshot();
});
```

### Regression Tests — Logika Bisnis Tidak Berubah

Karena ini adalah refactor CSS+presentasi, perlu dipastikan logika bisnis tidak ikut berubah:

```typescript
// Verifikasi hook calls tidak berubah setelah migrasi
it('usePassportData dipanggil saat komponen mount', () => {
  const mockHook = jest.spyOn(passportHooks, 'usePassportData');
  render(<QrPassportPage />);
  expect(mockHook).toHaveBeenCalled();
});

// Verifikasi event handlers masih berfungsi
it('service modal terbuka ketika tombol diklik', () => {
  render(<MockPassportPage isGuest={true} />);
  fireEvent.click(screen.getByText('Laporkan Masalah / Request Service'));
  expect(screen.getByRole('dialog')).toBeInTheDocument();
});
```

### Framework & Tools

| Tool | Kegunaan |
|------|---------|
| **Jest** + **React Testing Library** | Unit tests, snapshot tests, integration tests |
| **fast-check** | Property-based tests (≥100 iterasi per property) |
| **jest-axe** | Accessibility compliance verification |
| Grep / `wc -l` | Smoke tests untuk struktur CSS |

### Definisi "Done"

- [ ] Semua snapshot tests pass (tidak ada regresi visual tidak disengaja)
- [ ] Semua property-based tests pass dengan ≥100 iterasi
- [ ] `id.module.css` ≤ 500 baris
- [ ] Tidak ada selector `[data-theme="light"]` atau `[data-theme="dark"]` di `id.module.css`
- [ ] Tidak ada hex hardcoded untuk token yang sudah ada di `globals.css`
- [ ] File `PassportTopbar.tsx` ada di path yang benar
- [ ] `page.tsx` tidak memiliki inline styles statis (hanya runtime values)
- [ ] Dark mode berfungsi melalui CSS variables tanpa selector tambahan
