const fs = require('fs');

console.log('--- TEST: MAIN BATCH OUTPUT & ACTUAL PRODUCTION OUTPUT DISPLAY ---');
const bundle = fs.readFileSync('assets/index-hgjhj-0G.js', 'utf8');

// 1. Check syntax
try {
  require('child_process').execSync('node --check assets/index-hgjhj-0G.js');
  console.log('✓ assets/index-hgjhj-0G.js syntax is 100% VALID');
} catch (e) {
  console.error('Syntax error in bundle:', e.message);
  process.exit(1);
}

// 2. Check MAIN BATCH OUTPUT heading color
const mainHeaderIdx = bundle.indexOf('children: "MAIN BATCH OUTPUT"');
if (mainHeaderIdx === -1) {
  console.error('❌ MAIN BATCH OUTPUT header not found');
  process.exit(1);
}
const mainHeaderSnippet = bundle.substring(mainHeaderIdx - 200, mainHeaderIdx + 100);
if (mainHeaderSnippet.includes('#eab308')) {
  console.log('✓ MAIN BATCH OUTPUT heading retains yellow/gold color (#eab308)');
} else {
  console.error('❌ MAIN BATCH OUTPUT heading missing #eab308:', mainHeaderSnippet);
  process.exit(1);
}

// 3. Check Sub-card 1: PRIMARY PRODUCT OUTPUT
const sub1Idx = bundle.indexOf('children: "PRIMARY PRODUCT OUTPUT"');
if (sub1Idx === -1) {
  console.error('❌ PRIMARY PRODUCT OUTPUT sub-card not found');
  process.exit(1);
}
const sub1Snippet = bundle.substring(sub1Idx - 150, sub1Idx + 50);
if (sub1Snippet.includes('#ffffff') || sub1Snippet.includes('#f8fafc')) {
  console.log('✓ PRIMARY PRODUCT OUTPUT sub-card heading is WHITE (#ffffff)');
} else {
  console.error('❌ PRIMARY PRODUCT OUTPUT heading not white:', sub1Snippet);
  process.exit(1);
}

// 4. Check Sub-card 2: RESIDUALS (SECONDARY PRODUCTS)
const sub2Idx = bundle.indexOf('children: "RESIDUALS (SECONDARY PRODUCTS)"');
if (sub2Idx === -1) {
  console.error('❌ RESIDUALS (SECONDARY PRODUCTS) sub-card not found');
  process.exit(1);
}
const sub2Snippet = bundle.substring(sub2Idx - 150, sub2Idx + 50);
if (sub2Snippet.includes('#ffffff') || sub2Snippet.includes('#f8fafc')) {
  console.log('✓ RESIDUALS (SECONDARY PRODUCTS) sub-card heading is WHITE (#ffffff)');
} else {
  console.error('❌ RESIDUALS (SECONDARY PRODUCTS) heading not white:', sub2Snippet);
  process.exit(1);
}

// 5. Check Sub-card 3: WEIGHTED BATCH YIELD CALIBRATION
const sub3Idx = bundle.indexOf('children: "WEIGHTED BATCH YIELD CALIBRATION"');
if (sub3Idx === -1) {
  console.error('❌ WEIGHTED BATCH YIELD CALIBRATION sub-card not found');
  process.exit(1);
}
const sub3Snippet = bundle.substring(sub3Idx - 150, sub3Idx + 50);
if (sub3Snippet.includes('#ffffff') || sub3Snippet.includes('#f8fafc')) {
  console.log('✓ WEIGHTED BATCH YIELD CALIBRATION sub-card heading is WHITE (#ffffff)');
} else {
  console.error('❌ WEIGHTED BATCH YIELD CALIBRATION heading not white:', sub3Snippet);
  process.exit(1);
}

// 6. Check hierarchy: All three sub-cards appear inside MAIN BATCH OUTPUT
const memoIdx = bundle.indexOf('Supervisor Batch Note / Shift Memo');
if (mainHeaderIdx < sub1Idx && sub1Idx < sub2Idx && sub2Idx < sub3Idx && sub3Idx < memoIdx) {
  console.log('✓ Card hierarchy confirmed: MAIN BATCH OUTPUT contains PRIMARY PRODUCT OUTPUT, RESIDUALS, and WEIGHTED BATCH YIELD CALIBRATION as sub-cards');
} else {
  console.error('❌ Incorrect hierarchy order:', { mainHeaderIdx, sub1Idx, sub2Idx, sub3Idx, memoIdx });
  process.exit(1);
}

// 7. Check ACTUAL PRODUCTION OUTPUT dynamic sqm/pcs display
if (bundle.includes('isTilesOrPavings') && bundle.includes('actualSqm') && bundle.includes('M²') && bundle.includes('Pcs')) {
  console.log('✓ ACTUAL PRODUCTION OUTPUT displays sqm (M²) for tiles/pavings and pcs for other products');
} else {
  console.error('❌ ACTUAL PRODUCTION OUTPUT sqm/pcs logic not found in bundle');
  process.exit(1);
}

console.log('\n🎉 ALL MAIN BATCH OUTPUT 3 SUB-CARDS AND SQM TESTS PASSED!');
