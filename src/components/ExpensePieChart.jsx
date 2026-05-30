import { useMemo } from 'react'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'
import { useTransactions } from '../hooks/useTransactions'

ChartJS.register(ArcElement, Tooltip, Legend)

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#0ea5e9', '#8b5cf6', '#ec4899']

export default function ExpensePieChart() {
  const { transactions } = useTransactions()

  const chartData = useMemo(() => {
    const expensesByCategory = {}
    for (const tx of transactions) {
      if (tx.type === 'expense') {
        if (!expensesByCategory[tx.category]) {
          expensesByCategory[tx.category] = 0
        }
        expensesByCategory[tx.category] += tx.amount
      }
    }

    const labels = Object.keys(expensesByCategory)
    const data = Object.values(expensesByCategory)

    if (labels.length === 0) {
      return null
    }

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: labels.map((_, idx) => COLORS[idx % COLORS.length]),
          borderColor: '#fff',
          borderWidth: 2,
        },
      ],
    }
  }, [transactions])

  if (!chartData) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-8">
        <div className="flex items-center justify-center">
          <p className="text-slate-500">No expenses yet</p>
        </div>
      </section>
    )
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <h2 className="mb-4 text-base font-semibold text-slate-900">Expenses by Category</h2>
      <div className="flex justify-center">
        <div className="w-full max-w-xs">
          <Doughnut
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: true,
              plugins: {
                legend: {
                  position: 'bottom',
                  labels: {
                    font: {
                      size: 12,
                    },
                    padding: 12,
                  },
                },
                tooltip: {
                  callbacks: {
                    label: function (context) {
                      return `₹${context.parsed}`
                    },
                  },
                },
              },
            }}
          />
        </div>
      </div>
    </section>
  )
}
