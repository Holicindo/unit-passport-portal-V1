-- ============================================================
-- Migration 014: Create Operational Tables
-- Adds tables for Deliveries, Installations, and Invoices
-- ============================================================

-- 1. DELIVERIES TABLE
CREATE TABLE IF NOT EXISTS deliveries (
    id VARCHAR(50) PRIMARY KEY,
    "unitId" VARCHAR(50) NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    "partnerId" VARCHAR(50) REFERENCES partners(id) ON DELETE SET NULL,
    delivery_date TIMESTAMP,
    destination_address TEXT,
    notes TEXT,
    status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. INSTALLATIONS TABLE
CREATE TABLE IF NOT EXISTS installations (
    id VARCHAR(50) PRIMARY KEY,
    "unitId" VARCHAR(50) NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    "partnerId" VARCHAR(50) REFERENCES partners(id) ON DELETE SET NULL,
    installation_date TIMESTAMP,
    location TEXT,
    technician_name VARCHAR(255),
    notes TEXT,
    status VARCHAR(50) DEFAULT 'SCHEDULED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. INVOICES TABLE
CREATE TABLE IF NOT EXISTS invoices (
    id VARCHAR(50) PRIMARY KEY,
    invoice_number VARCHAR(100),
    "unitId" VARCHAR(50) REFERENCES units(id) ON DELETE SET NULL,
    "partnerId" VARCHAR(50) REFERENCES partners(id) ON DELETE SET NULL,
    invoice_date TIMESTAMP,
    description TEXT,
    notes TEXT,
    status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_deliveries_unit_id ON deliveries("unitId");
CREATE INDEX IF NOT EXISTS idx_deliveries_partner_id ON deliveries("partnerId");
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(status);
CREATE INDEX IF NOT EXISTS idx_deliveries_created_at ON deliveries(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_installations_unit_id ON installations("unitId");
CREATE INDEX IF NOT EXISTS idx_installations_partner_id ON installations("partnerId");
CREATE INDEX IF NOT EXISTS idx_installations_status ON installations(status);
CREATE INDEX IF NOT EXISTS idx_installations_created_at ON installations(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_invoices_unit_id ON invoices("unitId");
CREATE INDEX IF NOT EXISTS idx_invoices_partner_id ON invoices("partnerId");
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at DESC);
