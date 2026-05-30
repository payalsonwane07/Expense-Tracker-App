import { useMemo } from 'react'
import { useTransactions } from '../hooks/useTransactions'

function formatINR(value) {
  const n = Number(value ?? 0)
  const safe = Number.isFinite(n) ? n : 0
  return `₹${safe.toFixed(2)}`
}

function Card({ label, value, valueClassName, accentClassName }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-600">{label}</p>
          <p className={`mt-2 text-2xl font-semibold ${valueClassName}`}>{value}</p>
        </div>
        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${accentClassName}`} />
      </div>
    </div>
  )
}

export default function SummaryCards() {
  const { totalIncome, totalExpense, balance } = useTransactions()

  const balanceIsNegative = balance < 0
  const formatted = useMemo(() => {
    return {
      income: formatINR(totalIncome),
      expense: formatINR(totalExpense),
      balance: formatINR(balance),
    }
  }, [balance, totalExpense, totalIncome])

  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
      <Card
        label="Total Income"
        value={formatted.income}
        valueClassName="text-emerald-700"
        accentClassName="bg-emerald-500"
      />
      <Card
        label="Total Expenses"
        value={formatted.expense}
        valueClassName="text-rose-700"
        accentClassName="bg-rose-500"
      />
      <Card
        label="Current Balance"
        value={formatted.balance}
        valueClassName={balanceIsNegative ? 'text-rose-700' : 'text-violet-700'}
        accentClassName="bg-violet-500"
      />
    </section>
  )
}

