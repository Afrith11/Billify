import { contextBridge, ipcRenderer } from 'electron'

console.log('✅ Preload Loaded')

// Custom APIs for renderer
const api = {
  // Items
  getItems: () => ipcRenderer.invoke('get-items'),
  addItem: (item) => ipcRenderer.invoke('add-item', item),
  updateItem: (item) => ipcRenderer.invoke('update-item', item),
  deleteItem: (id) => ipcRenderer.invoke('delete-item', id),

  // Customers
  getCustomers: () => ipcRenderer.invoke('get-customers'),
  addCustomer: (customer) => ipcRenderer.invoke('add-customer', customer),
  updateCustomer: (customer) => ipcRenderer.invoke('update-customer', customer),
  deleteCustomer: (id) => ipcRenderer.invoke('delete-customer', id),

  // Invoices
  getInvoices: (filters) => ipcRenderer.invoke('get-invoices', filters),
  getInvoiceById: (id) => ipcRenderer.invoke('get-invoice-by-id', id),
  getInvoiceItems: (invoiceId) => ipcRenderer.invoke('get-invoice-items', invoiceId),
  getInvoiceReturns: (invoiceId) => ipcRenderer.invoke('get-invoice-returns', invoiceId),
  createInvoice: (invoice) => ipcRenderer.invoke('create-invoice', invoice),
  deleteInvoice: (id) => ipcRenderer.invoke('delete-invoice', id),
  getNextInvoiceNumber: () => ipcRenderer.invoke('get-next-invoice-number'),
  
  // Payments
  getPayments: (filters) => ipcRenderer.invoke('get-payments', filters),
  receivePayment: (payment) => ipcRenderer.invoke('receive-payment', payment),

  // Accounting & Returns
  getSalesReturns: (filters) => ipcRenderer.invoke('get-sales-returns', filters),
  createSalesReturn: (data) => ipcRenderer.invoke('create-sales-return', data),
  getReceivablesReport: () => ipcRenderer.invoke('get-receivables-report'),
  getPayablesReport: () => ipcRenderer.invoke('get-payables-report'),
  getAdvancedSalesReport: (filters) => ipcRenderer.invoke('get-advanced-sales-report', filters),
  getReceiptStatements: (filters) => ipcRenderer.invoke('get-receipt-statements', filters),
  updateExpenseStatus: (data) => ipcRenderer.invoke('update-expense-status', data),
  addExpense: (expense) => ipcRenderer.invoke('add-expense', expense),
  getLedgerReport: (customerId) => ipcRenderer.invoke('get-ledger-report', customerId),
  getDaybook: (filters) => ipcRenderer.invoke('get-daybook', filters),
  getDashboardStats: () => ipcRenderer.invoke('get-dashboard-stats'),
  getSalesAnalytics: (filters) => ipcRenderer.invoke('get-sales-analytics', filters),
  getPurchaseReturns: (filters) => ipcRenderer.invoke('get-purchase-returns', filters),
  createPurchaseReturn: (data) => ipcRenderer.invoke('create-purchase-return', data),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  updateSettings: (settings) => ipcRenderer.invoke('update-settings', settings),
  uploadLogo: (data) => ipcRenderer.invoke('upload-logo', data),
  exportDatabase: () => ipcRenderer.invoke('export-database'),
  checkAuthStatus: () => ipcRenderer.invoke('check-auth-status'),
  createAdmin: (data) => ipcRenderer.invoke('create-admin', data),
  login: (data) => ipcRenderer.invoke('login', data),
  changePassword: (data) => ipcRenderer.invoke('change-password', data),
  toggleAuth: (enabled) => ipcRenderer.invoke('toggle-auth', enabled),
  getUsers: () => ipcRenderer.invoke('get-users'),
  addUser: (data) => ipcRenderer.invoke('add-user', data),
  updateUser: (data) => ipcRenderer.invoke('update-user', data),
  deleteUser: (id) => ipcRenderer.invoke('delete-user', id),
  toggleUserStatus: (data) => ipcRenderer.invoke('toggle-user-status', data),
  test: () => 'API working',
}

// Ensure window.api is exposed
try {
  contextBridge.exposeInMainWorld('api', api)
} catch (error) {
  console.error('Failed to expose APIs:', error)
}
