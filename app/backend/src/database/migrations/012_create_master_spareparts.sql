-- Migration 012: Create Master Data Spareparts Table and Seed Initial Data
CREATE TABLE IF NOT EXISTS master_spareparts (
  id VARCHAR(64) PRIMARY KEY,
  part_number VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  default_price NUMERIC(15, 2) DEFAULT 0,
  description TEXT,
  compatibility VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_master_spareparts_category ON master_spareparts(category);
CREATE INDEX IF NOT EXISTS idx_master_spareparts_name ON master_spareparts(name);

-- Seed awal dari HOLIC_SPAREPARTS_INVENTORY
INSERT INTO master_spareparts (id, part_number, name, category, default_price) VALUES
('SP-CMP-001', 'EMB-R290-050', 'Kompresor Embraco 1/2 HP R290', 'Refrigerasi', 2850000),
('SP-CMP-002', 'EMB-R290-033', 'Kompresor Embraco 1/3 HP R290', 'Refrigerasi', 2450000),
('SP-CMP-003', 'EMB-R134-025', 'Kompresor Embraco 1/4 HP R134a', 'Refrigerasi', 2150000),
('SP-CMP-004', 'SCP-SC15G', 'Kompresor Secop / Danfoss 1/2 HP', 'Refrigerasi', 3100000),
('SP-FAN-001', 'EBM-M4Q045-10W', 'Motor Fan Kondensor EBM 10W', 'Fan & Blower', 485000),
('SP-FAN-002', 'EBM-M4Q045-05W', 'Motor Fan Evaporator EBM 5W', 'Fan & Blower', 425000),
('SP-FAN-003', 'CFB-300-220V', 'Blower Tangensial Cross-Flow 300mm', 'Fan & Blower', 650000),
('SP-CAP-001', 'CAP-ST-80UF', 'Kapasitor Start 80uF 250V', 'Kelistrikan', 125000),
('SP-CAP-002', 'CAP-RN-15UF', 'Kapasitor Run 15uF 450V', 'Kelistrikan', 95000),
('SP-RLY-001', 'KLX-MRA991', 'Relay Potensial & Overload Klixon', 'Kelistrikan', 175000),
('SP-FLT-001', 'FLT-DR-20G', 'Filter Drier Copper 20g 1/4"', 'Refrigerasi', 75000),
('SP-VLV-001', 'TXV-DAN-T2', 'Katup Ekspansi Termostatik (TXV) Danfoss T2', 'Refrigerasi', 850000),
('SP-VLV-002', 'CAP-TUBE-042', 'Pipa Kapiler 0.042" x 2 Meter', 'Refrigerasi', 45000),
('SP-GAS-001', 'REF-R290-370G', 'Freon R290 Canister 370g', 'Refrigerasi', 160000),
('SP-GAS-002', 'REF-R134A-1KG', 'Freon R134a Canister 1000g', 'Refrigerasi', 195000),
('SP-CTR-001', 'CRL-PJEZS00000', 'Digital Controller Carel PJEZS', 'Kontroler', 850000),
('SP-CTR-002', 'DXL-XR06CX-5N0C1', 'Digital Controller Dixell XR06CX', 'Kontroler', 920000),
('SP-CTR-003', 'PRB-NTC-10K-BK', 'Sensor Probe NTC 10K Carel (Hitam)', 'Sensor', 110000),
('SP-CTR-004', 'PRB-NTC-10K-BL', 'Sensor Probe NTC 10K Carel (Biru/Defrost)', 'Sensor', 110000),
('SP-THM-001', 'RNC-K50-P1110', 'Termostat Mekanikal Ranco K50', 'Kontroler', 185000),
('SP-GSK-001', 'GSK-MAG-PRF-A', 'Magnetic Door Gasket Profile A (Custom Cut)', 'Hardware & Seal', 320000),
('SP-GSK-002', 'GSK-MAG-PRF-B', 'Magnetic Door Gasket Profile B (Custom Cut)', 'Hardware & Seal', 320000),
('SP-HNG-001', 'HNG-HD-SS304', 'Engsel Pintu Showcase Heavy Duty Stainless', 'Hardware & Seal', 240000),
('SP-HND-001', 'HND-AL-300', 'Handle Pintu Aluminium Ergonomis', 'Hardware & Seal', 175000),
('SP-ROL-001', 'ROL-SLD-SET', 'Roller Sliding Door Bottom Track (Set)', 'Hardware & Seal', 190000),
('SP-LED-001', 'LED-WW-3000K-1M', 'LED Strip Warm White 3000K Food-Grade (1m)', 'Pencahayaan', 95000),
('SP-LED-002', 'LED-NW-4000K-1M', 'LED Strip Natural White 4000K Cake Display (1m)', 'Pencahayaan', 95000),
('SP-PSU-001', 'PSU-MW-12V-5A', 'Power Supply / Trafo LED 12V 5A Meanwell', 'Kelistrikan', 320000),
('SP-PSU-002', 'PSU-MW-24V-5A', 'Power Supply / Trafo LED 24V 5A Meanwell', 'Kelistrikan', 360000),
('SP-SWT-001', 'SWT-RCK-WP-RED', 'Rocker Switch On/Off Waterproof dengan Lampu', 'Kelistrikan', 35000),
('SP-HTR-001', 'HTR-WR-MIST-FRT', 'Glass Heater Wire Anti-Mist Depan', 'Heater', 290000),
('SP-HTR-002', 'HTR-DEF-EVAP-300W', 'Defrost Heater Pipe Evaporator 300W', 'Heater', 380000),
('SP-HTR-003', 'HTR-DRN-15M', 'Drain Pipe Heater Cord 1.5 Meter', 'Heater', 210000)
ON CONFLICT (part_number) DO UPDATE SET 
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  default_price = EXCLUDED.default_price;
