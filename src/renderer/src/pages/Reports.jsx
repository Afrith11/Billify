import { useState, useEffect } from 'react';
import useStore from '../store/useStore';
import { FileText, Download, TrendingUp, AlertTriangle } from 'lucide-react';

const Reports = () => {
  const { stats, items, refreshDashboard, refreshItems } = useStore();

  useEffect(() => {
    refreshDashboard();
    refreshItems();
  }, []);

  const lowStockItems = items.filter(i => i.quantity < 5);

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><TrendingUp size={20} color="var(--accent-primary)" /> Sales Summary</h3>
            <button className="btn btn-outline" style={{ fontSize: '0.75rem' }}><Download size={14} /> Export CSV</button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
              <span>Gross Sales</span>
              <span style={{ fontWeight: 'bold' }}>₹{stats.totalSales.toLocaleString()}</span>
            </div>
            <div style={{ padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
              <span>Total Collections</span>
              <span style={{ fontWeight: 'bold', color: 'var(--success)' }}>₹{stats.totalPayments.toLocaleString()}</span>
            </div>
            <div style={{ padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
              <span>Outstanding Receivable</span>
              <span style={{ fontWeight: 'bold', color: 'var(--error)' }}>₹{(stats.totalSales - stats.totalPayments).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><AlertTriangle size={20} color="#f59e0b" /> Inventory Alerts</h3>
          </div>
          
          <div className="table-container" style={{ marginTop: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Stock</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {lowStockItems.length > 0 ? lowStockItems.map(item => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.quantity} {item.unit}</td>
                    <td><span style={{ color: 'var(--error)', fontSize: '0.8rem' }}>Low Stock</span></td>
                  </tr>
                )) : (
                  <tr><td colSpan="3" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-secondary)' }}>All items are well stocked</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '2.5rem' }}>
        <h3>Custom Reports</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Generate custom date-range reports for tax filing and audits.</p>
        
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Start Date</label>
            <input type="date" />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>End Date</label>
            <input type="date" />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Report Type</label>
            <select style={{ width: '200px' }}>
              <option>Sales Register</option>
              <option>Customer Balances</option>
              <option>Inventory Valuation</option>
              <option>Payment History</option>
            </select>
          </div>
          <button className="btn btn-primary"><FileText size={18} /> Generate PDF</button>
        </div>
      </div>
    </div>
  );
};

export default Reports;
