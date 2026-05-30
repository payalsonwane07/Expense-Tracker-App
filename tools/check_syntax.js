const fs = require('fs');
const path = require('path');
const p = path.resolve(__dirname, '../src/App.jsx');
const s = fs.readFileSync(p, 'utf8');
function count(ch){return (s.match(new RegExp(ch.replace(/[-/\\^$*+?.()|[\]{}]/g,'\\$&'),'g'))||[]).length}
console.log('length', s.length)
console.log('backticks', count('`'))
console.log('single quotes', count("'"))
console.log('double quotes', count('"'))
console.log('open paren', count('('), 'close paren', count(')'))
console.log('open brace', count('{'), 'close brace', count('}'))
console.log('open bracket', count('['), 'close bracket', count(']'))
// find line numbers of backticks
s.split('\n').forEach((l, i)=>{ if (l.includes('`')) console.log(i+1, l.trim()) })
