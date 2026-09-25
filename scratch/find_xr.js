const fs = require('fs');
const bundle = fs.readFileSync('assets/index-hgjhj-0G.js', 'utf8');

let idx = 0;
while ((idx = bundle.indexOf('xr', idx)) !== -1) {
  const snippet = bundle.substring(idx - 30, idx + 100);
  if (snippet.includes('jsx') || snippet.includes('color')) {
    console.log(idx, snippet);
  }
  idx += 10;
}
