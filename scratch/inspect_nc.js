const fs = require('fs');
const bundle = fs.readFileSync('assets/index-hgjhj-0G.js', 'utf8');

const start = bundle.indexOf('nc=[');
const end = bundle.indexOf('],ns={', start);
console.log('nc slice found:', start, end);
const raw = bundle.substring(start + 3, end + 1);

// Find each item
const items = [];
const regex = /\{id:"([^"]+)",name:"([^"]+)",category:"([^"]+)"([^}]+)\}/g;
let match;
while ((match = regex.exec(raw)) !== null) {
  const extra = match[4];
  const colorsMatch = extra.match(/colors:(\[[^\]]*\])/);
  const colors = colorsMatch ? JSON.parse(colorsMatch[1]) : [];
  items.push({
    id: match[1],
    name: match[2],
    category: match[3],
    colors: colors
  });
}

console.log('Total items in nc:', items.length);
items.forEach(it => {
  console.log(`${it.id} | ${it.name} | ${it.category} | colors: ${JSON.stringify(it.colors)}`);
});
