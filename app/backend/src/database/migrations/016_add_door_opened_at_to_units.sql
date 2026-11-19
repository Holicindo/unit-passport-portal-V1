-- 016_add_door_opened_at_to_units.sql
-- Digunakan untuk melacak durasi pintu terbuka yang persisten di DB agar tahan restart server
ALTER TABLE units ADD COLUMN IF NOT EXISTS door_opened_at TIMESTAMP NULL;
