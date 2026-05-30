import { useTransactions } from './hooks/useTransactions'
import SummaryCards from './components/SummaryCards'
import TransactionForm from './components/TransactionForm'
import ExpensePieChart from './components/ExpensePieChart'
import TransactionList from './components/TransactionList'

function App() {
  useTransactions()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl p-8">
        {/* Row 1: Summary Cards */}
        <div className="mb-8">
          <SummaryCards />
        </div>

        {/* Row 2: Form and Chart */}
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <TransactionForm />
          </div>
          <div className="lg:col-span-3">
            <ExpensePieChart />
          </div>
        </div>

        {/* Row 3: Transaction List */}
        <div>
          <TransactionList />
        </div>
      </div>
    </div>
  )
}

export default App
