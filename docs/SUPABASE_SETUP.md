# STUMARCOT PWA — Supabase Cloud Setup & Sync Guide

This document outlines the connection setup, database schema, and operational steps to transition the STUMARCOT Daily Production & Stock Ledger PWA from browser `localStorage` to Supabase Postgres Cloud Storage.

---

## 1. Credentials & Configuration

The project is configured to connect to your dedicated Supabase instance:
- **Project URL:** `https://jbbawnuhlollasflzgrg.supabase.co`
- **API Key (Anon Public):** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiYmF3bnVobG9sbGFzZmx6Z3JnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzOTMxMzcsImV4cCI6MjEwNDk2OTEzN30.VWB8DxD5Mc0whJkjiaOo7TzKwnWqwPMkdfvbhD3ZHJI`

### Environment Files
- `.env`: Stores standard Vite environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
- `index.html`: Pre-bootstraps credentials into client `localStorage` so any phone, tablet, or desktop running the PWA automatically authenticates without manual credential entry.
- `assets/index-hgjhj-0G.js`: Pre-bundled with default cloud fallback values.

---

## 2. Step-by-Step Instructions to Activate Supabase

### Step A: Run SQL Schema in Supabase Dashboard

1. Open your browser and navigate to your Supabase Project Dashboard:
   👉 [https://supabase.com/dashboard/project/jbbawnuhlollasflzgrg](https://supabase.com/dashboard/project/jbbawnuhlollasflzgrg)
2. In the left navigation menu, click on **SQL Editor**.
3. Click **New Query**.
4. Copy the complete SQL script from [`supabase_schema.sql`](../supabase_schema.sql) (or [`docs/supabase_setup.sql`](./supabase_setup.sql)).
5. Paste it into the editor and click **Run** (or press `Ctrl + Enter`).
6. Ensure the message reads: `Success. No rows returned`.

> **Why `TEXT PRIMARY KEY`?**
> The STUMARCOT product catalog uses standardized semantic codes (e.g. `item-ft-01`, `item-pb-03`). Using `TEXT PRIMARY KEY` avoids UUID casting errors while remaining compatible with standard UUID generation for production and sales ledger entries.

---

### Step B: Seed Factory Items into Cloud Database

Once the schema is executed in Supabase, seed the 66 precast concrete items:

Run the automated seeder from your project root:
```bash
node seed_supabase.js
```

**What this does:**
- Verifies connection to `public.items`.
- Extracts all 66 items (Floor Tiles, Wall Tiles, Paving Blocks, Kerbstones, Trench Covers, Press Machine blocks, Culverts, Posts/Bicons).
- Upserts the products with their standard dimensions, colors, wastani per cement bag, and mold fleet sizes into Supabase.

*Alternative In-App Seeding:*
You can also seed directly within the running PWA:
1. Open the app in your browser or phone.
2. Click the gear / Settings icon (bottom navigation or header).
3. Under **Supabase Cloud Sync**, click **"Seed Initial Catalog to Supabase"**.

---

### Step C: Test Real-Time Cloud Sync

1. Launch your PWA locally or via your hosting URL:
   ```bash
   npx serve .
   ```
2. In the app, verify the green **"Connected to Supabase"** badge.
3. Log a new production run (e.g. 50 pcs 40 Dot Grey floor tiles) or record a sales dispatch.
4. Open the Supabase Dashboard > **Table Editor** > **`movements`**.
5. You will see the movement row recorded instantly in the cloud database with:
   - `item_id`, `type`, `color`, `quantity_pcs`, `quantity_sqm`, `delta`, `entered_by`
   - Automated recipe deductions stored in `computed_materials_deducted` (cement, sand, chipping, pigment).

---

## 3. Offline-First Resilience

The STUMARCOT PWA utilizes an offline-first architecture:
- If the factory tablet or phone temporarily loses 3G/4G connectivity, movements are safely stored in browser `localStorage`.
- Once internet connectivity is restored, the application re-syncs entries to Supabase.
- All team supervisors and managers across Dodoma Chamwino, Jamhuri showroom, and Dar es Salaam share the same live centralized database.
