import fs from 'fs'
import { parse } from '@babel/parser'
const s = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8')
try {
  parse(s, { sourceType: 'module', plugins: ['jsx', 'classProperties', 'optionalChaining', 'nullishCoalescingOperator'] })
  console.log('Parsed successfully')
} catch (e) {
  console.error('Parse error:')
  console.error(e.message)
  if (e.loc) {
    const { line, column, index } = e.loc
    console.error('Location:', line, column, index)
    const start = Math.max(0, index - 120)
    const end = Math.min(s.length, index + 120)
    console.error('\n----- CONTEXT -----\n')
    console.error(s.slice(start, end).replace(/\n/g, '\n'))
    console.error('\n----- END -----\n')
  }
  process.exit(1)
}
