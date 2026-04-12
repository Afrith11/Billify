import { create } from 'zustand';

const useStore = create((set) => ({
  activePage: 'dashboard',
  setActivePage: (page) => set({ activePage: page }),
  
  items: [],
  setItems: (items) => set({ items }),
  
  customers: [],
  setCustomers: (customers) => set({ customers }),
  
  bills: [],
  setBills: (bills) => set({ bills }),

  // Dashboard stats
  stats: {
    totalSales: 0,
    totalPayments: 0,
    totalCustomers: 0,
    totalItems: 0,
    recentBills: []
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
  refreshDashboard: async () => {
    const stats = await window.api.getDashboardStats();
    set({ stats });
  }
}));

export default useStore;
