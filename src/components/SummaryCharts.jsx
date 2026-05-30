import React, { useMemo } from 'react'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts'

function monthKey(d) {
  const dt = new Date(d)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`
}

function buildLastNMonths(endMonth, endYear, n = 12) {
  const res = []
  let m = endMonth - 1
  let y = endYear
  for (let i = 0; i < n; i++) {
    res.unshift({ month: m + 1, year: y })
    m -= 1
    if (m < 0) { m = 11; y -= 1 }
  }
  return res
}

const COLORS = ['#8B5CF6', '#06B6D4', '#F97316', '#10B981', '#EF4444', '#F59E0B']

export default function SummaryCharts({ txns = [], mode = 'all', selectedMonth, selectedYear, colors }) {
  // Pie data depends on mode (all vs selected month)
  const txnsVisible = useMemo(() => {
    if (mode === 'all') return txns
    return txns.filter((t) => {
      if (!t.date) return false
      const d = new Date(t.date)
      return d.getMonth() + 1 === Number(selectedMonth) && d.getFullYear() === Number(selectedYear)
    })
  }, [txns, mode, selectedMonth, selectedYear])

  const totals = useMemo(() => {
    const income = txnsVisible.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount || 0), 0)
    const expense = txnsVisible.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount || 0), 0)
    return { income, expense }
  }, [txnsVisible])

  const pieData = useMemo(() => [
    { name: 'Income', value: totals.income },
    { name: 'Expenses', value: totals.expense },
  ], [totals])

  // Build monthly aggregates for bar chart (last 12 months ending at selected month/year)
  const monthlyData = useMemo(() => {
    const endM = Number(selectedMonth) || (new Date().getMonth() + 1)
    const endY = Number(selectedYear) || new Date().getFullYear()
    const months = buildLastNMonths(endM, endY, 12)
    const map = {}
    months.forEach((m) => { map[`${m.year}-${String(m.month).padStart(2, '0')}`] = { month: `${m.month}/${String(m.year).slice(-2)}`, income: 0, expense: 0 } })
    txns.forEach((t) => {
      if (!t.date) return
      const k = monthKey(t.date)
      if (!map[k]) return
      if (t.type === 'income') map[k].income += Number(t.amount || 0)
      if (t.type === 'expense') map[k].expense += Number(t.amount || 0)
    })
    return Object.values(map)
  }, [txns, selectedMonth, selectedYear])

  const hasData = txns && txns.length > 0

  return (
    <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr', marginTop: 16 }}>
      <div style={{ background: colors.card, border: `1px solid ${colors.border}`, padding: 12, borderRadius: 12 }}>
        <div style={{ fontSize: 14, color: colors.muted, marginBottom: 8 }}>Overview</div>
        {!hasData ? (
          <div style={{ padding: 40, textAlign: 'center', color: colors.muted }}>No data available</div>
        ) : (
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={6}>
                  {pieData.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => `₹${v.toLocaleString('en-IN')}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div style={{ background: colors.card, border: `1px solid ${colors.border}`, padding: 12, borderRadius: 12 }}>
        <div style={{ fontSize: 14, color: colors.muted, marginBottom: 8 }}>Monthly (last 12 months)</div>
        {!hasData ? (
          <div style={{ padding: 40, textAlign: 'center', color: colors.muted }}>No data available</div>
        ) : (
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={monthlyData} margin={{ top: 10, right: 8, left: -12, bottom: 6 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                <XAxis dataKey="month" stroke={colors.muted} />
                <YAxis stroke={colors.muted} />
                <Tooltip formatter={(v) => `₹${v.toLocaleString('en-IN')}`} />
                <Legend />
                <Bar dataKey="income" fill="#10B981" />
                <Bar dataKey="expense" fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
