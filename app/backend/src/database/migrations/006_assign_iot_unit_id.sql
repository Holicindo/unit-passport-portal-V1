-- Migration 006: Assign iot_unit_id to units for IoT pairing
-- 
-- CARA PAKAI:
-- 1. Buka Supabase Dashboard → SQL Editor
-- 2. Jalankan query SELECT dulu untuk lihat unit yang ada:
--
--    SELECT id, serial_number, model_name, iot_unit_id FROM units ORDER BY created_at DESC;
--
-- 3. Setelah tahu serial_number unit yang akan dipasang ESP32,
--    jalankan UPDATE di bawah ini (ganti WHERE sesuai serial_number yang benar):
--
-- CONTOH — ganti 'SERIAL-NUMBER-DISINI' dengan serial number unit pameran:

UPDATE units
SET iot_unit_id = 'HC-0001'
WHERE serial_number = 'SERIAL-NUMBER-DISINI'
  AND iot_unit_id IS NULL;

-- Verifikasi hasilnya:
SELECT id, serial_number, model_name, iot_unit_id 
FROM units 
WHERE iot_unit_id = 'HC-0001';

-- CATATAN:
-- Nilai 'HC-0001' harus sama persis dengan const char* unit_id di firmware main.cpp
-- Jika ingin ganti nama, ganti di KEDUA tempat (firmware + query ini) sebelum flash.
