// ─── Types ────────────────────────────────────────────────────────────────────

export interface ServiceLog {
  id: string;
  issue_description: string;
  action_taken: string;
  service_date: string;
  completed_at: string | null;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  technician_name: string;
  created_at: string;
  unit?: Unit;
}

export interface Unit {
  id: string;
  serial_number: string;
  model_name: string;
  warranty_expiry: string | null;
  status: string;
  service_logs?: ServiceLog[];
}

export type WarrantyCategory = 'Kaca / Glass' | 'Kelistrikan' | 'Refrigerasi' | 'Lainnya';

export interface WarrantyIssue {
  unit: Unit;
  log: ServiceLog;
  category: WarrantyCategory;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function daysBetween(dateA: Date, dateB: Date): number {
  return Math.floor((dateB.getTime() - dateA.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function categorizeIssue(description: string): WarrantyCategory {
  const d = (description || '').toLowerCase();
  if (/kaca|glass|pintu|door|retak/.test(d)) return 'Kaca / Glass';
  if (/lampu|listrik|electrical|lighting|kabel|wiring/.test(d)) return 'Kelistrikan';
  if (/freon|kompresor|compressor|bocor|suhu|dingin|refriger/.test(d)) return 'Refrigerasi';
  return 'Lainnya';
}
