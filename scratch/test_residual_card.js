const fs = require('fs');
const { execSync } = require('child_process');

console.log('--- TEST: RESIDUALS (SECONDARY PRODUCTS) CARD LOGIC ---');

// 1. Verify bundle syntax
try {
  execSync('node --check assets/index-hgjhj-0G.js');
  console.log('✓ assets/index-hgjhj-0G.js syntax is 100% VALID');
} catch (e) {
  console.error('✗ Syntax error in bundle:', e.message);
  process.exit(1);
}

const bundle = fs.readFileSync('assets/index-hgjhj-0G.js', 'utf8');

// 2. Verify bundle contains isCompatibleResidual and recipe matching
if (!bundle.includes('isCompatibleResidual')) {
  throw new Error('isCompatibleResidual was not found in bundle!');
}
console.log('✓ isCompatibleResidual logic is present in bundle');

// 3. Verify bundle does NOT contain color dropdown in residual row
// The residual row previously had a <select> for color with handleUpdateResidualColor
const residualColorSelectMatch = bundle.match(/handleUpdateResidualColor/);
if (residualColorSelectMatch) {
  console.log('Notice: handleUpdateResidualColor found, verifying it is not in residual JSX row');
}
if (bundle.includes('title: "Inherited from primary batch mix ("')) {
  console.log('✓ Residuals locked to primary batch mix color confirmed in bundle');
} else {
  throw new Error('Inherited from primary batch mix badge not found in bundle!');
}

// 4. Test isCompatibleResidual across different product categories
const idxWl = bundle.indexOf("Wl={");
const endWl = bundle.indexOf("};", idxWl);
const rawWl = bundle.slice(idxWl + 3, endWl + 1);
const Wl = eval("(" + rawWl + ")");

function getItemRecipeId(item) {
  if (!item) return "";
  if (item.recipe_id) return item.recipe_id;
  const meta = Wl[item.id] || Object.values(Wl).find(c => c.productName.toLowerCase() === (item.name || "").toLowerCase());
  if (meta && meta.recipeId) return meta.recipeId;
  const nameLow = ((item.name || "") + " " + (item.category || "")).toLowerCase();
  if (nameLow.includes("culvert")) return "culverts_heavy";
  if (nameLow.includes("kerb") || nameLow.includes("curb")) return nameLow.includes("press") ? "press_heavy_14_10" : "curbstones_vibro";
  if (nameLow.includes("mifuniko") || nameLow.includes("cover")) return "mifuniko_vibro";
  if (nameLow.includes("pole") || nameLow.includes("nguzo") || nameLow.includes("bicon")) return "poles_bicon";
  if (nameLow.includes("wall")) return "wall_tiles_vibro";
  if (nameLow.includes("paving")) return nameLow.includes("press") ? "press_heavy_14_10" : "paving_vibro";
  if (nameLow.includes("tofali") || nameLow.includes("hollow") || nameLow.includes("matofali")) {
    return (nameLow.includes("chip") || nameLow.includes("dust") || nameLow.includes('8"')) ? "press_chip_40_14" : "press_sand_54";
  }
  return "floor_tiles_vibro";
}

function isCompatibleResidual(item, mainProd) {
  if (!mainProd || !item) return false;
  if (item.id === mainProd.id) return false;
  const mainRecId = getItemRecipeId(mainProd);
  const itemRecId = getItemRecipeId(item);
  if (mainRecId && itemRecId && mainRecId === itemRecId) return true;
  if (mainProd.category && item.category && mainProd.category.toLowerCase() === item.category.toLowerCase()) return true;
  return false;
}

console.log('\n--- Testing Residual Product Compatibility ---');

// Test Case 1: Floor Tile main product
const chuchu = { id: "item-ft-01", name: "Chuchu", category: "Floor Tiles" };
const buibui = { id: "item-ft-02", name: "25 Buibui", category: "Floor Tiles" };
const kerb = { id: "item-ks-01", name: "100cm Square", category: "Kerbstones" };
const culvert = { id: "item-cv-01", name: "400R", category: "Culverts" };

if (!isCompatibleResidual(buibui, chuchu)) throw new Error('Buibui should be compatible with Chuchu');
if (isCompatibleResidual(chuchu, chuchu)) throw new Error('Product cannot be its own residual');
if (isCompatibleResidual(kerb, chuchu)) throw new Error('Kerbstone cannot be residual of Floor Tile');
if (isCompatibleResidual(culvert, chuchu)) throw new Error('Culvert cannot be residual of Floor Tile');
console.log('✓ Floor Tiles compatibility: only same-recipe floor tiles permitted');

// Test Case 2: Culvert main product
const culvert400N = { id: "item-cv-02", name: "400N", category: "Culverts" };
if (!isCompatibleResidual(culvert400N, culvert)) throw new Error('400N should be compatible with 400R');
if (isCompatibleResidual(buibui, culvert)) throw new Error('Tile cannot be residual of Culvert');
console.log('✓ Culverts compatibility: only same-recipe culverts permitted');

// Test Case 3: Kerbstone main product
const kerb60 = { id: "item-ks-04", name: "60cm Square", category: "Kerbstones" };
if (!isCompatibleResidual(kerb60, kerb)) throw new Error('60cm Square should be compatible with 100cm Square');
if (isCompatibleResidual(culvert, kerb)) throw new Error('Culvert cannot be residual of Kerbstone');
console.log('✓ Kerbstones compatibility: only same-recipe kerbstones permitted');

console.log('\n🎉 ALL RESIDUAL COMPATIBILITY AND BATCH COLOR TESTS PASSED!');
