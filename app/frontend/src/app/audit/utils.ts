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

export interface AuditUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  last_login: string | null;
  created_at: string;
  client_id?: string;
  partner_id?: string;
  client?: { company_name?: string };
  partner?: { partner_name?: string };
}

export type WarrantyCategory = 'Kaca / Glass' | 'Kelistrikan' | 'Refrigerasi' | 'Lainnya';

export interface WarrantyIssue {
  unit: Unit;
  log: ServiceLog;
  category: WarrantyCategory;
}

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return `${d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} • ${d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
}

export function getTimeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Belum pernah';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  if (diffMins < 1) return 'Baru saja';
  if (diffMins < 60) return `${diffMins}m lalu`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}j lalu`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}h lalu`;
  return formatDate(dateStr);
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
