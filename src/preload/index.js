import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

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

  // Bills
  getBills: (filters) => ipcRenderer.invoke('get-bills', filters),
  createBill: (bill) => ipcRenderer.invoke('create-bill', bill),
  getBillDetails: (billId) => ipcRenderer.invoke('get-bill-details', billId),

  // Reports
  getLedgerReport: (customerId) => ipcRenderer.invoke('get-ledger-report', customerId),
  getDashboardStats: () => ipcRenderer.invoke('get-dashboard-stats'),
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
