import { useState, useEffect } from 'react';
import useStore from '../store/useStore';
import { 
  CreditCard, 
  Search, 
  Calendar, 
  Filter, 
  AlertCircle,
  CheckCircle2,
  MoreVertical,
  Printer,
  Plus
} from 'lucide-react';

const PayableReport = () => {
  const { payables, refreshPayables, showNotification } = useStore();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    refreshPayables();
  }, []);

  const handleMarkAsPaid = async (id) => {
    try {
      await window.api.updateExpenseStatus({ id, status: 'Paid' });
      showNotification('Expense marked as paid', 'success');
      refreshPayables();
    } catch (err) {
      showNotification('Failed to update status', 'error');
    }
  };

  const filteredPayables = payables.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.vendor_name && p.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPayable = (filteredPayables || []).reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      {/* Header with Stats */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '2rem' }}>
          <div className="card" style={{ padding: '1.25rem 2.5rem', borderLeft: '5px solid #ef4444' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)' }}>TOTAL PAYABLE</span>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '800', margin: '0.25rem 0', color: '#b91c1c' }}>₹{(totalPayable || 0).toLocaleString()}</h2>
          </div>
          <div className="card" style={{ padding: '1.25rem 2.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)' }}>PENDING BILLS</span>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '800', margin: '0.25rem 0' }}>{filteredPayables.length}</h2>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-outline" onClick={() => window.print()}>
            <Printer size={18} /> Print List
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ marginBottom: '2rem', padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input 
            type="text" 
            placeholder="Search by title or vendor..." 
            style={{ paddingLeft: '2.5rem' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-outline"><Filter size={18} /> Filters</button>
        </div>
      </div>

      {/* Payables Table */}
      <div className="table-container" style={{ margin: 0 }}>
        <table>
          <thead>
            <tr>
              <th>Due Date</th>
              <th>Expense / Vendor</th>
              <th>Category</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayables.length > 0 ? filteredPayables.map((item) => (
              <tr key={item.id}>
                <td>
                  <div style={{ fontWeight: '700', color: new Date(item.due_date) < new Date() ? '#ef4444' : 'inherit' }}>
                    {(item.due_date || item.expense_date) ? new Date(item.due_date || item.expense_date).toLocaleDateString() : '-'}
                  </div>
                  {new Date(item.due_date) < new Date() && (
                    <div style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: '800' }}>OVERDUE</div>
                  )}
                </td>
                <td>
                  <div style={{ fontWeight: '700' }}>{item.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{item.vendor_name || 'No Vendor'}</div>
                </td>
                <td>
                  <span style={{ fontSize: '0.85rem', background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px' }}>
                    {item.category || 'General'}
                  </span>
                </td>
                <td style={{ textAlign: 'right', fontWeight: '800', fontSize: '1.1rem', color: '#b91c1c' }}>
                  ₹{(item.amount || 0).toLocaleString()}
                </td>
                <td>
                  <span style={{ 
                    padding: '4px 10px', 
                    borderRadius: '8px', 
                    fontSize: '0.7rem', 
                    fontWeight: '800',
                    background: '#fee2e2',
                    color: '#991b1b'
                  }}>
                    UNPAID
                  </span>
                </td>
                <td>
                  <button 
                    className="btn btn-primary" 
                    style={{ padding: '6px 12px', fontSize: '0.75rem', background: 'var(--success)' }}
                    onClick={() => handleMarkAsPaid(item.id)}
                  >
                    <CheckCircle2 size={14} /> Mark Paid
                  </button>
                </td>
              </tr>
            )) : (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
                <AlertCircle size={48} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                <p>No pending payables found.</p>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PayableReport;
