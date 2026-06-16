// ─── Indonesia Cities & Provinces lookup ─────────────────────────────────────
export const INDONESIA_CITIES = [
  { city: 'Jakarta Pusat', province: 'DKI Jakarta' },
  { city: 'Jakarta Selatan', province: 'DKI Jakarta' },
  { city: 'Jakarta Barat', province: 'DKI Jakarta' },
  { city: 'Jakarta Timur', province: 'DKI Jakarta' },
  { city: 'Jakarta Utara', province: 'DKI Jakarta' },
  { city: 'Tangerang', province: 'Banten' },
  { city: 'Tangerang Selatan', province: 'Banten' },
  { city: 'Serang', province: 'Banten' },
  { city: 'Cilegon', province: 'Banten' },
  { city: 'Bekasi', province: 'Jawa Barat' },
  { city: 'Depok', province: 'Jawa Barat' },
  { city: 'Bogor', province: 'Jawa Barat' },
  { city: 'Bandung', province: 'Jawa Barat' },
  { city: 'Cimahi', province: 'Jawa Barat' },
  { city: 'Cirebon', province: 'Jawa Barat' },
  { city: 'Sukabumi', province: 'Jawa Barat' },
  { city: 'Tasikmalaya', province: 'Jawa Barat' },
  { city: 'Karawang', province: 'Jawa Barat' },
  { city: 'Purwakarta', province: 'Jawa Barat' },
  { city: 'Subang', province: 'Jawa Barat' },
  { city: 'Semarang', province: 'Jawa Tengah' },
  { city: 'Solo', province: 'Jawa Tengah' },
  { city: 'Magelang', province: 'Jawa Tengah' },
  { city: 'Salatiga', province: 'Jawa Tengah' },
  { city: 'Pekalongan', province: 'Jawa Tengah' },
  { city: 'Tegal', province: 'Jawa Tengah' },
  { city: 'Kudus', province: 'Jawa Tengah' },
  { city: 'Purwokerto', province: 'Jawa Tengah' },
  { city: 'Yogyakarta', province: 'DI Yogyakarta' },
  { city: 'Sleman', province: 'DI Yogyakarta' },
  { city: 'Bantul', province: 'DI Yogyakarta' },
  { city: 'Surabaya', province: 'Jawa Timur' },
  { city: 'Malang', province: 'Jawa Timur' },
  { city: 'Sidoarjo', province: 'Jawa Timur' },
  { city: 'Gresik', province: 'Jawa Timur' },
  { city: 'Mojokerto', province: 'Jawa Timur' },
  { city: 'Kediri', province: 'Jawa Timur' },
  { city: 'Blitar', province: 'Jawa Timur' },
  { city: 'Madiun', province: 'Jawa Timur' },
  { city: 'Jember', province: 'Jawa Timur' },
  { city: 'Banyuwangi', province: 'Jawa Timur' },
  { city: 'Denpasar', province: 'Bali' },
  { city: 'Badung', province: 'Bali' },
  { city: 'Gianyar', province: 'Bali' },
  { city: 'Tabanan', province: 'Bali' },
  { city: 'Buleleng', province: 'Bali' },
  { city: 'Mataram', province: 'Nusa Tenggara Barat' },
  { city: 'Lombok Barat', province: 'Nusa Tenggara Barat' },
  { city: 'Kupang', province: 'Nusa Tenggara Timur' },
  { city: 'Medan', province: 'Sumatera Utara' },
  { city: 'Binjai', province: 'Sumatera Utara' },
  { city: 'Pematangsiantar', province: 'Sumatera Utara' },
  { city: 'Padang', province: 'Sumatera Barat' },
  { city: 'Bukittinggi', province: 'Sumatera Barat' },
  { city: 'Pekanbaru', province: 'Riau' },
  { city: 'Dumai', province: 'Riau' },
  { city: 'Batam', province: 'Kepulauan Riau' },
  { city: 'Tanjungpinang', province: 'Kepulauan Riau' },
  { city: 'Palembang', province: 'Sumatera Selatan' },
  { city: 'Lubuklinggau', province: 'Sumatera Selatan' },
  { city: 'Bandar Lampung', province: 'Lampung' },
  { city: 'Metro', province: 'Lampung' },
  { city: 'Bengkulu', province: 'Bengkulu' },
  { city: 'Jambi', province: 'Jambi' },
  { city: 'Banda Aceh', province: 'Aceh' },
  { city: 'Pontianak', province: 'Kalimantan Barat' },
  { city: 'Singkawang', province: 'Kalimantan Barat' },
  { city: 'Palangkaraya', province: 'Kalimantan Tengah' },
  { city: 'Banjarmasin', province: 'Kalimantan Selatan' },
  { city: 'Banjarbaru', province: 'Kalimantan Selatan' },
  { city: 'Samarinda', province: 'Kalimantan Timur' },
  { city: 'Balikpapan', province: 'Kalimantan Timur' },
  { city: 'Bontang', province: 'Kalimantan Timur' },
  { city: 'Tarakan', province: 'Kalimantan Utara' },
  { city: 'Makassar', province: 'Sulawesi Selatan' },
  { city: 'Palopo', province: 'Sulawesi Selatan' },
  { city: 'Pare-Pare', province: 'Sulawesi Selatan' },
  { city: 'Kendari', province: 'Sulawesi Tenggara' },
  { city: 'Palu', province: 'Sulawesi Tengah' },
  { city: 'Gorontalo', province: 'Gorontalo' },
  { city: 'Manado', province: 'Sulawesi Utara' },
  { city: 'Bitung', province: 'Sulawesi Utara' },
  { city: 'Tomohon', province: 'Sulawesi Utara' },
  { city: 'Ambon', province: 'Maluku' },
  { city: 'Ternate', province: 'Maluku Utara' },
  { city: 'Jayapura', province: 'Papua' },
  { city: 'Sorong', province: 'Papua Barat' },
];

