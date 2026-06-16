// Dashboard data processing utilities

export interface StatsData {
  activeUnits: number;
  underWarranty: number;
  openReports: number;
  issuesDetected: number;
  activePartners: number;
  fleetHealth: number;
}

export interface ChartMonth {
  key: string;
  label: string;
  fullName: string;
  count: number;
  completed: number;
  pending: number;
}

export interface ScheduleItem {
  id: string;
  type: string;
  title: string;
  description: string;
  timeStr: string;
  section: string;
  taskType?: string;
}

export interface PMItem {
  id: number;
  day: number;
  month: string;
  model: string;
  sn: string;
  partner: string;
  relative: string;
}

export interface WarrantyCategories {
  glass: number;
  electrical: number;
  refrigeration: number;
}

export function computeStats(
  rawUnits: any[], rawReports: any[], rawPartners: any[]
): StatsData {
  const activeUnitsCount = rawUnits.length;
  const underWarrantyCount = rawUnits.filter((u: any) => {
    if (!u.warranty_expiry) return false;
    return new Date(u.warranty_expiry) > new Date();
  }).length;
  const openReportsCount = rawReports.length;
  const issuesDetectedCount = rawReports.filter((r: any) =>
    r.form_type === 'ISSUE_ANALYSIS' || r.type === 'ISSUE_ANALYSIS'
  ).length;
  const activePartnersCount = rawPartners.length;
  const computedHealth = activeUnitsCount > 0
    ? Math.round((1 - (issuesDetectedCount / activeUnitsCount)) * 1000) / 10
    : 99.4;

  return {
    activeUnits: activeUnitsCount,
    underWarranty: underWarrantyCount,
    openReports: openReportsCount,
    issuesDetected: issuesDetectedCount,
    activePartners: activePartnersCount,
    fleetHealth: computedHealth,
  };
}

export function filterOneYearLogs(rawLogs: any[]): any[] {
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  return rawLogs.filter((log: any) => {
    const d = new Date(log.created_at || log.date || new Date());
    return d >= oneYearAgo;
  });
}

export function buildChartData(oneYearLogs: any[]): ChartMonth[] {
  const last12Months: ChartMonth[] = Array.from({ length: 12 }).map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (11 - i));
    return {
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('id-ID', { month: 'short' }),
      fullName: d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
      count: 0,
      completed: 0,
      pending: 0,
    };
  });

  oneYearLogs.forEach((log: any) => {
    const logDate = new Date(log.created_at || log.date || new Date());
    const logKey = `${logDate.getFullYear()}-${String(logDate.getMonth() + 1).padStart(2, '0')}`;
    const monthMatch = last12Months.find(m => m.key === logKey);
    if (monthMatch) {
      monthMatch.count++;
      if (log.status === 'COMPLETED') monthMatch.completed++;
      else monthMatch.pending++;
    }
  });

  return last12Months;
}

