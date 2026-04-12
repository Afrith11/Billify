import { useEffect } from 'react';
import useStore from '../store/useStore';
import { DollarSign, Users, Package, ShoppingCart, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const Dashboard = () => {
  const { stats, refreshDashboard } = useStore();

  useEffect(() => {
    refreshDashboard();
  }, []);

  const statCards = [
    { label: 'Total Sales', value: `₹${stats.totalSales.toLocaleString()}`, icon: <DollarSign size={24} />, color: '#3b82f6' },
    { label: 'Total Payments', value: `₹${stats.totalPayments.toLocaleString()}`, icon: <ShoppingCart size={24} />, color: '#10b981' },
    { label: 'Total Customers', value: stats.totalCustomers, icon: <Users size={24} />, color: '#8b5cf6' },
    { label: 'Total Items', value: stats.totalItems, icon: <Package size={24} />, color: '#f59e0b' },
  ];

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
        {statCards.map((stat, i) => (
          <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ 
              padding: '1rem', 
              borderRadius: '12px', 
              background: `${stat.color}20`, 
              color: stat.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {stat.icon}
            </div>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{stat.label}</p>
              <h2 style={{ marginBottom: 0 }}>{stat.value}</h2>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '2.5rem', display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h3>Recent Transactions</h3>
            <button className="btn btn-outline">View All</button>
          </div>
          <div className="table-container" style={{ marginTop: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Inv #</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentBills.length > 0 ? stats.recentBills.map((bill) => (
                  <tr key={bill.id}>
                    <td>#{bill.invoice_number}</td>
                    <td>{bill.customer_name}</td>
                    <td>{bill.bill_date}</td>
                    <td>₹{bill.total_amount.toLocaleString()}</td>
                    <td>
                      <span style={{ 
                        padding: '0.25rem 0.5rem', 
                        borderRadius: '4px', 
                        fontSize: '0.75rem',
                        background: bill.payment_type === 'Cash' ? '#10b98120' : '#ef444420',
                        color: bill.payment_type === 'Cash' ? '#10b981' : '#ef4444'
                      }}>
                        {bill.payment_type}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No recent transactions</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h3>Quick Actions</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
            <button className="btn btn-primary" style={{ padding: '1.5rem', flexDirection: 'column', gap: '0.75rem' }}>
              <ShoppingCart size={24} />
              <span>New Bill</span>
            </button>
            <button className="btn btn-outline" style={{ padding: '1.5rem', flexDirection: 'column', gap: '0.75rem' }}>
              <Users size={24} />
              <span>Add Customer</span>
            </button>
            <button className="btn btn-outline" style={{ padding: '1.5rem', flexDirection: 'column', gap: '0.75rem' }}>
              <Package size={24} />
              <span>Stock Entry</span>
            </button>
            <button className="btn btn-outline" style={{ padding: '1.5rem', flexDirection: 'column', gap: '0.75rem' }}>
              <FileText size={24} />
              <span>Generate Report</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
