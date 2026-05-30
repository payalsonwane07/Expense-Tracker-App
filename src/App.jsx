import React, { useEffect, useMemo, useRef, useState } from 'react'
import SummaryCharts from './components/SummaryCharts'

// Single-file Expense Tracker with theme toggle and animations

const INCOME_CATS = ['Salary', 'Freelance', 'Investment', 'Business', 'Gift', 'Rental', 'Other']
const EXPENSE_CATS = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Healthcare', 'Education', 'EMI', 'Other']

function getColors(isDark) {
  if (isDark) {
    return {
      bg: '#0D0F1C',
      card: '#141728',
      cardAlt: '#111827',
      border: '#252A45',
      text: '#E8EAFF',
      muted: '#7B7F9E',
      green: '#22C55E',
      red: '#EF4444',
      accent: '#8B5CF6',
    }
  }
  return {
    bg: '#F4F6FF',
    card: '#FFFFFF',
    cardAlt: '#FFFFFF',
    border: '#E2E6F0',
    text: '#1A1D2E',
    muted: '#6B7280',
    green: '#22C55E',
    red: '#EF4444',
    accent: '#8B5CF6',
  }
}

const fmt = (n) => `₹${Math.abs(Number(n) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

function useStorage(key) {
  // wrapper around window.storage (async) and localStorage fallback
  const get = async () => {
    try {
      if (window.storage && typeof window.storage.get === 'function') {
        const r = await window.storage.get(key)
        return r?.value ? JSON.parse(r.value) : null
      }
    } catch {}
    try {
      const raw = window.localStorage.getItem(key)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }
  const set = async (value) => {
    try {
      if (window.storage && typeof window.storage.set === 'function') {
        await window.storage.set(key, JSON.stringify(value))
        return
      }
    } catch {}
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {}
  }
  return { get, set }
}

export default function App() {
  const [dark, setDark] = useState(true)
  const colors = useMemo(() => getColors(dark), [dark])

  const storage = useStorage('expense_txns')
  const [txns, setTxns] = useState([])
  const [loaded, setLoaded] = useState(false)

  const [type, setType] = useState('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState(EXPENSE_CATS[0])
  const [desc, setDesc] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  // Month/Year selection and dashboard mode
  const now = new Date()
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1) // 1-12
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [mode, setMode] = useState('all') // 'all' | 'month'

  const [newlyAdded, setNewlyAdded] = useState(null)
  const removingRef = useRef(new Set())

  // inject fonts + keyframes
  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Playfair+Display:wght@600;700&display=swap'
    document.head.appendChild(link)

    const style = document.createElement('style')
    style.innerHTML = `
      :root { --transition: background 0.35s ease, color 0.35s ease, border-color 0.35s ease; }
      @keyframes fadeSlideIn { from { opacity:0; transform: translateY(-12px) } to { opacity:1; transform: translateY(0) } }
      @keyframes fadeSlideOut { from { opacity:1; transform: translateY(0) } to { opacity:0; transform: translateY(-10px) } }
      @keyframes popIn { from{ opacity:0; transform: scale(.85) } to{ opacity:1; transform: scale(1) } }
      @keyframes pulse { 0%{ transform: scale(1) } 50%{ transform: scale(1.04) } 100%{ transform: scale(1) } }
      @keyframes slideToggle { from{ transform: rotate(0deg) } to{ transform: rotate(360deg) } }
      @keyframes shimmer { 0%{ background-position: -200% 0 } 100%{ background-position: 200% 0 } }

      .fadeIn { animation: fadeSlideIn 350ms ease-out both }
      .fadeOut { animation: fadeSlideOut 250ms ease-out both }
      .popIn { animation: popIn 350ms ease-out both }
      .pulse { animation: pulse 650ms ease-out both }
      .spinToggle { animation: slideToggle 400ms ease-in-out both }
      .shimmer { background-image: linear-gradient(90deg, rgba(255,255,255,0.02), rgba(255,255,255,0.06), rgba(255,255,255,0.02)); background-size: 200% 100%; animation: shimmer 600ms linear both }

      .toggle-track { width: 56px; height: 36px; border-radius: 999px; display:inline-flex; align-items:center; justify-content:space-between; padding:6px; box-sizing:border-box }
      .toggle-icon { width:24px; height:24px; display:inline-grid; place-items:center; border-radius:999px }

      .chip-hover:hover{ transform: scale(1.05); transition: transform 150ms }
      .chip-active { transform: scale(1.02) }

      .txn-hover:hover{ transform: translateY(-2px); box-shadow: 0 6px 18px rgba(0,0,0,0.12); transition: transform 160ms, box-shadow 160ms }

    `
    document.head.appendChild(style)

    return () => {
      try { document.head.removeChild(link) } catch {}
      try { document.head.removeChild(style) } catch {}
    }
  }, [])

  // load transactions
  useEffect(() => {
    let mounted = true
    ;(async () => {
      const data = await storage.get()
      if (mounted && Array.isArray(data)) setTxns(data)
      setLoaded(true)
    })()
    return () => { mounted = false }
  }, [])

  // persist
  useEffect(() => {
    if (!loaded) return
    storage.set(txns)
  }, [txns, loaded])

  // All-time totals
  const incomeAll = useMemo(() => txns.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount || 0), 0), [txns])
  const expenseAll = useMemo(() => txns.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount || 0), 0), [txns])

  // Transactions visible according to current mode and selected month/year
  const txnsVisibleByMonth = useMemo(() => {
    return txns.filter((t) => {
      if (!t.date) return true
      const d = new Date(t.date)
      const m = d.getMonth() + 1
      const y = d.getFullYear()
      return m === Number(selectedMonth) && y === Number(selectedYear)
    })
  }, [txns, selectedMonth, selectedYear])

  const income = useMemo(() => (mode === 'all' ? incomeAll : txnsVisibleByMonth.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount || 0), 0)), [mode, incomeAll, txnsVisibleByMonth])
  const expense = useMemo(() => (mode === 'all' ? expenseAll : txnsVisibleByMonth.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount || 0), 0)), [mode, expenseAll, txnsVisibleByMonth])
  const balance = income - expense

  const categories = type === 'income' ? INCOME_CATS : EXPENSE_CATS

  // initial shimmer on stat cards
  const [shimmerDone, setShimmerDone] = useState(false)
  useEffect(() => { const t = setTimeout(() => setShimmerDone(true), 700); return () => clearTimeout(t) }, [])

  // add transaction
  const handleAdd = () => {
    const amt = Number(amount)
    if (!amt || Number.isNaN(amt) || amt <= 0) return
    const tx = { id: Date.now().toString(), type, amount: amt, category, desc: desc.trim() || category, date }
    setTxns((prev) => [tx, ...prev])
    setNewlyAdded(tx.id)
    setAmount('')
    setDesc('')
    // clear newlyAdded after animation
    setTimeout(() => setNewlyAdded(null), 500)
  }

  // delete with animation
  const handleDelete = (id) => {
    removingRef.current.add(id)
    // trigger re-render
    setTxns((prev) => [...prev])
    setTimeout(() => {
      removingRef.current.delete(id)
      setTxns((prev) => prev.filter((t) => t.id !== id))
    }, 260)
  }

  // base list depends on current mode (all vs selected month)
  const baseList = mode === 'all' ? txns : txnsVisibleByMonth

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return baseList
      .filter((t) => filter === 'all' || t.type === filter)
      .filter((t) => !needle || (t.desc || '').toLowerCase().includes(needle) || (t.category || '').toLowerCase().includes(needle))
      .sort((a, b) => (a.date === b.date ? b.id.localeCompare(a.id) : b.date.localeCompare(a.date)))
  }, [baseList, filter, search])

  // theme toggle spin trigger
  const [spinAt, setSpinAt] = useState(0)
  const toggleTheme = () => { setDark((d) => !d); setSpinAt(Date.now()) }

  // style objects
  const S = {
    app: {
      minHeight: '100vh',
      background: colors.bg,
      color: colors.text,
      transition: 'background 0.35s ease, color 0.35s ease',
      fontFamily: "DM Sans, Segoe UI, sans-serif",
      padding: '2rem 1rem'
    },
    container: { maxWidth: 1120, margin: '0 auto' },
    headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 18 },
    headerLeft: {},
    toggleWrap: { display: 'flex', alignItems: 'center', gap: 12 },
    statGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 },
    card: { background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 16, padding: 16, transition: 'background 0.35s ease, border-color 0.35s ease, color 0.35s ease' },
    bigBalance: { fontFamily: 'Playfair Display, serif', fontSize: '2.4rem', margin: 0, color: balance >= 0 ? colors.green : colors.red },
    statAccent: (c) => ({ width: 8, borderRadius: 9999, background: c, marginLeft: 12 }),
    gridCols5: { display: 'grid', gap: 12, gridTemplateColumns: '1fr', marginTop: 12 },
    form: { display: 'grid', gap: 12 },
    input: { width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${colors.border}`, background: colors.cardAlt, color: colors.text, outline: 'none' },
    addBtn: (c) => ({ width: '100%', padding: '12px', borderRadius: 12, border: 'none', background: c, color: '#fff', fontWeight: 700 }),
    txnRow: { display: 'flex', gap: 12, alignItems: 'center', background: colors.cardAlt, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 12 },
    txnIcon: (t) => ({ width: 40, height: 40, borderRadius: 10, display: 'grid', placeItems: 'center', background: t === 'income' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', color: t === 'income' ? colors.green : colors.red }),
    txnAmt: (t) => ({ fontWeight: 700, color: t === 'income' ? colors.green : colors.red }),
    badge: (t) => ({ padding: '4px 10px', borderRadius: 9999, background: t === 'income' ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)', color: t === 'income' ? colors.green : colors.red, fontWeight: 700, fontSize: 12 }),
  }

  // responsive grid columns for wider screens via inline style tweak
  useEffect(() => {
    const m = window.matchMedia('(min-width:1024px)')
    const el = document.documentElement
    const apply = () => {
      const grid = document.querySelector('[data-gridcols]')
      if (!grid) return
      if (m.matches) grid.style.gridTemplateColumns = 'repeat(5, 1fr)'
      else grid.style.gridTemplateColumns = '1fr'
    }
    apply()
    m.addEventListener('change', apply)
    return () => m.removeEventListener('change', apply)
  }, [])

  return (
    <div style={S.app}>
      <div style={S.container}>
        <div style={S.headerRow}>
          <div style={S.headerLeft}>
            <div style={{ color: colors.muted, fontSize: 12, letterSpacing: 2, textTransform: 'uppercase' }}>Financial Dashboard</div>
            <h2 style={S.bigBalance} className={"" + (balance ? 'pulse' : '')} key={balance}>{fmt(balance)}</h2>
            <div style={{ color: colors.muted, fontSize: 13 }}>{balance < 0 ? 'Overspent' : 'Current balance'}</div>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ display: 'inline-flex', gap: 6, background: colors.card, border: `1px solid ${colors.border}`, padding: 6, borderRadius: 10 }}>
              <button onClick={() => setMode('all')} style={{ padding: '8px 10px', borderRadius: 8, border: 'none', background: mode === 'all' ? colors.accent : 'transparent', color: mode === 'all' ? '#fff' : colors.muted }}>All Time</button>
              <button onClick={() => setMode('month')} style={{ padding: '8px 10px', borderRadius: 8, border: 'none', background: mode === 'month' ? colors.accent : 'transparent', color: mode === 'month' ? '#fff' : colors.muted }}>Month</button>
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} style={{ padding: '8px 10px', borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.card, color: colors.text }}>
                {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => (
                  <option key={m} value={i+1}>{m}</option>
                ))}
              </select>
              <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} style={{ padding: '8px 10px', borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.card, color: colors.text }}>
                {Array.from({ length: 7 }).map((_, idx) => {
                  const y = now.getFullYear() - 3 + idx
                  return <option key={y} value={y}>{y}</option>
                })}
              </select>
            </div>
          </div>

          <div style={S.toggleWrap}>
            <div style={{ color: colors.muted, fontSize: 13, marginRight: 8 }}>{/* theme label */}</div>
            </div>
              style={{ display: 'inline-flex', alignItems: 'center' }}
            {/* Charts placed below the summary cards */}
            >
              <div className="toggle-track" style={{ background: colors.card, border: `1px solid ${colors.border}`, transition: 'background 0.35s, border-color 0.35s', padding: 6 }}>
                <div style={{ width: 24 }}></div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div className={`toggle-icon ${!dark && spinAt ? 'spinToggle' : ''}`} style={{ color: dark ? colors.muted : colors.text }}>{dark ? '🌙' : '☀️'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={S.statGrid}>
          <div style={S.card} className={!shimmerDone ? 'shimmer' : ''}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 12, color: colors.muted, textTransform: 'uppercase', letterSpacing: 2 }}>Total Income</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: colors.green }} key={income} className={'popIn'}>{fmt(income)}</div>
                </div>
              </div>
              <div style={S.statAccent(colors.green)} />
            </div>
          </div>

          <div style={S.card} className={!shimmerDone ? 'shimmer' : ''}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 12, color: colors.muted, textTransform: 'uppercase', letterSpacing: 2 }}>Total Expenses</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: colors.red }} key={expense} className={'popIn'}>{fmt(expense)}</div>
                </div>
              </div>
              <div style={S.statAccent(colors.red)} />
            </div>
          </div>
        </div>
        </div>

        {/* Charts placed below the summary cards */}
        <SummaryCharts txns={txns} mode={mode} selectedMonth={selectedMonth} selectedYear={selectedYear} colors={colors} />

        <div data-gridcols style={S.gridCols5}>
          <div style={{ gridColumn: 'span 2' }}>
            <div style={S.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, color: colors.text }}>Add Transaction</div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['income', 'expense'].map((o) => (
                    <button
                      key={o}
                      onClick={() => { setType(o); setCategory(o === 'income' ? INCOME_CATS[0] : EXPENSE_CATS[0]) }}
                      className={`ToggleButton ${type === o ? 'active' : ''} ${o} ${type === o ? 'chip-active' : ''}`}
                      style={{ flex: 1, padding: 10, borderRadius: 10, border: 'none', background: type === o ? (o === 'income' ? 'linear-gradient(135deg,#22C55E,#16A34A)' : 'linear-gradient(135deg,#EF4444,#DC2626)') : 'transparent', color: type === o ? '#fff' : colors.muted }}
                    >
                      {o === 'income' ? '↑ Income' : '↓ Expense'}
                    </button>
                  ))}
                </div>
              </div>

              <div style={S.form}>
                <div>
                  <div style={{ fontSize: 12, color: colors.muted, marginBottom: 6 }}>Amount (₹)</div>
                  <input style={S.input} type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
                </div>

                <div>
                  <div style={{ fontSize: 12, color: colors.muted, marginBottom: 6 }}>Category</div>
                  <select style={S.input} value={category} onChange={(e) => setCategory(e.target.value)}>
                    {(type === 'income' ? INCOME_CATS : EXPENSE_CATS).map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <div style={{ fontSize: 12, color: colors.muted, marginBottom: 6 }}>Description</div>
                  <input style={S.input} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="What was this for?" />
                </div>

                <div>
                  <div style={{ fontSize: 12, color: colors.muted, marginBottom: 6 }}>Date</div>
                  <input style={S.input} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>

                <button style={{ ...S.addBtn(type === 'income' ? 'linear-gradient(135deg,#22C55E,#16A34A)' : 'linear-gradient(135deg,#EF4444,#DC2626)'), transform: 'translateZ(0)' }} onClick={handleAdd} onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.97)'} onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                  + Add {type === 'income' ? 'Income' : 'Expense'}
                </button>
              </div>
            </div>
          </div>

          <div style={{ gridColumn: 'span 3' }}>
            <div style={{ ...S.card }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 18 }}>Transactions</div>
                <div style={{ color: colors.muted }}>{filtered.length} records</div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <input style={S.input} placeholder="Search transactions..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>

              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                {['all', 'income', 'expense'].map((o) => (
                  <button key={o} onClick={() => setFilter(o)} className={`Chip ${filter === o ? 'active' : ''} chip-hover`} style={{ padding: '8px 12px', borderRadius: 9999, border: `1px solid ${colors.border}`, background: filter === o ? 'rgba(139,92,246,0.08)' : 'transparent', color: filter === o ? colors.accent : colors.muted }}>{o === 'all' ? 'All' : o === 'income' ? '↑ Income' : '↓ Expense'}</button>
                ))}
              </div>

              <div style={{ display: 'grid', gap: 10 }}>
                {filtered.length === 0 ? (
                  <div style={{ textAlign: 'center', color: colors.muted, padding: '2rem 0' }}>No transactions yet — add one above.</div>
                ) : (
                  filtered.map((t) => {
                    const isRemoving = removingRef.current.has(t.id)
                    const isNew = newlyAdded === t.id
                    return (
                      <div key={t.id} style={{ ...S.txnRow, opacity: isRemoving ? 0 : 1 }} className={`${isRemoving ? 'fadeOut' : isNew ? 'fadeIn' : ''} txn-hover`}>
                        <div style={S.txnIcon(t.type)}>{t.type === 'income' ? '↑' : '↓'}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.desc}</div>
                          <div style={{ marginTop: 6 }}>
                            <span style={S.badge(t.type)}>{t.category}</span>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', minWidth: 110 }}>
                          <div style={S.txnAmt(t.type)}>{t.type === 'income' ? '+' : '−'}{fmt(t.amount)}</div>
                          <div style={{ color: colors.muted, fontSize: 12 }}>{t.date}</div>
                        </div>
                        <button onClick={() => handleDelete(t.id)} style={{ marginLeft: 8, background: 'none', border: 'none', color: colors.muted, fontSize: 18, cursor: 'pointer' }} aria-label="Delete">×</button>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
