import { create } from 'zustand';

const useStore = create((set) => ({
  activePage: 'dashboard',
  setActivePage: (page) => set({ activePage: page }),
  
  isAuthenticated: false,
  user: null,
  setAuth: (user) => set({ isAuthenticated: true, user }),
  logout: () => set({ isAuthenticated: false, user: null }),
  
  selectedItem: null,
  setSelectedItem: (item) => set({ selectedItem: item }),
  
  items: [],
  customers: [],
  invoices: [],
  payments: [],
  daybook: [],
  receivables: [],
  payables: [],
  salesReturns: [],
  receipts: [],
  advancedSales: [],
  users: [],

  // Dashboard stats
  stats: {
    todaySales: 0,
    monthlySales: 0,
    totalCustomers: 0,
    totalReceivable: 0,
    totalPayable: 0,
    totalRevenue: 0,
    netProfit: 0,
    recentInvoices: []
  },
  setStats: (stats) => set({ stats }),

  // Refresh methods
  refreshItems: async () => {
    const items = await window.api.getItems();
    set({ items });
  },
  refreshCustomers: async () => {
    const customers = await window.api.getCustomers();
    set({ customers });
  },
  refreshInvoices: async (filters) => {
    const invoices = await window.api.getInvoices(filters);
    set({ invoices });
  },
  refreshPayments: async (filters) => {
    const payments = await window.api.getPayments(filters);
    set({ payments });
  },
  refreshDaybook: async (filters) => {
    const daybook = await window.api.getDaybook({ from: filters.fromDate, to: filters.toDate });
    set({ daybook });
  },
  refreshDashboard: async () => {
    const stats = await window.api.getDashboardStats();
    set({ stats });
  },
  refreshReceivables: async () => {
    const receivables = await window.api.getReceivablesReport();
    set({ receivables });
  },
  refreshPayables: async () => {
    const payables = await window.api.getPayablesReport();
    set({ payables });
  },
  purchaseReturns: [],
  refreshSalesReturns: async (filters) => {
    const salesReturns = await window.api.getSalesReturns(filters);
    set({ salesReturns });
  },
  refreshPurchaseReturns: async (filters) => {
    const purchaseReturns = await window.api.getPurchaseReturns(filters);
    set({ purchaseReturns });
  },
  refreshReceipts: async (filters) => {
    const receipts = await window.api.getReceiptStatements(filters);
    set({ receipts });
  },
  refreshAdvancedSales: async (filters) => {
    const advancedSales = await window.api.getAdvancedSalesReport(filters);
    set({ advancedSales });
  },
  refreshUsers: async () => {
    const users = await window.api.getUsers();
    set({ users });
  },
  
  settings: null,
  refreshSettings: async () => {
    const settings = await window.api.getSettings();
    set({ settings });
  },

  // Notification system
  notification: { message: '', type: 'success', visible: false },
  showNotification: (message, type = 'success') => {
    set({ notification: { message, type, visible: true } });
    setTimeout(() => {
      set({ notification: { message: '', type: 'success', visible: false } });
    }, 4000); // Higher duration for readability
  },
  hideNotification: () => set({ notification: { message: '', type: 'success', visible: false } })
}));

export default useStore;
