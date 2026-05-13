import { useEffect } from 'react';
import useStore from '../store/useStore';
import { FileText, Download, TrendingUp, AlertTriangle, PieChart, BarChart } from 'lucide-react';

const Reports = () => {
  const { stats, items, refreshDashboard, refreshItems } = useStore();

  useEffect(() => {
    refreshDashboard();
    refreshItems();
  }, []);

  const lowStockItems = items.filter(i => i.quantity < 5);

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>

        {/* Sales Performance Card */}
        <div className="card" style={{ boxShadow: 'var(--premium-shadow)', border: 'none', borderRadius: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <PieChart size={24} style={{ color: 'var(--accent-primary)' }} /> Financial Overview
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Lifecycle of today&apos;s revenue</p>
            </div>
            <button className="btn btn-outline" style={{ borderRadius: '12px', fontSize: '0.8rem' }}>
              <Download size={16} /> Export
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ padding: '1.25rem', background: '#f8fafc', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Today&apos;s Sales</span>
                <p style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: 0 }}>₹{(stats.todaySales || 0).toLocaleString()}</p>
              </div>
              <div style={{ background: '#e0e7ff', color: '#4f46e5', padding: '10px', borderRadius: '12px' }}><BarChart size={20} /></div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ padding: '1rem', background: '#f0fdf4', borderRadius: '16px', border: '1px solid #dcfce7' }}>
                <span style={{ fontSize: '0.75rem', color: '#166534', fontWeight: '700' }}>TOTAL REVENUE</span>
                <p style={{ fontSize: '1.25rem', fontWeight: '800', color: '#15803d', marginBottom: 0 }}>₹{(stats.totalRevenue || 0).toLocaleString()}</p>
              </div>
              <div style={{ padding: '1rem', background: '#fff1f2', borderRadius: '16px', border: '1px solid #ffe4e6' }}>
                <span style={{ fontSize: '0.75rem', color: '#9f1239', fontWeight: '700' }}>TOTAL PENDING</span>
                <p style={{ fontSize: '1.25rem', fontWeight: '800', color: '#be123c', marginBottom: 0 }}>₹{(stats.pendingPayments || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stock Alert Card */}
        <div className="card" style={{ boxShadow: 'var(--premium-shadow)', border: 'none', borderRadius: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AlertTriangle size={24} style={{ color: '#f59e0b' }} /> Inventory Status
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Replenishment alerts (Stock below 5)</p>
            </div>
          </div>

          <div className="table-container" style={{ marginTop: 0, maxHeight: '250px', overflowY: 'auto', border: 'none' }}>
            <table style={{ borderCollapse: 'separate', borderSpacing: '0 6px' }}>
              <thead>
                <tr style={{ background: 'transparent' }}>
                  <th style={{ background: 'transparent', border: 'none', padding: '10px' }}>Item Name</th>
                  <th style={{ background: 'transparent', border: 'none', padding: '10px' }}>Stock</th>
                  <th style={{ background: 'transparent', border: 'none', padding: '10px' }}>Urgency</th>
                </tr>
              </thead>
              <tbody>
                {lowStockItems.length > 0 ? lowStockItems.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ fontWeight: '600' }}>{item.name}</td>
                    <td>{item.quantity} {item.unit}</td>
                    <td>
                      <span style={{ color: '#92400e', background: '#fef3c7', padding: '4px 10px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: '800' }}>REORDER</span>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="3" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    <TrendingUp size={48} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                    <p>All items above safety threshold.</p>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Advanced Generator */}
      <div className="card" style={{ marginTop: '2.5rem', boxShadow: 'var(--premium-shadow)', border: 'none', borderRadius: '24px', background: 'linear-gradient(to right, #ffffff, #f1f5f9)' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '0.5rem' }}>Generate Professional Statement</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>Compile audited reports for specific durations and accounting heads.</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr auto', gap: '1.5rem', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ fontWeight: '700', fontSize: '0.8rem' }}>Start Date</label>
            <input type="date" style={{ borderRadius: '12px', background: 'white' }} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ fontWeight: '700', fontSize: '0.8rem' }}>End Date</label>
            <input type="date" style={{ borderRadius: '12px', background: 'white' }} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ fontWeight: '700', fontSize: '0.8rem' }}>Accounting Category</label>
            <select style={{ borderRadius: '12px', background: 'white' }}>
              <option>Sales Register (Detailed)</option>
              <option>Taxation Report (GST)</option>
              <option>Customer Balance Matrix</option>
              <option>Inventory Valuation</option>
              <option>Collection History</option>
            </select>
          </div>
          <button 
            className="btn btn-primary" 
            style={{ padding: '0.75rem 2rem', borderRadius: '14px', background: 'var(--text-primary)' }}
            onClick={() => {
              const category = document.querySelector('select').value;
              if (category.includes('Sales Register')) useStore.getState().setActivePage('sales-report');
              else if (category.includes('Customer Balance')) useStore.getState().setActivePage('receivable-report');
              else if (category.includes('Collection History')) useStore.getState().setActivePage('receipt-statement');
              else if (category.includes('Taxation')) useStore.getState().setActivePage('sales-report');
              else if (category.includes('Inventory')) useStore.getState().setActivePage('inventory');
              else useStore.getState().showNotification('Generating report...', 'success');
            }}
          >
            <FileText size={18} /> View Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default Reports;