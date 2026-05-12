-- 001_initial_schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. CLIENTS TABLE
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(255) NOT NULL,
    industry VARCHAR(100),
    logo_url VARCHAR(512),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. UNITS TABLE
CREATE TABLE IF NOT EXISTS units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    serial_number VARCHAR(100) UNIQUE NOT NULL,
    model_name VARCHAR(255) NOT NULL,
    specs JSONB DEFAULT '{}',
    qr_token VARCHAR(100) UNIQUE NOT NULL,
    current_client_id UUID REFERENCES clients(id),
    production_date DATE,
    warranty_expiry DATE,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. WARRANTIES TABLE
CREATE TABLE IF NOT EXISTS warranties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
    warranty_type VARCHAR(50) NOT NULL, -- GENERAL, COMPRESSOR, etc.
    duration_label VARCHAR(50), -- 1_TAHUN, 2_TAHUN
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    voided_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. PARTNERS TABLE
CREATE TABLE IF NOT EXISTS partners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_name VARCHAR(255) NOT NULL,
    city VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    contact_wa VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. SERVICE_LOGS TABLE
CREATE TABLE IF NOT EXISTS service_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
    partner_id UUID REFERENCES partners(id),
    issue_description TEXT,
    action_taken TEXT,
    service_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. SERVICE_LOG_ATTACHMENTS TABLE
CREATE TABLE IF NOT EXISTS service_log_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_log_id UUID REFERENCES service_logs(id) ON DELETE CASCADE,
    file_type VARCHAR(50), -- PHOTO, PDF_SPK
    file_url VARCHAR(512) NOT NULL,
    file_name VARCHAR(255),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. OWNERSHIP_HISTORY TABLE
CREATE TABLE IF NOT EXISTS ownership_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
    from_client_id UUID REFERENCES clients(id),
    to_client_id UUID REFERENCES clients(id),
    transfer_date DATE DEFAULT CURRENT_TIMESTAMP,
    reason VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- INDEXING
CREATE INDEX idx_units_serial ON units(serial_number);
CREATE INDEX idx_units_qr ON units(qr_token);
CREATE INDEX idx_service_unit ON service_logs(unit_id);
CREATE INDEX idx_warranty_unit ON warranties(unit_id);
