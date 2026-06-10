// Report history shared constants and helpers

export const formTypes = [
  { id: 'INSPECTION',     label: 'Inspection Report (QC)' },
  { id: 'COOLING_1',      label: 'Cooling System Report 1 Suhu' },
  { id: 'COOLING_2',      label: 'Cooling System Report 2 Suhu' },
  { id: 'COOLING_3',      label: 'Cooling System Report 3 Suhu' },
  { id: 'COOLING_WARM',   label: 'Cooling System Report Warm' },
  { id: 'ISSUE_ANALYSIS', label: 'Inspeksi & Analisis Masalah' },
  { id: 'REWORK',         label: 'Pengecekan Rework' },
  { id: 'COMMISSIONING',  label: 'Graphic Record' },
  { id: 'QC_SERVICE',     label: 'Checklist QC Service' },
];

/** Map form_type → edit URL for a given report id */
export function getEditUrl(formType: string, reportId: string): string {
  const map: Record<string, string> = {
    COOLING_1:      `/reports/cooling?editId=${reportId}`,
    COOLING_2:      `/reports/cooling2?editId=${reportId}`,
    COOLING_3:      `/reports/cooling3?editId=${reportId}`,
    COOLING_WARM:   `/reports/reportwarm?editId=${reportId}`,
    REWORK:         `/reports/rework?editId=${reportId}`,
    COMMISSIONING:  `/reports/graphic-record?editId=${reportId}`,
    QC_SERVICE:     `/reports/qc-service?editId=${reportId}`,
  };
  return map[formType] || `/reports/inspection?editId=${reportId}`;
}

/** Compensate for backend TypeORM timezone shift (+7 hours) */
export function parseDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  const d = new Date(dateStr);
  return new Date(d.getTime() + 7 * 60 * 60 * 1000);
}
