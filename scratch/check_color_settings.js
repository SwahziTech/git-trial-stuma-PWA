const fs = require('fs');
const bundle = fs.readFileSync('assets/index-hgjhj-0G.js', 'utf8');

const regex = /colors/g;
let m;
const matches = [];
while ((m = regex.exec(bundle)) !== null) {
  const snippet = bundle.substring(m.index - 50, m.index + 100);
  if (snippet.includes('input') || snippet.includes('checkbox') || snippet.includes('toggle') || snippet.includes('filter') || snippet.includes('setColors') || snippet.includes('onChange')) {
    matches.push({ index: m.index, snippet });
  }
}
console.log('Matches in product settings or forms:', matches.length);
matches.slice(0, 10).forEach(x => console.log(x.index, x.snippet));
