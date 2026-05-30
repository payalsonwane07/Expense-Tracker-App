import { useEffect, useMemo, useState } from 'react'

const INCOME_CATS = ['Salary', 'Freelance', 'Investment', 'Business', 'Gift', 'Rental', 'Other']
const EXPENSE_CATS = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Healthcare', 'Education', 'EMI', 'Other']

const COLORS = {
  bg: '#0D0F1C',
  card: '#111827',
  cardAlt: '#141828',
  border: '#252A45',
  text: '#E8EAFF',
  muted: '#8B93B5',
  green: '#22C55E',
  red: '#EF4444',
  purple: '#8B5CF6',
}

const formatAmount = (value) =>
  `₹${Math.abs(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

function Badge({ cat, type }) {
  return (
    <span className={`TransactionBadge ${type}`}>
      {cat}
    </span>
  )
}

function useLocalStorageTransactions() {
  const [transactions, setTransactions] = useState([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const raw = window.localStorage.getItem('expense_txns')
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          setTransactions(parsed)
        }
      } catch {
        // ignore invalid data
      }
    }
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (!loaded) return
    window.localStorage.setItem('expense_txns', JSON.stringify(transactions))
  }, [transactions, loaded])

  return [transactions, setTransactions]
}

export default function App() {
  const [txns, setTxns] = useLocalStorageTransactions()
  const [type, setType] = useState('income')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Salary')
  const [desc, setDesc] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const income = useMemo(
    () => txns.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
    [txns]
  )
  const expense = useMemo(
    () => txns.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
    [txns]
  )
  const balance = income - expense

  const categories = type === 'income' ? INCOME_CATS : EXPENSE_CATS

  const handleAdd = () => {
    const amt = parseFloat(amount)
    if (!amt || Number.isNaN(amt) || amt <= 0) return

    setTxns([
      {
        id: Date.now(),
        type,
        amount: amt,
        category,
        desc: desc.trim() || category,
        date,
      },
      ...txns,
    ])
    setAmount('')
    setDesc('')
  }

  const filtered = useMemo(() => {
    return txns
      .filter((txn) => filter === 'all' || txn.type === filter)
      .filter((txn) => {
        const needle = search.toLowerCase()
        return (
          txn.desc.toLowerCase().includes(needle) ||
          txn.category.toLowerCase().includes(needle)
        )
      })
      .sort((a, b) => (a.date === b.date ? b.id - a.id : b.date.localeCompare(a.date)))
  }, [txns, filter, search])

  return (
    <div className="AppShell">
      <div className="PageContainer">
        <div className="SectionGrid">
          <div className="Card">
            <p className="TextMuted">Financial Dashboard</p>
            <h1 className="Heading HeadingBalance">{formatAmount(balance)}</h1>
            <p className="TextMuted">Current Balance {balance < 0 ? '⚠ overspent' : ''}</p>
          </div>

          <div className="GridTwo cols-2">
            <div className="StatCard">
              <div>
                <p className="StatLabel">Total Income</p>
                <p className="StatValue" style={{ color: COLORS.green }}>{formatAmount(income)}</p>
              </div>
              <div className="StatAccent green" />
            </div>
            <div className="StatCard">
              <div>
                <p className="StatLabel">Total Expenses</p>
                <p className="StatValue" style={{ color: COLORS.red }}>{formatAmount(expense)}</p>
              </div>
              <div className="StatAccent red" />
            </div>
          </div>
        </div>

        <div className="SectionGrid columns-5" style={{ marginTop: '1.5rem' }}>
          <div className="Card" style={{ gridColumn: 'span 2' }}>
            <h2 className="Heading HeadingSection">Add Transaction</h2>
            <div className="ToggleGroup">
              {['income', 'expense'].map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`ToggleButton ${option} ${type === option ? 'active' : ''}`}
                  onClick={() => {
                    setType(option)
                    setCategory(option === 'income' ? 'Salary' : 'Food')
                  }}
                >
                  {option === 'income' ? '↑ Income' : '↓ Expense'}
                </button>
              ))}
            </div>

            <div className="TrackerForm">
              <div>
                <label className="TextMuted">Amount (₹)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                />
              </div>

              <div>
                <label className="TextMuted">Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="TextMuted">Description</label>
                <input
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="What was this for?"
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                />
              </div>

              <div>
                <label className="TextMuted">Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>

              <button
                type="button"
                className={`ButtonPrimary ${type}`}
                onClick={handleAdd}
              >
                + Add {type === 'income' ? 'Income' : 'Expense'}
              </button>
            </div>
          </div>

          <div className="Card" style={{ gridColumn: 'span 3' }}>
            <div className="TransactionHeader">
              <h2 className="Heading HeadingSection">Transactions</h2>
              <span className="TextMuted">{filtered.length} records</span>
            </div>

            <div className="TransactionSearch">
              <input
                placeholder="Search transactions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="ChipRow">
              {['all', 'income', 'expense'].map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`Chip ${filter === option ? 'active' : ''}`}
                  onClick={() => setFilter(option)}
                >
                  {option === 'all' ? 'All' : option === 'income' ? '↑ Income' : '↓ Expense'}
                </button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div className="EmptyState">
                <p style={{ fontSize: 32, marginBottom: 8 }}>💸</p>
                <p>No transactions yet. Add one above!</p>
              </div>
            ) : (
              filtered.map((txn) => (
                <div key={txn.id} className="TransactionRow">
                  <div style={{ width: 40, height: 40, borderRadius: 14, display: 'grid', placeItems: 'center', background: txn.type === 'income' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', color: txn.type === 'income' ? COLORS.green : COLORS.red }}>
                    {txn.type === 'income' ? '↑' : '↓'}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="TransactionText">{txn.desc || txn.category}</p>
                    <div className="TransactionMeta">
                      <Badge cat={txn.category} type={txn.type} />
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', minWidth: 110 }}>
                    <p className={`TransactionAmount ${txn.type}`}>
                      {txn.type === 'income' ? '+' : '−'}{formatAmount(txn.amount)}
                    </p>
                    <p className="txn-date">{txn.date}</p>
                  </div>

                  <button
                    type="button"
                    className="DeleteButton"
                    onClick={() => setTxns(txns.filter((item) => item.id !== txn.id))}
                    aria-label="Delete transaction"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
