import { useState, useEffect } from 'react';
import useStore from '../store/useStore';
import { Search, CreditCard, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';

const Payments = () => {
  const { customers, refreshCustomers } = useStore();
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [history, setHistory] = useState({ bills: [], payments: [] });

  useEffect(() => {
    refreshCustomers();
  }, []);

  const loadHistory = async (customer) => {
    setSelectedCustomer(customer);
    const data = await window.api.getLedgerReport(customer.id);
    setHistory(data);
  };

  const totalBilled = history.bills.reduce((sum, b) => sum + b.total_amount, 0);
  const totalPaid = history.payments.reduce((sum, p) => sum + p.amount, 0);
  const balance = totalBilled - totalPaid;

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        <div className="card">
          <h3>Customers</h3>
          <div className="table-container" style={{ marginTop: '1rem', maxHeight: '500px', overflowY: 'auto' }}>
            <table>
              <thead><tr><th>Name</th></tr></thead>
              <tbody>
                {customers.map(c => (
                  <tr key={c.id} 
                    onClick={() => loadHistory(c)} 
                    style={{ cursor: 'pointer', background: selectedCustomer?.id === c.id ? 'rgba(59, 130, 246, 0.1)' : '' }}
                  >
                    <td>{c.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          {selectedCustomer ? (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <div>
                  <h2 style={{ marginBottom: '0.25rem' }}>{selectedCustomer.name}</h2>
                  <p style={{ color: 'var(--text-secondary)' }}>Account Statement</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Outstanding Balance</p>
                  <h2 style={{ color: balance > 0 ? 'var(--error)' : 'var(--success)' }}>₹{balance.toLocaleString()}</h2>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total Billed</p>
                  <h3 style={{ marginBottom: 0 }}>₹{totalBilled.toLocaleString()}</h3>
                </div>
                <div style={{ padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total Received</p>
                  <h3 style={{ marginBottom: 0 }}>₹{totalPaid.toLocaleString()}</h3>
                </div>
              </div>

              <h3>Combined Ledger</h3>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Reference</th>
                      <th>Type</th>
                      <th>Debit (+)</th>
                      <th>Credit (-)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...history.bills, ...history.payments]
                      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                      .map((entry, i) => (
                        <tr key={i}>
                          <td>{entry.bill_date || entry.payment_date}</td>
                          <td>{entry.invoice_number ? `#${entry.invoice_number}` : (entry.description || 'Payment')}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              {entry.invoice_number ? <ArrowUpCircle size={14} color="#ef4444" /> : <ArrowDownCircle size={14} color="#10b981" />}
                              {entry.invoice_number ? 'Bill' : 'Payment'}
                            </div>
                          </td>
                          <td style={{ color: '#ef4444' }}>{entry.total_amount ? `₹${entry.total_amount}` : '-'}</td>
                          <td style={{ color: '#10b981' }}>{entry.amount ? `₹${entry.amount}` : '-'}</td>
                        </tr>
                      ))}
                    {history.bills.length === 0 && history.payments.length === 0 && (
                      <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>No history for this customer</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', flexDirection: 'column', gap: '1rem', color: 'var(--text-secondary)' }}>
              <CreditCard size={48} />
              <p>Select a customer to view statement</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Payments;
