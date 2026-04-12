import useStore from './store/useStore'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Items from './pages/Items'
import Customers from './pages/Customers'
import DayBook from './pages/DayBook'
import Payments from './pages/Payments'
import Reports from './pages/Reports'

function App() {
  const { activePage } = useStore()

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <Dashboard />
      case 'items': return <Items />
      case 'customers': return <Customers />
      case 'daybook': return <DayBook />
      case 'payments': return <Payments />
      case 'reports': return <Reports />
      default: return <Dashboard />
    }
  }

  const getPageTitle = () => {
    switch (activePage) {
      case 'dashboard': return 'Dashboard Overview'
      case 'items': return 'Product Matrix'
      case 'customers': return 'Customer Ledger'
      case 'daybook': return 'Journal (Day Book)'
      case 'payments': return 'Payment Statements'
      case 'reports': return 'Financial Reports'
      default: return 'Dashboard'
    }
  }

  return (
    <Layout title={getPageTitle()}>
      {renderPage()}
    </Layout>
  )
}

export default App
