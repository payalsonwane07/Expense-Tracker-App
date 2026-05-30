import { useCallback, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'expense-tracker-data'

export const EXPENSE_CATEGORIES = [
  'Food',
  'Transport',
  'Housing',
  'Entertainment',
  'Health',
  'Shopping',
  'Other',
]

export const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Investment', 'Gift', 'Other']

function safeParse(json) {
  try {
    return JSON.parse(json)
  } catch {
    return null
  }
}

function toISODate(value) {
  // Accept either YYYY-MM-DD or Date; fallback to today.
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10)
  }
  const s = String(value ?? '').slice(0, 10)
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  return new Date().toISOString().slice(0, 10)
}

function toAmountNumber(value) {
  const n = typeof value === 'number' ? value : Number(String(value).replace(/,/g, ''))
  if (!Number.isFinite(n)) return 0
  return Math.round(n * 100) / 100
}

function normalizeTx(raw) {
  if (!raw || typeof raw !== 'object') return null

  const type = raw.type === 'income' || raw.type === 'expense' ? raw.type : null
  if (!type) return null

  const amount = toAmountNumber(raw.amount)
  if (amount <= 0) return null

  const date = toISODate(raw.date)
  const category = String(raw.category ?? '').trim()
  const description = String(raw.description ?? '').trim()

  const allowedCategories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
  const normalizedCategory = allowedCategories.includes(category)
    ? category
    : allowedCategories[allowedCategories.length - 1]

  return {
    id: String(raw.id ?? crypto.randomUUID()),
    type,
    amount,
    category: normalizedCategory,
    description,
    date,
  }
}

function sortNewestFirst(a, b) {
  // date desc (YYYY-MM-DD sorts lexicographically), then stable by id
  if (a.date !== b.date) return a.date > b.date ? -1 : 1
  return a.id > b.id ? -1 : a.id < b.id ? 1 : 0
}

export function useTransactions() {
  const [transactions, setTransactions] = useState([])

  // Load initial data once.
  useEffect(() => {
    const raw = safeParse(localStorage.getItem(STORAGE_KEY) ?? 'null')
    if (!Array.isArray(raw)) return

    const normalized = raw.map(normalizeTx).filter(Boolean).sort(sortNewestFirst)
    setTransactions(normalized)
  }, [])

  // Persist on every change.
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions))
  }, [transactions])

  const addTransaction = useCallback((input) => {
    const tx = normalizeTx(input)
    if (!tx) return
    setTransactions((prev) => [tx, ...prev].sort(sortNewestFirst))
  }, [])

  const deleteTransaction = useCallback((id) => {
    const key = String(id)
    setTransactions((prev) => prev.filter((t) => t.id !== key))
  }, [])

  const totalIncome = useMemo(() => {
    let total = 0
    for (const t of transactions) {
      if (t.type === 'income') total += t.amount
    }
    return Math.round(total * 100) / 100
  }, [transactions])

  const totalExpense = useMemo(() => {
    let total = 0
    for (const t of transactions) {
      if (t.type === 'expense') total += t.amount
    }
    return Math.round(total * 100) / 100
  }, [transactions])

  const balance = useMemo(() => {
    return Math.round((totalIncome - totalExpense) * 100) / 100
  }, [totalIncome, totalExpense])

  return {
    transactions,
    addTransaction,
    deleteTransaction,
    totalIncome,
    totalExpense,
    balance,
    EXPENSE_CATEGORIES,
    INCOME_CATEGORIES,
  }
}

