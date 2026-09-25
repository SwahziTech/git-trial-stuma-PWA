const fs = require('fs');
const bundle = fs.readFileSync('assets/index-hgjhj-0G.js', 'utf8');

const start = bundle.indexOf('nc=[');
const end = bundle.indexOf('],ns={', start);
const raw = bundle.substring(start + 3, end + 1);

const regex = /\{id:"([^"]+)",name:"([^"]+)",category:"([^"]+)"([^}]+)\}/g;
let match;
while ((match = regex.exec(raw)) !== null) {
  const extra = match[4];
  const recipeMatch = extra.match(/recipe_id:"([^"]+)"/);
  const cat = match[3];
  if (cat.includes('Curb') || cat.includes('Kerb') || cat.includes('Culvert') || cat.includes('Pole') || cat.includes('Cover') || cat.includes('Mifuniko')) {
    console.log(match[1], '|', match[2], '|', cat, '| recipe_id:', recipeMatch ? recipeMatch[1] : 'NONE');
  }
}
