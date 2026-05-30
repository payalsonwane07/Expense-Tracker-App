import { useMemo, useState } from 'react'
import { useTransactions } from '../hooks/useTransactions'

function formatDate(isoDate) {
  const date = new Date(isoDate + 'T00:00:00')
  const day = String(date.getDate()).padStart(2, '0')
  const month = date.toLocaleString('en-US', { month: 'short' })
  return `${day} ${month}`
}

function getCategoryColor(category) {
  const colors = {
    Food: 'bg-orange-100 text-orange-800',
    Transport: 'bg-blue-100 text-blue-800',
    Housing: 'bg-purple-100 text-purple-800',
    Entertainment: 'bg-pink-100 text-pink-800',
    Health: 'bg-red-100 text-red-800',
    Shopping: 'bg-green-100 text-green-800',
    Other: 'bg-gray-100 text-gray-800',
    Salary: 'bg-emerald-100 text-emerald-800',
    Freelance: 'bg-cyan-100 text-cyan-800',
    Investment: 'bg-indigo-100 text-indigo-800',
    Gift: 'bg-yellow-100 text-yellow-800',
  }
  return colors[category] || 'bg-gray-100 text-gray-800'
}

export default function TransactionList() {
  const { transactions, deleteTransaction } = useTransactions()
  const [searchTerm, setSearchTerm] = useState('')

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) =>
      tx.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [transactions, searchTerm])

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <h2 className="mb-4 text-base font-semibold text-slate-900">Transactions</h2>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
      </div>

      <p className="mb-4 text-xs text-slate-500">
        Showing {filteredTransactions.length} of {transactions.length} transactions
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="px-3 py-2 text-left font-medium text-slate-600">Date</th>
              <th className="px-3 py-2 text-left font-medium text-slate-600">Description</th>
              <th className="px-3 py-2 text-left font-medium text-slate-600">Category</th>
              <th className="px-3 py-2 text-right font-medium text-slate-600">Amount</th>
              <th className="px-3 py-2 text-center font-medium text-slate-600">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-8 text-center text-slate-500">
                  No transactions found
                </td>
              </tr>
            ) : (
              filteredTransactions.map((tx) => (
                <tr key={tx.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-3 text-slate-700">{formatDate(tx.date)}</td>
                  <td className="px-3 py-3 text-slate-700">{tx.description}</td>
                  <td className="px-3 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${getCategoryColor(tx.category)}`}>
                      {tx.category}
                    </span>
                  </td>
                  <td className={`px-3 py-3 text-right font-semibold ${tx.type === 'income' ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {tx.type === 'income' ? '+' : '-'}₹{tx.amount.toFixed(2)}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <button
                      onClick={() => deleteTransaction(tx.id)}
                      className="inline-flex items-center justify-center rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                      title="Delete transaction"
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
