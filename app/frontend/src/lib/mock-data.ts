// Mock data untuk demo - nanti diganti dengan API call ke NestJS backend
export const mockUnit = {
  id: "uuid-001",
  serial_number: "HOLI-CP-001",
  model_name: "Custom Patisserie Showcase",
  model_series: "C-Series",
  qr_token: "holi-cp-001",
  status: "Active",
  compressor: "Embraco 1/2 HP",
  refrigerant: "R290",
  wattage: "450W",
  voltage: "220V / 50Hz",
  dimensions: "1200 x 750 x 1300 mm",
  production_date: "2024-05-01",
  installation_date: "2024-05-10",
  warranty_start: "2024-05-10",
  warranty_end: "2025-05-10",
  client_name: "Bakerzin",
  outlet_name: "Bakerzin Central Park",
  city: "Jakarta Barat",
  image_url: null,
  documents: [
    { id: "doc-1", type: "Manual", label: "User Manual (PDF)", url: "#" },
    { id: "doc-2", type: "Wiring", label: "Wiring Diagram (PDF)", url: "#" },
    { id: "doc-3", type: "Video", label: "Cleaning Tutorial", url: "#" },
  ],
  service_logs: [
    {
      id: "log-1",
      date: "2024-08-15",
      type: "Preventive Maintenance",
      technician: "Budi Santoso",
      partner: "Holicindo HQ",
      notes: "General cleaning, condenser check. Unit in good condition.",
      status: "Completed",
    },
    {
      id: "log-2",
      date: "2025-01-20",
      type: "Corrective Repair",
      technician: "Andi Wijaya",
      partner: "Mitra Servis Jakarta",
      notes: "Replaced door gasket. Temperature stabilized post-repair.",
      status: "Completed",
    },
  ],
};

export type Unit = typeof mockUnit;
export type ServiceLog = typeof mockUnit.service_logs[0];
export type Document = typeof mockUnit.documents[0];