export function computeActiveClients(oneYearLogs: any[]): { name: string; count: number }[] {
  const clientCounts: Record<string, number> = {};
  oneYearLogs.forEach((log: any) => {
    const clientName = log.unit?.current_client?.company_name || log.client?.company_name || 'Umum / Stock HQ';
    clientCounts[clientName] = (clientCounts[clientName] || 0) + 1;
  });
  const list = Object.entries(clientCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
  if (list.length === 0) list.push({ name: 'Umum / Stock HQ', count: 0 });
  return list;
}

export function computeFrequentUnits(oneYearLogs: any[]): { sn: string; name: string; count: number }[] {
  const unitServiceCounts: Record<string, { model: string; count: number }> = {};
  oneYearLogs.forEach((log: any) => {
    const sn = log.unit?.serial_number || '-';
    const model = log.unit?.model_name || 'Unknown Model';
    if (!unitServiceCounts[sn]) unitServiceCounts[sn] = { model, count: 0 };
    unitServiceCounts[sn].count++;
  });
  return Object.entries(unitServiceCounts)
    .map(([sn, val]) => ({ sn, name: val.model, count: val.count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

export function computeSchedules(rawLogs: any[]): ScheduleItem[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const schedulesToday: ScheduleItem[] = [];
  const schedulesTomorrow: ScheduleItem[] = [];

  rawLogs.forEach((log: any) => {
    if (log.status !== 'COMPLETED') {
      const sDate = new Date(log.scheduled_date || log.service_date || new Date());
      sDate.setHours(0, 0, 0, 0);
      const taskTypeMap: Record<string, string> = { CORRECTIVE: 'Perbaikan', PREVENTIVE: 'Perawatan', INSTALLATION: 'Instalasi' };
      const taskType = log.task_type || 'CORRECTIVE';
      const act: ScheduleItem = {
        id: `log-${log.id}`,
        type: 'info',
        title: taskTypeMap[taskType] || 'Servis Terjadwal',
        description: `${log.unit?.model_name || 'Unit'} (${log.unit?.serial_number || '-'}) — ${log.technician_name || 'Belum dialokasi'}`,
        timeStr: '',
        section: sDate.getTime() === today.getTime() ? 'Hari Ini' : 'Besok',
        taskType,
      };
      if (sDate.getTime() === today.getTime()) schedulesToday.push(act);
      else if (sDate.getTime() === tomorrow.getTime()) schedulesTomorrow.push(act);
    }
  });

  return [
    ...(schedulesToday.length > 0 ? schedulesToday : [{ id: 'empty-today', type: 'empty', section: 'Hari Ini', title: 'Tidak ada jadwal hari ini', description: 'Semua aman terkendali.', timeStr: '' }]),
    ...(schedulesTomorrow.length > 0 ? schedulesTomorrow : [{ id: 'empty-tomorrow', type: 'empty', section: 'Besok', title: 'Tidak ada jadwal besok', description: 'Semua aman terkendali.', timeStr: '' }]),
  ];
}

export function computeAnalytics(rawLogs: any[]) {
  const wCategories: WarrantyCategories = { glass: 0, electrical: 0, refrigeration: 0 };
  const overdueTickets: any[] = [];
  const callIdVisits: Record<string, { sn: string; visits: number; issue: string }> = {};

  rawLogs.forEach((log: any) => {
    // Keluhan Berulang (> 2x)
    const callId = log.call_id || log.issue_description || 'Unknown Issue';
    if (!callIdVisits[callId]) {
      callIdVisits[callId] = { sn: log.unit?.serial_number || '-', visits: 0, issue: log.issue_description || 'General Service' };
    }
    callIdVisits[callId].visits++;

    // Tiket Terbengkalai (> 2 Minggu)
    if (log.status !== 'COMPLETED') {
      const createdDate = new Date(log.created_at || log.service_date || new Date());
      const diffDays = Math.floor((new Date().getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays >= 14) {
        overdueTickets.push({
          callId: log.id || callId,
          sn: log.unit?.serial_number || '-',
          daysOpen: diffDays,
          issue: log.issue_description || 'Pending Service',
        });
      }
    }

    // Warranty Kategorisasi
    const logDate = new Date(log.created_at || log.date || new Date());
    if (log.unit && log.unit.warranty_expiry) {
      const wEnd = new Date(log.unit.warranty_expiry);
      if (logDate <= wEnd) {
        const desc = (log.issue_description || '').toLowerCase();
        if (desc.includes('glass') || desc.includes('kaca') || desc.includes('pecah')) {
          wCategories.glass++;
        } else if (desc.includes('listrik') || desc.includes('lampu') || desc.includes('kabel') || desc.includes('electrical')) {
          wCategories.electrical++;
        } else {
          wCategories.refrigeration++;
        }
      }
    }
  });

  const frequentCallIds = Object.entries(callIdVisits)
    .map(([id, data]) => ({ id, ...data }))
    .filter(c => c.visits >= 2)
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 5);

  const overdueCallIds = overdueTickets.sort((a, b) => b.daysOpen - a.daysOpen).slice(0, 5);

  return { frequentCallIds, overdueCallIds, warrantyCategories: wCategories };
}

export function computeUpcomingPMs(rawLogs: any[]): PMItem[] {
  return rawLogs
    .filter((log: any) => log.status === 'PENDING')
    .map((log: any) => {
      const sDate = new Date(log.scheduled_date || log.date || new Date());
      const diffDays = Math.ceil((sDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      let statusPill = `${diffDays} hari lagi`;
      if (diffDays < 0) statusPill = 'Lewat Jadwal';
      if (diffDays === 0) statusPill = 'Hari Ini';
      if (diffDays === 1) statusPill = 'Besok';

      return {
        id: log.id,
        day: sDate.getDate(),
        month: sDate.toLocaleDateString('id-ID', { month: 'short' }),
        model: log.unit?.model_name || 'Compressor Unit',
        sn: log.unit?.serial_number || '-',
        partner: log.partner?.name || 'Mitra Resmi Holicindo',
        relative: statusPill,
      };
    })
    .slice(0, 4);
}

export function computeSplinePaths(chartData: ChartMonth[]) {
  if (!chartData || chartData.length === 0) {
    return { completedLine: '', completedFill: '', pendingLine: '', pendingFill: '', points: [] as any[] };
  }

  const pointsCount = chartData.length;
  const maxVal = Math.max(...chartData.map(c => Math.max(c.completed, c.pending)), 4);

  const getPath = (dataKey: 'completed' | 'pending') => {
    const points = chartData.map((d, i) => {
      const x = 5 + (i / (pointsCount - 1)) * 90;
      const y = 85 - (d[dataKey] / maxVal) * 70;
      return { x, y, ...d };
    });

    let linePath = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cp1x = p0.x + (p1.x - p0.x) / 2.5;
      const cp2x = p0.x + (p1.x - p0.x) / 1.5;
      linePath += ` C ${cp1x} ${p0.y}, ${cp2x} ${p1.y}, ${p1.x} ${p1.y}`;
    }
    const fillPath = `${linePath} L 95 100 L 5 100 Z`;
    return { linePath, fillPath, points };
  };

  const comp = getPath('completed');
  const pend = getPath('pending');

  return {
    completedLine: comp.linePath,
    completedFill: comp.fillPath,
    pendingLine: pend.linePath,
    pendingFill: pend.fillPath,
    points: comp.points,
  };
}
