import fs from 'fs'
import { parse } from '@babel/parser'
const s = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8')
const res = parse(s, { sourceType: 'module', plugins: ['jsx','classProperties','optionalChaining','nullishCoalescingOperator'], errorRecovery: true })
console.log('Parsed with recovery. Errors:', res.errors.length)
res.errors.forEach((e,i)=>{
  console.log(i+1, e.message, e.loc)
})