// ─── Issue Category Options for Service Request Modal ────────────────────────
export const ISSUE_MAIN_CATEGORIES = [
  { value: '', label: '— Pilih Kategori —' },
  { value: 'Kendala Showcase', label: 'Showcase (e.g. Chiller Display, Case Display, dll)' },
  { value: 'Kendala Comersil Refrigeration', label: 'Comersil Refrigeration' },
  { value: 'Kendala Mesin', label: 'Mesin (e.g. Steamer, dll)' },
];

export const ISSUE_SUB_CATEGORIES_SHOWCASE = [
  { value: '', label: '— Pilih Kendala —' },
  { value: 'Pendingin', label: 'Pendingin (Kurang Dingin/Bocor)' },
  { value: 'Kelistrikan', label: 'Kelistrikan (Konslet/Tidak Menyala)' },
  { value: 'Lampu', label: 'Lampu (Mati/Redup)' },
  { value: 'Kaca', label: 'Kaca (Pecah/Berembun)' },
];

// Alias for backward compatibility
export const ISSUE_SUB_CATEGORIES = ISSUE_SUB_CATEGORIES_SHOWCASE;

export const LOG_TYPE_OPTIONS = [
  { value: 'CORRECTIVE', label: 'Corrective — Perbaikan Masalah / Kerusakan' },
  { value: 'PREVENTIVE', label: 'Preventive — Perawatan Rutin (PM)' },
];

export const LOG_STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'IN PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELED', label: 'Canceled' },
];

// ─── Unit Type Auto-Detection ────────────────────────────────────────────────
// Rule: model_name yang mengandung kata "case" (Cold Case, Warm Case, dll) = SHOWCASE
// Selain itu = MESIN
export type UnitTypeKey = 'SHOWCASE' | 'MESIN';

export function getUnitType(modelName: string | null | undefined): UnitTypeKey {
  if (!modelName) return 'MESIN';
  return /case/i.test(modelName) ? 'SHOWCASE' : 'MESIN';
}

export const UNIT_TYPE_LABELS: Record<UnitTypeKey, string> = {
  SHOWCASE: 'Showcase',
  MESIN: 'Mesin',
};

export const UNIT_TYPE_COLORS: Record<UnitTypeKey, { bg: string; color: string; border: string }> = {
  SHOWCASE: {
    bg: 'rgba(59,130,246,0.12)',
    color: '#3b82f6',
    border: 'rgba(59,130,246,0.25)',
  },
  MESIN: {
    bg: 'rgba(245,158,11,0.12)',
    color: '#d97706',
    border: 'rgba(245,158,11,0.25)',
  },
};
