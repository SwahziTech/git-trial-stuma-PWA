// ==============================================================================
// STUMARCOT PRECAST CONCRETE FACTORY
// Automated Supabase Catalog Seeder
// Seeds all 66 factory items into Supabase Postgres database
// ==============================================================================

const https = require('https');
const fs = require('fs');
const path = require('path');

// Load environment configuration
const envPath = path.join(__dirname, '.env');
let supabaseUrl = 'https://jbbawnuhlollasflzgrg.supabase.co';
let supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiYmF3bnVobG9sbGFzZmx6Z3JnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzOTMxMzcsImV4cCI6MjEwNDk2OTEzN30.VWB8DxD5Mc0whJkjiaOo7TzKwnWqwPMkdfvbhD3ZHJI';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('VITE_SUPABASE_URL=')) {
      supabaseUrl = trimmed.split('=')[1].replace(/['"]/g, '').trim();
    } else if (trimmed.startsWith('VITE_SUPABASE_ANON_KEY=')) {
      supabaseAnonKey = trimmed.split('=')[1].replace(/['"]/g, '').trim();
    }
  }
}

// Extract factory items from bundle
function getFactoryItems() {
  const bundlePath = path.join(__dirname, 'assets', 'index-hgjhj-0G.js');
  if (!fs.existsSync(bundlePath)) {
    throw new Error(`Bundle file not found at: ${bundlePath}`);
  }

  const code = fs.readFileSync(bundlePath, 'utf8');
  const start = code.indexOf(',nc=') + 4;
  if (start < 4) {
    throw new Error('Could not find factory items definition (nc) in bundle');
  }

  let depth = 0;
  let end = start;
  for (let i = start; i < code.length; i++) {
    if (code[i] === '[') depth++;
    else if (code[i] === ']') {
      depth--;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }

  const arrayStr = code.substring(start, end);
  return eval(arrayStr);
}

// Perform HTTPS request helper
function makeRequest(endpoint, method, payload = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${supabaseUrl}${endpoint}`);
    const headers = {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates,return=representation'
    };

    const req = https.request(url, {
      method,
      headers
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : null;
          resolve({ status: res.statusCode, data: parsed, raw: data });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);

    if (payload) {
      req.write(JSON.stringify(payload));
    }
    req.end();
  });
}

async function runSeed() {
  console.log('----------------------------------------------------');
  console.log('🏭 STUMARCOT Precast Concrete - Supabase Catalog Seeder');
  console.log('----------------------------------------------------');
  console.log(`Endpoint: ${supabaseUrl}`);

  // Step 1: Health Check / Table verify
  console.log('\n🔍 Step 1: Verifying `public.items` table in Supabase...');
  const check = await makeRequest('/rest/v1/items?select=id&limit=1', 'GET');

  if (check.status === 404 || (check.data && check.data.code === 'PGRST205')) {
    console.error('\n❌ ERROR: Table `public.items` does not exist in Supabase yet!');
    console.error('👉 Please execute `supabase_schema.sql` in your Supabase SQL Editor first:');
    console.error('   1. Open: https://supabase.com/dashboard/project/jbbawnuhlollasflzgrg/sql');
    console.error('   2. Paste the contents of `supabase_schema.sql`');
    console.error('   3. Click "Run"');
    console.error('   4. Re-run this script: node seed_supabase.js\n');
    process.exit(1);
  }

  if (check.status >= 400) {
    console.error(`\n❌ Supabase API error (Status ${check.status}):`, check.data || check.raw);
    process.exit(1);
  }

  console.log('✅ `public.items` table detected and accessible.');

  // Step 2: Extract items
  console.log('\n📦 Step 2: Extracting standard factory catalog...');
  const items = getFactoryItems();
  console.log(`Found ${items.length} pre-configured factory products.`);

  // Step 3: Upsert items in batches of 20
  console.log('\n🚀 Step 3: Upserting items into Supabase cloud...');
  let totalUploaded = 0;
  const batchSize = 20;

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize).map(item => ({
      id: item.id,
      name: item.name,
      category: item.category,
      unit: item.unit,
      pcs_per_sqm: item.pcs_per_sqm ?? null,
      colors: item.colors || [],
      reorder_level: item.reorder_level ?? 100,
      wastani_per_bag: item.wastani_per_bag ?? null,
      moldCount: item.moldCount ?? null,
      mold_size: item.mold_size ?? null,
      recipe_id: item.recipe_id ?? null,
      updated_at: new Date().toISOString()
    }));

    const res = await makeRequest('/rest/v1/items', 'POST', batch);

    if (res.status >= 200 && res.status < 300) {
      totalUploaded += batch.length;
      console.log(`  ✓ Batch ${Math.floor(i / batchSize) + 1}: seeded ${totalUploaded}/${items.length} items`);
    } else {
      console.error(`\n❌ Failed to upload batch starting at index ${i}:`, res.data || res.raw);
      process.exit(1);
    }
  }

  console.log('\n🎉 SUCCESS! All 66 factory items successfully seeded into Supabase cloud.');
  console.log('Your mobile PWA and browser ledger will now automatically load from and sync to Supabase!');
}

runSeed().catch(err => {
  console.error('\n❌ Unexpected error during seeding:', err);
  process.exit(1);
});
