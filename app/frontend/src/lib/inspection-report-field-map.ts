export interface FieldConfig {
  x: number;
  y: number;
  maxWidth?: number;
  size?: number;
  bold?: boolean;
  align?: 'left' | 'center' | 'right';
  label?: string; // Untuk debug
}

export const INSPECTION_FIELD_MAP: Record<string, FieldConfig> = {
  // --- HEADER (TOP RIGHT BOX) ---
  reportNo: {
    x: 420,
    y: 841,
    maxWidth: 65,
    size: 7,
    bold: true,
    align: 'left',
    label: 'Report No'
  },
  serialNumber: {
    x: 430,
    y: 838,
    maxWidth: 65,
    size: 7,
    align: 'left',
    label: 'Serial No'
  },
  orderDocument: {
    x: 430,
    y: 835,
    maxWidth: 65,
    size: 7,
    align: 'left',
    label: 'Order Doc'
  },
  productionCode: {
    x: 430,
    y: 821,
    maxWidth: 65,
    size: 7,
    align: 'left',
    label: 'Prod Code'
  },

  // --- CUSTOMER & DATES (ROW BELOW TITLE) ---
  customer: {
    x: 100,
    y: 814,
    maxWidth: 150,
    size: 8,
    align: 'left',
    label: 'Customer'
  },
  startDate: {
    x: 360,
    y: 814,
    maxWidth: 80,
    size: 7,
    align: 'left',
    label: 'Start Date'
  },
  finishDate: {
    x: 460,
    y: 814,
    maxWidth: 80,
    size: 7,
    align: 'left',
    label: 'Finish Date'
  },
  category: {
    x: 100,
    y: 812,
    maxWidth: 100,
    size: 8,
    align: 'left',
    label: 'Category'
  },
  model: {
    x: 400,
    y: 812,
    maxWidth: 120,
    size: 8,
    align: 'left',
    label: 'Model'
  },

  // --- STEP 2: DIMENSIONS (Siap untuk dikalibrasi) ---
  dim_body_p: { x: 100, y: 700, maxWidth: 50, size: 8, label: 'Body P' },
  dim_body_l: { x: 200, y: 700, maxWidth: 50, size: 8, label: 'Body L' },
  dim_body_t: { x: 300, y: 700, maxWidth: 50, size: 8, label: 'Body T' },
  
  dim_kaca_depan: { x: 150, y: 650, maxWidth: 50, size: 8, label: 'Kaca Depan' },
  dim_kaca_samping: { x: 150, y: 630, maxWidth: 50, size: 8, label: 'Kaca Samping' },
  dim_kaca_atas: { x: 150, y: 610, maxWidth: 50, size: 8, label: 'Kaca Atas' },
  dim_kaca_pintu: { x: 150, y: 590, maxWidth: 50, size: 8, label: 'Kaca Pintu' },
  dim_kaca_tingkatan: { x: 150, y: 570, maxWidth: 50, size: 8, label: 'Tingkatan' },
};
