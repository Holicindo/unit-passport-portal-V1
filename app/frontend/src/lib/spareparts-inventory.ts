// Data inventaris sparepart resmi Holicindo
export interface SparepartItem {
  id: string;
  name: string;
  partNumber: string;
  category: string;
  defaultPrice?: number;
}

export const HOLIC_SPAREPARTS_INVENTORY: SparepartItem[] = [
  // Sistem Pendingin & Refrigerasi
  { id: 'SP-CMP-001', name: 'Kompresor Embraco 1/2 HP R290', partNumber: 'EMB-R290-050', category: 'Refrigerasi' },
  { id: 'SP-CMP-002', name: 'Kompresor Embraco 1/3 HP R290', partNumber: 'EMB-R290-033', category: 'Refrigerasi' },
  { id: 'SP-CMP-003', name: 'Kompresor Embraco 1/4 HP R134a', partNumber: 'EMB-R134-025', category: 'Refrigerasi' },
  { id: 'SP-CMP-004', name: 'Kompresor Secop / Danfoss 1/2 HP', partNumber: 'SCP-SC15G', category: 'Refrigerasi' },
  { id: 'SP-FAN-001', name: 'Motor Fan Kondensor EBM 10W', partNumber: 'EBM-M4Q045-10W', category: 'Fan & Blower' },
  { id: 'SP-FAN-002', name: 'Motor Fan Evaporator EBM 5W', partNumber: 'EBM-M4Q045-05W', category: 'Fan & Blower' },
  { id: 'SP-FAN-003', name: 'Blower Tangensial Cross-Flow 300mm', partNumber: 'CFB-300-220V', category: 'Fan & Blower' },
  { id: 'SP-CAP-001', name: 'Kapasitor Start 80uF 250V', partNumber: 'CAP-ST-80UF', category: 'Kelistrikan' },
  { id: 'SP-CAP-002', name: 'Kapasitor Run 15uF 450V', partNumber: 'CAP-RN-15UF', category: 'Kelistrikan' },
  { id: 'SP-RLY-001', name: 'Relay Potensial & Overload Klixon', partNumber: 'KLX-MRA991', category: 'Kelistrikan' },
  { id: 'SP-FLT-001', name: 'Filter Drier Copper 20g 1/4"', partNumber: 'FLT-DR-20G', category: 'Refrigerasi' },
  { id: 'SP-VLV-001', name: 'Katup Ekspansi Termostatik (TXV) Danfoss T2', partNumber: 'TXV-DAN-T2', category: 'Refrigerasi' },
  { id: 'SP-VLV-002', name: 'Pipa Kapiler 0.042" x 2 Meter', partNumber: 'CAP-TUBE-042', category: 'Refrigerasi' },
  { id: 'SP-GAS-001', name: 'Freon R290 Canister 370g', partNumber: 'REF-R290-370G', category: 'Refrigerasi' },
  { id: 'SP-GAS-002', name: 'Freon R134a Canister 1000g', partNumber: 'REF-R134A-1KG', category: 'Refrigerasi' },

  // Termostat & Kontroler Digital
  { id: 'SP-CTR-001', name: 'Digital Controller Carel PJEZS', partNumber: 'CRL-PJEZS00000', category: 'Kontroler' },
  { id: 'SP-CTR-002', name: 'Digital Controller Dixell XR06CX', partNumber: 'DXL-XR06CX-5N0C1', category: 'Kontroler' },
  { id: 'SP-CTR-003', name: 'Sensor Probe NTC 10K Carel (Hitam)', partNumber: 'PRB-NTC-10K-BK', category: 'Sensor' },
  { id: 'SP-CTR-004', name: 'Sensor Probe NTC 10K Carel (Biru/Defrost)', partNumber: 'PRB-NTC-10K-BL', category: 'Sensor' },
  { id: 'SP-THM-001', name: 'Termostat Mekanikal Ranco K50', partNumber: 'RNC-K50-P1110', category: 'Kontroler' },

  // Gasket, Seal & Pintu Kaca
  { id: 'SP-GSK-001', name: 'Magnetic Door Gasket Profile A (Custom Cut)', partNumber: 'GSK-MAG-PRF-A', category: 'Hardware & Seal' },
  { id: 'SP-GSK-002', name: 'Magnetic Door Gasket Profile B (Custom Cut)', partNumber: 'GSK-MAG-PRF-B', category: 'Hardware & Seal' },
  { id: 'SP-HNG-001', name: 'Engsel Pintu Showcase Heavy Duty Stainless', partNumber: 'HNG-HD-SS304', category: 'Hardware & Seal' },
  { id: 'SP-HND-001', name: 'Handle Pintu Aluminium Ergonomis', partNumber: 'HND-AL-300', category: 'Hardware & Seal' },
  { id: 'SP-ROL-001', name: 'Roller Sliding Door Bottom Track (Set)', partNumber: 'ROL-SLD-SET', category: 'Hardware & Seal' },

  // Lighting & Electrical
  { id: 'SP-LED-001', name: 'LED Strip Warm White 3000K Food-Grade (1m)', partNumber: 'LED-WW-3000K-1M', category: 'Pencahayaan' },
  { id: 'SP-LED-002', name: 'LED Strip Natural White 4000K Cake Display (1m)', partNumber: 'LED-NW-4000K-1M', category: 'Pencahayaan' },
  { id: 'SP-PSU-001', name: 'Power Supply / Trafo LED 12V 5A Meanwell', partNumber: 'PSU-MW-12V-5A', category: 'Kelistrikan' },
  { id: 'SP-PSU-002', name: 'Power Supply / Trafo LED 24V 5A Meanwell', partNumber: 'PSU-MW-24V-5A', category: 'Kelistrikan' },
  { id: 'SP-SWT-001', name: 'Rocker Switch On/Off Waterproof dengan Lampu', partNumber: 'SWT-RCK-WP-RED', category: 'Kelistrikan' },

  // Heater & Defrost
  { id: 'SP-HTR-001', name: 'Glass Heater Wire Anti-Mist Depan', partNumber: 'HTR-WR-MIST-FRT', category: 'Heater' },
  { id: 'SP-HTR-002', name: 'Defrost Heater Pipe Evaporator 300W', partNumber: 'HTR-DEF-EVAP-300W', category: 'Heater' },
  { id: 'SP-HTR-003', name: 'Drain Pipe Heater Cord 1.5 Meter', partNumber: 'HTR-DRN-15M', category: 'Heater' },
];
