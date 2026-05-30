import { useEffect, useMemo, useState } from 'react'
import { useTransactions } from '../hooks/useTransactions'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function toAmountNumber(value) {
  const n = typeof value === 'number' ? value : Number(String(value).replace(/,/g, ''))
  if (!Number.isFinite(n)) return 0
  return Math.round(n * 100) / 100
}

export default function TransactionForm() {
  const { addTransaction, EXPENSE_CATEGORIES, INCOME_CATEGORIES } = useTransactions()

  const [type, setType] = useState('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0] ?? 'Other')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(todayISO())

  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState(false)

  const categories = useMemo(() => {
    return type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
  }, [EXPENSE_CATEGORIES, INCOME_CATEGORIES, type])

  useEffect(() => {
    // Keep selected category valid when toggling type.
    if (!categories.includes(category)) {
      setCategory(categories[0] ?? 'Other')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type])

  useEffect(() => {
    if (!success) return
    const t = setTimeout(() => setSuccess(false), 2000)
    return () => clearTimeout(t)
  }, [success])

  function validate(next) {
    const nextErrors = {}

    const amt = toAmountNumber(next.amount)
    if (!(amt > 0)) nextErrors.amount = 'Amount must be greater than 0.'

    if (!String(next.description).trim()) {
      nextErrors.description = 'Description is required.'
    }

    return nextErrors
  }

  function resetForm() {
    setType('expense')
    setAmount('')
    setCategory(EXPENSE_CATEGORIES[0] ?? 'Other')
    setDescription('')
    setDate(todayISO())
    setErrors({})
  }

  function onSubmit(e) {
    e.preventDefault()
    setSuccess(false)

    const payload = {
      type,
      amount,
      category,
      description,
      date,
    }

    const nextErrors = validate(payload)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    addTransaction({
      type,
      amount: toAmountNumber(amount),
      category,
      description: String(description).trim(),
      date,
    })

    resetForm()
    setSuccess(true)
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-slate-900">Add transaction</h2>
        {success ? (
          <p className="rounded-lg bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
            Added successfully.
          </p>
        ) : null}
      </div>

      <form onSubmit={onSubmit} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <p className="text-sm font-medium text-slate-700">Type</p>
          <div className="mt-2 inline-flex overflow-hidden rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setType('income')}
              className={`px-3 py-2 text-sm font-medium ${
                type === 'income'
                  ? 'bg-emerald-50 text-emerald-800'
                  : 'bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              Income
            </button>
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`px-3 py-2 text-sm font-medium ${
                type === 'expense'
                  ? 'bg-rose-50 text-rose-800'
                  : 'bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              Expense
            </button>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">
            Amount
            <input
              type="number"
              inputMode="decimal"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={`mt-2 w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none ${
                errors.amount ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-violet-400'
              }`}
              placeholder="0.00"
            />
          </label>
          {errors.amount ? <p className="mt-1 text-sm text-rose-600">{errors.amount}</p> : null}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">
            Category
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-violet-400"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="sm:col-span-2">
          <label className="text-sm font-medium text-slate-700">
            Description
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`mt-2 w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none ${
                errors.description
                  ? 'border-rose-400 focus:border-rose-500'
                  : 'border-slate-200 focus:border-violet-400'
              }`}
              placeholder="e.g. Grocery, Uber, Salary..."
            />
          </label>
          {errors.description ? (
            <p className="mt-1 text-sm text-rose-600">{errors.description}</p>
          ) : null}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">
            Date
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-violet-400"
            />
          </label>
        </div>

        <div className="flex items-end sm:justify-end">
          <button
            type="submit"
            className="w-full rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 sm:w-auto"
          >
            Add transaction
          </button>
        </div>
      </form>
    </section>
  )
}

