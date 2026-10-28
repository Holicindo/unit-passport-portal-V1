export interface IotCalibration {
  id: string;
  unit_id: string;
  
  // Sensor offsets (°C)
  cabinet_offset: number;
  evaporator_offset: number;
  condenser_offset: number;
  
  // Metadata
  calibrated_at: Date;
  calibrated_by: string | null;
  notes: string | null;
  
  // Reference temperatures
  reference_cabinet: number | null;
  reference_evaporator: number | null;
  reference_condenser: number | null;
  
  // Timestamps
  created_at: Date;
  updated_at: Date;
}
