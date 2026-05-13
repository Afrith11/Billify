import { useEffect } from 'react'
import useStore from './store/useStore'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Items from './pages/Items'
import ItemDetails from './pages/ItemDetails'
import Customers from './pages/Customers'
import DayBook from './pages/DayBook'
import Payments from './pages/Payments'
import Reports from './pages/Reports'
import Returns from './pages/Returns'
import Settings from './pages/Settings'
import PaidStatement from './pages/PaidStatement'
import ReceiptStatement from './pages/ReceiptStatement'
import ReceivableReport from './pages/ReceivableReport'
import PayableReport from './pages/PayableReport'
import SalesReport from './pages/SalesReport'
import InvoiceDetails from './pages/InvoiceDetails'
import Toast from './components/Toast'
import AuthPage from './pages/AuthPage'
import ErrorBoundary from './components/ErrorBoundary'

function App() {
  const { activePage, refreshItems, refreshCustomers, refreshSettings, isAuthenticated } = useStore()
  
  useEffect(() => {
    if (isAuthenticated) {
      refreshItems()
      refreshCustomers()
      refreshSettings()
    }
  }, [isAuthenticated])

  const renderPage = () => {
    try {
      switch (activePage) {
        case 'dashboard': return <Dashboard />
        case 'items': return <Items />
        case 'item-details': return <ItemDetails />
        case 'customers': return <Customers />
        case 'daybook': return <DayBook />
        case 'payments': return <Payments />
        case 'reports': return <Reports />
        case 'returns': return <Returns />
        case 'settings': 
        case 'settings-profile': return <Settings section="profile" />
        case 'settings-security': return <Settings section="security" />
        case 'settings-backup': return <Settings section="backup" />
        case 'paid-statement': return <PaidStatement />
        case 'receipt-statement': return <ReceiptStatement />
        case 'receivable-report': return <ReceivableReport />
        case 'payable-report': return <PayableReport />
        case 'sales-report': return <SalesReport />
        case 'invoice-details': return <InvoiceDetails />
        default: return <Dashboard />
      }
    } catch (err) {
      return (
        <div className="card" style={{ margin: '2rem', padding: '2rem', borderColor: 'var(--error)' }}>
          <h2 style={{ color: 'var(--error)' }}>Rendering Error</h2>
          <p>{err.message}</p>
        </div>
      )
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
      case 'returns': return 'Sales & Purchase Returns'
      case 'settings':
      case 'settings-profile': return 'Business Profile'
      case 'settings-security': return 'Security Settings'
      case 'settings-backup': return 'Backup & Sync'
      case 'paid-statement': return 'Customer Paid Statement'
      case 'receipt-statement': return 'Cash Inflow (Receipts)'
      case 'receivable-report': return 'Receivables Aging Report'
      case 'payable-report': return 'Payables (Business Expenses)'
      case 'sales-report': return 'Advanced Sales Insights'
      case 'invoice-details': return 'Invoice View'
      default: return 'Dashboard'
    }
  }

  if (!isAuthenticated) {
    return (
      <>
        <Toast />
        <AuthPage />
      </>
    )
  }

  return (
    <Layout title={getPageTitle()}>
      <Toast />
      <ErrorBoundary>
        {renderPage()}
      </ErrorBoundary>
    </Layout>
  )
}

export default App
