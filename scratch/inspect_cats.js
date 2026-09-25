const fs = require('fs');
const bundle = fs.readFileSync('assets/index-hgjhj-0G.js', 'utf8');
const start = bundle.indexOf('nc=[');
const end = bundle.indexOf('],ns={', start);
const raw = bundle.substring(start + 3, end + 1);
const regex = /\{id:"([^"]+)",name:"([^"]+)",category:"([^"]+)"([^}]+)\}/g;
let match;
const cats = new Set();
const items = [];
while ((match = regex.exec(raw)) !== null) {
  cats.add(match[3]);
  const extra = match[4];
  const unitM = extra.match(/unit:"([^"]+)"/);
  const pcsM = extra.match(/pcs_per_sqm:([0-9.]+)/);
  items.push({
    id: match[1],
    name: match[2],
    category: match[3],
    unit: unitM ? unitM[1] : null,
    pcs_per_sqm: pcsM ? parseFloat(pcsM[1]) : null
  });
}
console.log('Categories:', Array.from(cats));
console.log('Items sample:', items.slice(0, 10));
