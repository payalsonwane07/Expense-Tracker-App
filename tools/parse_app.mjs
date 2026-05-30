import fs from 'fs'
import { parse } from '@babel/parser'
const s = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8')
try {
  parse(s, { sourceType: 'module', plugins: ['jsx', 'classProperties', 'optionalChaining', 'nullishCoalescingOperator'] })
  console.log('Parsed successfully')
} catch (e) {
  console.error('Parse error:')
  console.error(e.message)
  if (e.loc) console.error('Location:', e.loc)
  process.exit(1)
}
