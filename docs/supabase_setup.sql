-- ==============================================================================
-- STUMARCOT PRECAST CONCRETE FACTORY — PRODUCTION & STOCK LEDGER
-- Supabase PostgreSQL Database Schema
-- Run this complete script in your Supabase SQL Editor:
-- Project Dashboard > SQL Editor > New Query > Paste & Run
-- ==============================================================================

-- Enable pgcrypto extension for UUID generation if needed
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. ITEMS (FACTORY PRODUCT CATALOG)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    unit TEXT NOT NULL CHECK (unit IN ('pcs', 'sqm')),
    pcs_per_sqm NUMERIC NULL CHECK (pcs_per_sqm IS NULL OR pcs_per_sqm > 0),
    colors TEXT[] NOT NULL DEFAULT '{}',
    reorder_level NUMERIC NULL DEFAULT 100 CHECK (reorder_level IS NULL OR reorder_level >= 0),
    wastani_per_bag NUMERIC NULL,
    "moldCount" NUMERIC NULL,
    mold_size TEXT NULL,
    recipe_id TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_items_category ON public.items (category);
CREATE INDEX IF NOT EXISTS idx_items_name ON public.items (name);

-- ------------------------------------------------------------------------------
-- 2. MOVEMENTS (APPEND-ONLY PRODUCTION & STOCK LEDGER)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.movements (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    item_id TEXT NOT NULL REFERENCES public.items (id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('opening_balance', 'production_in', 'dispatch_out', 'adjustment')),
    color TEXT NULL,
    quantity_pcs NUMERIC NOT NULL CHECK (quantity_pcs >= 0),
    quantity_sqm NUMERIC NULL CHECK (quantity_sqm IS NULL OR quantity_sqm >= 0),
    delta NUMERIC NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    note TEXT NULL,
    entered_by TEXT NOT NULL DEFAULT 'Supervisor',
    materials_used JSONB NULL,
    computed_materials_deducted JSONB NULL,
    batch_id TEXT NULL,
    qc_status TEXT NULL,
    expected_cement_bags NUMERIC NULL,
    actual_cement_bags NUMERIC NULL,
    is_residual BOOLEAN NULL DEFAULT false,
    yield_factor_pct NUMERIC NULL,
    unit_sold_as TEXT NULL,
    price_per_unit NUMERIC NULL,
    total_price NUMERIC NULL,
    customer_name TEXT NULL,
    customer_phone TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for lightning-fast queries and aggregate reporting
CREATE INDEX IF NOT EXISTS idx_movements_item_id ON public.movements (item_id);
CREATE INDEX IF NOT EXISTS idx_movements_date ON public.movements (date);
CREATE INDEX IF NOT EXISTS idx_movements_type ON public.movements (type);
CREATE INDEX IF NOT EXISTS idx_movements_batch_id ON public.movements (batch_id);
CREATE INDEX IF NOT EXISTS idx_movements_created_at ON public.movements (created_at DESC);

-- ------------------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movements ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to prevent conflicts on re-runs
DROP POLICY IF EXISTS "Public items select" ON public.items;
DROP POLICY IF EXISTS "Public items insert" ON public.items;
DROP POLICY IF EXISTS "Public items update" ON public.items;
DROP POLICY IF EXISTS "Public items delete" ON public.items;

DROP POLICY IF EXISTS "Public movements select" ON public.movements;
DROP POLICY IF EXISTS "Public movements insert" ON public.movements;
DROP POLICY IF EXISTS "Public movements update" ON public.movements;
DROP POLICY IF EXISTS "Public movements delete" ON public.movements;

-- Permissive policies for PWA client (using Anon Key)
CREATE POLICY "Public items select" ON public.items FOR SELECT USING (true);
CREATE POLICY "Public items insert" ON public.items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public items update" ON public.items FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public items delete" ON public.items FOR DELETE USING (true);

CREATE POLICY "Public movements select" ON public.movements FOR SELECT USING (true);
CREATE POLICY "Public movements insert" ON public.movements FOR INSERT WITH CHECK (true);
CREATE POLICY "Public movements update" ON public.movements FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public movements delete" ON public.movements FOR DELETE USING (true);

-- ------------------------------------------------------------------------------
-- 4. REALTIME REPLICATION (OPTIONAL FOR INSTANT SYNC)
-- ------------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'items'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.items;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'movements'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.movements;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END $$;
