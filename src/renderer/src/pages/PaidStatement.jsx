import { useState, useEffect } from 'react';
import useStore from '../store/useStore';
import { 
  CreditCard, 
  Search, 
  Printer, 
  FileText, 
  TrendingUp, 
  User,
  Calendar
} from 'lucide-react';
import PrintHeader from '../components/PrintHeader';

const PaidStatement = () => {
  const { customers, refreshCustomers } = useStore();
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [statement, setStatement] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    refreshCustomers();
  }, []);

  const fetchStatement = async (customerId) => {
    setLoading(true);
    try {
      const data = await window.api.getLedgerReport(customerId);
      setStatement(data || []);
      setSelectedCustomer((customers || []).find(c => c.id === customerId));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = (customers || []).filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.customer_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <div style={{ display: 'flex', gap: '2rem', height: 'calc(100vh - 140px)' }}>
        
        {/* Left Panel: Customer List */}
        <div style={{ width: '320px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Search size={18} color="var(--text-secondary)" />
            <input 
              type="text" 
              placeholder="Search customers..." 
              style={{ border: 'none', padding: 0, background: 'transparent' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="card" style={{ flex: 1, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-tertiary)' }}>
              <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '700' }}>Select Customer</h4>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {(filteredCustomers || []).map(cust => (
                <div 
                  key={cust.id}
                  onClick={() => fetchStatement(cust.id)}
                  style={{ 
                    padding: '1rem 1.5rem', 
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--border-color)',
                    background: selectedCustomer?.id === cust.id ? 'var(--accent-primary)' : 'transparent',
                    color: selectedCustomer?.id === cust.id ? 'white' : 'var(--text-primary)',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>{cust.name}</div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>ID: {cust.customer_id}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel: Statement View */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {!selectedCustomer ? (
            <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
              <User size={64} style={{ opacity: 0.1, marginBottom: '1rem' }} />
              <h3>Select a customer to view statement</h3>
              <p>View all transactions, payments, and running balance</p>
            </div>
          ) : (
            <>
              <PrintHeader title="Customer Account Statement" />
              {/* Header Stats */}
              <div className="no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                <div className="card" style={{ borderLeft: '4px solid var(--accent-primary)' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)' }}>TOTAL INVOICED</span>
                  <p style={{ fontSize: '1.5rem', fontWeight: '800', margin: '0.25rem 0' }}>
                    ₹{(statement || []).filter(e => e.type === 'Debit').reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
                  </p>
                </div>
                <div className="card" style={{ borderLeft: '4px solid var(--success)' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)' }}>TOTAL PAID</span>
                  <p style={{ fontSize: '1.5rem', fontWeight: '800', margin: '0.25rem 0', color: 'var(--success)' }}>
                    ₹{(statement || []).filter(e => e.type === 'Credit').reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
                  </p>
                </div>
                <div className="card" style={{ borderLeft: '4px solid #f59e0b' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)' }}>CURRENT BALANCE</span>
                  <p style={{ fontSize: '1.5rem', fontWeight: '800', margin: '0.25rem 0', color: '#b45309' }}>
                    ₹{(selectedCustomer.balance || 0).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Statement Table */}
              <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: 0 }}>{selectedCustomer.name}&apos;s Statement</h3>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Detailed transaction ledger</p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-outline" onClick={handlePrint}>
                      <Printer size={18} /> Print Statement
                    </button>
                    <button className="btn btn-primary">
                      <FileText size={18} /> Export Excel
                    </button>
                  </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto' }}>
                  <table className="printable-table" style={{ borderCollapse: 'collapse' }}>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                      <tr>
                        <th>Date</th>
                        <th>Reference / Description</th>
                        <th>Type</th>
                        <th style={{ textAlign: 'right' }}>Debit (Invoiced)</th>
                        <th style={{ textAlign: 'right' }}>Credit (Paid)</th>
                        <th style={{ textAlign: 'right' }}>Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan="6" style={{ textAlign: 'center', padding: '4rem' }}>Loading data...</td></tr>
                      ) : statement.length > 0 ? (
                        statement.map((entry, index) => (
                          <tr key={index}>
                            <td>{entry.date}</td>
                            <td>
                              <div style={{ fontWeight: '600' }}>{entry.description}</div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Ref: {entry.reference_type} #{entry.reference_id}</div>
                            </td>
                            <td>
                              <span style={{ 
                                padding: '4px 8px', 
                                borderRadius: '6px', 
                                fontSize: '0.7rem', 
                                fontWeight: '800',
                                background: entry.type === 'Debit' ? '#fee2e2' : '#dcfce7',
                                color: entry.type === 'Debit' ? '#991b1b' : '#166534'
                              }}>
                                {entry.type.toUpperCase()}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: '700' }}>{entry.debit > 0 ? `₹${entry.debit.toLocaleString()}` : '-'}</td>
                            <td style={{ textAlign: 'right', fontWeight: '700', color: 'var(--success)' }}>{entry.credit > 0 ? `₹${entry.credit.toLocaleString()}` : '-'}</td>
                            <td style={{ textAlign: 'right', fontWeight: '800', color: entry.running_balance > 0 ? '#b45309' : 'var(--text-primary)' }}>
                              ₹{entry.running_balance.toLocaleString()}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan="6" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>No transactions found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

    </div>
  );
};

export default PaidStatement;
