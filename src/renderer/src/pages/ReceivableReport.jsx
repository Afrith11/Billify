import { useState, useEffect } from 'react';
import useStore from '../store/useStore';
import { 
  Users, 
  AlertCircle, 
  TrendingDown, 
  Clock, 
  ChevronDown,
  Mail,
  Phone,
  Printer
} from 'lucide-react';

const ReceivableReport = () => {
  const { receivables, refreshReceivables } = useStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await refreshReceivables();
      setLoading(false);
    };
    load();
  }, []);

  const totalOutstanding = (receivables || []).reduce((sum, r) => sum + r.outstanding, 0);
  const overdue30 = (receivables || []).reduce((sum, r) => sum + (r.aging?.bracket_30 || 0), 0);
  const overdue60 = (receivables || []).reduce((sum, r) => sum + (r.aging?.bracket_60 || 0), 0);
  const overdue90 = (receivables || []).reduce((sum, r) => sum + (r.aging?.bracket_90 || 0), 0);

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card" style={{ borderLeft: '5px solid #ef4444' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)' }}>TOTAL RECEIVABLE</span>
          <h2 style={{ fontSize: '2rem', fontWeight: '800', margin: '0.5rem 0', color: '#b91c1c' }}>₹{(totalOutstanding || 0).toLocaleString()}</h2>
          <p style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: '600' }}>Overall Pending Balance</p>
        </div>
        <div className="card">
          <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)' }}>0-30 DAYS</span>
          <h2 style={{ margin: '0.5rem 0' }}>₹{(overdue30 || 0).toLocaleString()}</h2>
          <div style={{ fontSize: '0.7rem', color: 'var(--success)', fontWeight: '600' }}>Current Dues</div>
        </div>
        <div className="card">
          <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)' }}>31-60 DAYS</span>
          <h2 style={{ margin: '0.5rem 0', color: '#f59e0b' }}>₹{(overdue60 || 0).toLocaleString()}</h2>
          <div style={{ fontSize: '0.7rem', color: '#d97706', fontWeight: '600' }}>Overdue</div>
        </div>
        <div className="card">
          <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)' }}>61+ DAYS</span>
          <h2 style={{ margin: '0.5rem 0', color: '#ef4444' }}>₹{(overdue90 || 0).toLocaleString()}</h2>
          <div style={{ fontSize: '0.7rem', color: '#dc2626', fontWeight: '600' }}>Critically Overdue</div>
        </div>
      </div>

      {/* Main Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>Customer Aging Analysis</h3>
          <button className="btn btn-outline" onClick={() => window.print()}>
            <Printer size={18} /> Print Analysis
          </button>
        </div>

        <div className="table-container" style={{ margin: 0, border: 'none', boxShadow: 'none' }}>
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th style={{ textAlign: 'right' }}>0-30 Days</th>
                <th style={{ textAlign: 'right' }}>31-60 Days</th>
                <th style={{ textAlign: 'right' }}>61+ Days</th>
                <th style={{ textAlign: 'right' }}>Total Outstanding</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {receivables.length > 0 ? receivables.map((cust) => (
                <tr key={cust.id}>
                  <td>
                    <div style={{ fontWeight: '700' }}>{cust.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', gap: '8px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}><Phone size={10} /> {cust.phone}</span>
                      <span>ID: {cust.code}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: '600' }}>₹{(cust.aging?.bracket_30 || 0).toLocaleString()}</td>
                  <td style={{ textAlign: 'right', fontWeight: '600', color: (cust.aging?.bracket_60 || 0) > 0 ? '#f59e0b' : 'inherit' }}>
                    ₹{(cust.aging?.bracket_60 || 0).toLocaleString()}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: '600', color: (cust.aging?.bracket_90 || 0) > 0 ? '#ef4444' : 'inherit' }}>
                    ₹{(cust.aging?.bracket_90 || 0).toLocaleString()}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: '800', fontSize: '1.1rem' }}>
                    ₹{(cust.outstanding || 0).toLocaleString()}
                  </td>
                  <td>
                    <button className="btn btn-outline" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                      Follow Up
                    </button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
                  {loading ? 'Analyzing data...' : 'Excellent! No outstanding receivables.'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReceivableReport;
