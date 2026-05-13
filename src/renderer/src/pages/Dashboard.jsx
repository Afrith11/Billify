import { useEffect } from 'react';
import useStore from '../store/useStore';
import { FileText, Users, Package, ShoppingCart, TrendingUp, BarChart } from 'lucide-react';
import logo from '../assets/billify.png';

const Dashboard = () => {
  const { stats, refreshDashboard, setActivePage, settings, viewInvoice } = useStore();

  useEffect(() => {
    refreshDashboard();
  }, []);

  const statCards = [
    { label: "Today's Sales", value: `₹${(stats.todaySales || 0).toLocaleString()}`, icon: <TrendingUp size={24} />, color: '#4f46e5' },
    { label: "Monthly Sales", value: `₹${(stats.monthlySales || 0).toLocaleString()}`, icon: <ShoppingCart size={24} />, color: '#8b5cf6' },
    { label: 'Total Receivable', value: `₹${(stats.totalReceivable || 0).toLocaleString()}`, icon: <TrendingUp size={24} />, color: '#10b981' },
    { label: 'Total Payable', value: `₹${(stats.totalPayable || 0).toLocaleString()}`, icon: <ShoppingCart size={24} />, color: '#ef4444' },
    { label: 'Net Profit', value: `₹${(stats.netProfit || 0).toLocaleString()}`, icon: <BarChart size={24} />, color: '#ec4899' },
    { label: 'Total Customers', value: stats.totalCustomers || 0, icon: <Users size={24} />, color: '#f59e0b' },
  ];

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      {/* Welcome Banner */}
      <div className="card" style={{ 
        marginBottom: '2rem', 
        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
        color: 'white',
        border: 'none',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '2rem 3rem',
        borderRadius: '24px',
        boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.4)'
      }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '900', margin: 0, letterSpacing: '-0.04em' }}>
            My Billify Business
          </h1>
          <p style={{ opacity: 0.9, fontSize: '1.1rem', marginTop: '0.5rem' }}>Your business at a glance for today.</p>
        </div>
        <div style={{ 
          background: 'rgba(255,255,255,0.2)', 
          padding: '2rem', 
          borderRadius: '32px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.3)'
        }}>
          <BarChart size={64} color="white" strokeWidth={2.5} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
        {statCards.map((stat, i) => (
          <div key={i} className="card" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
            boxShadow: 'var(--premium-shadow)',
            border: 'none',
            background: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)'
          }}>
            <div style={{
              padding: '1.25rem',
              borderRadius: '16px',
              background: `${stat.color}15`,
              color: stat.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 8px 16px -4px ${stat.color}20`
            }}>
              {stat.icon}
            </div>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: '500', marginBottom: '4px' }}>{stat.label}</p>
              <h2 style={{ marginBottom: 0, fontSize: '1.75rem', fontWeight: '700', letterSpacing: '-0.02em' }}>{stat.value}</h2>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '2.5rem', display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
        <div className="card" style={{ boxShadow: 'var(--premium-shadow)', border: 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Recent Transactions</h3>
            <button className="btn btn-outline" onClick={() => setActivePage('daybook')}>View All</button>
          </div>
          <div className="table-container" style={{ marginTop: 0, border: 'none', background: 'transparent' }}>
            <table style={{ borderCollapse: 'separate', borderSpacing: '0 8px' }}>
              <thead>
                <tr style={{ background: 'transparent' }}>
                  <th style={{ background: 'transparent', border: 'none' }}>Inv #</th>
                  <th style={{ background: 'transparent', border: 'none' }}>Customer</th>
                  <th style={{ background: 'transparent', border: 'none' }}>Date</th>
                  <th style={{ background: 'transparent', border: 'none' }}>Amount</th>
                  <th style={{ background: 'transparent', border: 'none' }}>Payment</th>
                </tr>
              </thead>
              <tbody>
                {(stats.recentInvoices || []).length > 0 ? (stats.recentInvoices || []).map((inv) => (
                  <tr key={inv.id} style={{ background: 'var(--bg-secondary)', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                    <td 
                      style={{ borderRadius: '12px 0 0 12px', fontWeight: '800', cursor: 'pointer', color: 'var(--accent-primary)', textDecoration: 'underline' }}
                      onClick={() => viewInvoice(inv.id)}
                    >
                      #{inv.invoice_number}
                    </td>
                    <td style={{ fontWeight: '500' }}>{inv.customer_name}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{inv.bill_date ? new Date(inv.bill_date).toLocaleDateString() : '-'}</td>
                    <td style={{ fontWeight: '700', color: 'var(--accent-primary)' }}>₹{(inv.net_amount || 0).toLocaleString()}</td>
                    <td style={{ borderRadius: '0 12px 12px 0' }}>
                      <span style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: '10px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        background: inv.payment_type === 'Cash' ? '#10b98115' : '#4f46e515',
                        color: inv.payment_type === 'Cash' ? '#10b981' : '#4f46e5'
                      }}>
                        {inv.payment_type}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>No recent transactions yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card" style={{ boxShadow: 'var(--premium-shadow)', border: 'none', background: 'var(--bg-tertiary)' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem' }}>Quick Actions</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <button className="btn btn-primary" onClick={() => setActivePage('daybook')} style={{
              padding: '2rem 1.5rem',
              flexDirection: 'column',
              gap: '1rem',
              borderRadius: '20px',
              boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.3)'
            }}>
              <ShoppingCart size={28} />
              <span style={{ fontWeight: '600' }}>New Bill</span>
            </button>
            <button className="btn btn-outline" onClick={() => setActivePage('customers')} style={{
              padding: '2rem 1.5rem',
              flexDirection: 'column',
              gap: '1rem',
              borderRadius: '20px',
              background: 'white'
            }}>
              <Users size={28} style={{ color: '#8b5cf6' }} />
              <span style={{ fontWeight: '600' }}>Add Customer</span>
            </button>
            <button className="btn btn-outline" onClick={() => setActivePage('items')} style={{
              padding: '2rem 1.5rem',
              flexDirection: 'column',
              gap: '1rem',
              borderRadius: '20px',
              background: 'white'
            }}>
              <Package size={28} style={{ color: '#f59e0b' }} />
              <span style={{ fontWeight: '600' }}>Add Item</span>
            </button>
            <button className="btn btn-outline" onClick={() => setActivePage('reports')} style={{
              padding: '2rem 1.5rem',
              flexDirection: 'column',
              gap: '1rem',
              borderRadius: '20px',
              background: 'white'
            }}>
              <FileText size={28} style={{ color: '#ec4899' }} />
              <span style={{ fontWeight: '600' }}>Ledger Report</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;