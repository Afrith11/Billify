import { useState, useEffect } from 'react';
import useStore from '../store/useStore';
import { Search, CreditCard, ArrowDownCircle, ArrowUpCircle, User, Plus, Filter, Download, History, IndianRupee, X } from 'lucide-react';

const Payments = () => {
  const { customers, refreshCustomers, refreshDashboard, showNotification } = useStore();
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    payment_type: 'Cash',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Pagination & Table Search State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [goToPage, setGoToPage] = useState('');
  const [tableSearchTerm, setTableSearchTerm] = useState('');

  useEffect(() => {
    refreshCustomers();
  }, []);

  const loadLedger = async (customer) => {
    if (!customer) return;
    
    setSelectedCustomer(customer);
    if (!window.api) {
      console.error('Electron API not available');
      return;
    }
    
    try {
      const data = await window.api.getLedgerReport(customer?.id);
      setLedger(data || []);
      setCurrentPage(1);
      setTableSearchTerm('');
      console.log("Ledger loaded for:", customer?.name, data);
    } catch (error) {
      console.error("Ledger fetch error:", error);
      setLedger([]);
      showNotification('Failed to load ledger history.', 'error');
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) return showNotification('No customer selected', 'error');
    if (!paymentData.amount || parseFloat(paymentData.amount) <= 0) return showNotification('Enter a valid amount', 'error');
    try {
      if (!window.api?.receivePayment) {
        showNotification('System error: Communication bridge receivePayment is missing.', 'error');
        return;
      }
      
      await window.api.receivePayment({
        customer_id: selectedCustomer?.id,
        amount: parseFloat(paymentData.amount),
        payment_date: paymentData.date,
        payment_method: paymentData.payment_type,
        description: paymentData.description
      });
      setIsPaymentModalOpen(false);
      setPaymentData({ amount: '', payment_type: 'Cash', description: '', date: new Date().toISOString().split('T')[0] });
      await loadLedger(selectedCustomer);
      await refreshCustomers();
      await refreshDashboard();
      showNotification('Payment recorded successfully!', 'success');
    } catch (err) {
      showNotification('Error recording payment: ' + err.message, 'error');
    }
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone?.includes(searchTerm)
  );

  // Table Search Logic
  const filteredLedger = (ledger || []).filter(entry => 
    entry.description?.toLowerCase().includes(tableSearchTerm.toLowerCase()) ||
    entry.reference_id?.toLowerCase().includes(tableSearchTerm.toLowerCase()) ||
    entry.date?.toLowerCase().includes(tableSearchTerm.toLowerCase())
  );

  // Pagination Logic
  const totalRecords = filteredLedger.length;
  const isFiltered = tableSearchTerm.length > 0;
  const totalPages = Math.ceil(totalRecords / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalRecords);
  const paginatedData = filteredLedger.slice(startIndex, endIndex);

  const goToPageNumber = (num) => {
    const page = Math.max(1, Math.min(num, totalPages));
    setCurrentPage(page);
    setGoToPage('');
  };

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '2rem', height: 'calc(100vh - 180px)' }}>

        {/* Customer Selector */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem', borderRadius: '24px', boxShadow: 'var(--premium-shadow)', border: 'none' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '1rem' }}>Customers Ledger</h3>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input
                placeholder="Find customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '2.5rem', width: '100%', borderRadius: '12px', background: '#f8fafc', fontSize: '0.9rem' }}
              />
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {filteredCustomers.map(c => (
              <div
                key={c.id}
                onClick={() => loadLedger(c)}
                style={{
                  padding: '1rem',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  background: selectedCustomer?.id === c.id ? 'var(--accent-primary)' : 'white',
                  color: selectedCustomer?.id === c.id ? 'white' : 'var(--text-primary)',
                  boxShadow: selectedCustomer?.id === c.id ? '0 10px 15px -3px rgba(79, 70, 229, 0.4)' : 'none',
                  border: selectedCustomer?.id === c.id ? 'none' : '1px solid #f1f5f9',
                  transition: 'all 0.2s',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <p style={{ fontWeight: '700', fontSize: '0.95rem', marginBottom: '2px' }}>{c.name}</p>
                  <p style={{ fontSize: '0.75rem', opacity: 0.8 }}>{c.phone || 'No phone'}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontWeight: '800', fontSize: '0.85rem' }}>₹{(c.balance || 0).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ledger View */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {selectedCustomer ? (
            <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '2rem', borderRadius: '24px', boxShadow: 'var(--premium-shadow)', border: 'none', background: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                  <div style={{ width: '60px', height: '60px', borderRadius: '18px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' }}>
                    <User size={32} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '4px' }}>{selectedCustomer?.name || 'Unknown Customer'}</h2>
                    <span style={{ fontSize: '0.8rem', background: '#e0e7ff', color: '#4338ca', padding: '4px 10px', borderRadius: '8px', fontWeight: '700' }}>{selectedCustomer?.customer_id || '-'}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ textAlign: 'right', paddingRight: '1rem', borderRight: '1px solid #eee' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>Outstanding</p>
                    <h2 style={{ color: (selectedCustomer?.balance || 0) > 0 ? 'var(--error)' : 'var(--success)', fontWeight: '900', fontSize: '1.75rem' }}>₹{(selectedCustomer?.balance || 0).toLocaleString()}</h2>
                  </div>
                  <button className="btn btn-primary" onClick={() => setIsPaymentModalOpen(true)} style={{ borderRadius: '14px', alignSelf: 'center', padding: '0.8rem 1.25rem' }}>
                    <Plus size={18} /> Record Payment
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}><History size={20} /> Transaction History</h3>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <div style={{ position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <input 
                      placeholder="Search history..." 
                      value={tableSearchTerm}
                      onChange={(e) => {
                        setTableSearchTerm(e.target.value);
                        setCurrentPage(1);
                      }}
                      style={{ paddingLeft: '2.25rem', height: '36px', width: '200px', borderRadius: '10px', fontSize: '0.8rem', background: '#f8fafc' }}
                    />
                  </div>
                  <button className="btn btn-outline" style={{ borderRadius: '10px', fontSize: '0.8rem', height: '36px' }}><Filter size={14} /> Filter</button>
                  <button className="btn btn-outline" style={{ borderRadius: '10px', fontSize: '0.8rem', height: '36px' }}><Download size={14} /> Statement</button>
                </div>
              </div>

              <div className="table-container" style={{ flex: 1, overflowY: 'auto', marginTop: 0, border: 'none', background: '#f8fafc', borderRadius: '20px', padding: '10px' }}>
                <table style={{ borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                  <thead>
                    <tr style={{ background: 'transparent' }}>
                      <th style={{ background: 'transparent', border: 'none', padding: '10px 15px' }}>Date</th>
                      <th style={{ background: 'transparent', border: 'none', padding: '10px 15px' }}>Reference / Details</th>
                      <th style={{ background: 'transparent', border: 'none', padding: '10px 15px' }}>Debit (+)</th>
                      <th style={{ background: 'transparent', border: 'none', padding: '10px 15px' }}>Credit (-)</th>
                      <th style={{ background: 'transparent', border: 'none', padding: '10px 15px', textAlign: 'right' }}>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.length > 0 ? paginatedData.map((entry, i) => (
                      <tr key={i} style={{ background: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                        <td style={{ borderRadius: '14px 0 0 14px', padding: '15px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{entry.date}</td>
                        <td style={{ padding: '15px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {entry.type === 'Debit' ? <ArrowUpCircle size={16} color="#ef4444" /> : <ArrowDownCircle size={16} color="#10b981" />}
                            <div>
                              <p style={{ fontWeight: '700', fontSize: '0.9rem', marginBottom: '2px' }}>{entry.description}</p>
                              <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Ref: {entry.reference_id || 'System'}</p>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '15px', fontWeight: '700', color: '#be123c' }}>{entry.debit > 0 ? `+ ₹${(entry.debit || 0).toLocaleString()}` : '-'}</td>
                        <td style={{ padding: '15px', fontWeight: '700', color: '#15803d' }}>{entry.credit > 0 ? `- ₹${(entry.credit || 0).toLocaleString()}` : '-'}</td>
                        <td style={{ borderRadius: '0 14px 14px 0', padding: '15px', textAlign: 'right', fontWeight: '800' }}>₹{(entry.running_balance || 0).toLocaleString()}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan="5" style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-secondary)' }}>No transactions found for this customer.</td></tr>
                    )}
                  </tbody>
                </table>

                {/* Pagination Controls */}
                {totalRecords > 0 && (
                  <div style={{ 
                    padding: '1rem 1.5rem', 
                    marginTop: '1rem',
                    borderTop: '1px solid var(--border-color)', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    background: 'white',
                    borderRadius: '0 0 20px 20px',
                    position: 'sticky',
                    bottom: -10, // Adjust for parent padding
                    zIndex: 10,
                    boxShadow: '0 -4px 10px rgba(0,0,0,0.02)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
                        Showing <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{totalRecords > 0 ? startIndex + 1 : 0}–{endIndex}</span> of <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{totalRecords}</span> {isFiltered ? 'filtered transactions' : 'transactions'}
                      </span>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <select 
                          value={itemsPerPage} 
                          onChange={(e) => {
                            setItemsPerPage(parseInt(e.target.value));
                            setCurrentPage(1);
                          }}
                          style={{ 
                            padding: '2px 6px', 
                            borderRadius: '6px', 
                            border: '1px solid var(--border-color)', 
                            fontSize: '0.8rem',
                            background: 'white'
                          }}
                        >
                          {[15, 30, 50, 100, 500].map(val => (
                            <option key={val} value={val}>{val}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: '0.5rem' }}>
                        <input 
                          type="number" 
                          value={goToPage}
                          onChange={(e) => setGoToPage(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && goToPageNumber(parseInt(goToPage))}
                          placeholder="Page"
                          style={{ width: '50px', padding: '4px 8px', borderRadius: '8px', fontSize: '0.8rem', background: '#f8fafc' }}
                        />
                      </div>

                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button 
                          className="btn btn-outline" 
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(prev => prev - 1)}
                          style={{ padding: '4px 10px', fontSize: '0.8rem', borderRadius: '8px', opacity: currentPage === 1 ? 0.5 : 1 }}
                        >
                          «
                        </button>
                        
                        {[...Array(totalPages)].map((_, i) => {
                          const pageNum = i + 1;
                          if (pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                            return (
                              <button 
                                key={pageNum}
                                className={`btn ${currentPage === pageNum ? 'btn-primary' : 'btn-outline'}`}
                                onClick={() => setCurrentPage(pageNum)}
                                style={{ 
                                  padding: '4px 10px', 
                                  fontSize: '0.8rem', 
                                  borderRadius: '8px',
                                  minWidth: '32px',
                                  background: currentPage === pageNum ? 'var(--accent-primary)' : 'white',
                                }}
                              >
                                {pageNum}
                              </button>
                            );
                          }
                          if (pageNum === currentPage - 2 || pageNum === currentPage + 2) return <span key={pageNum} style={{ fontSize: '0.8rem' }}>..</span>;
                          return null;
                        })}

                        <button 
                          className="btn btn-outline" 
                          disabled={currentPage === totalPages}
                          onClick={() => setCurrentPage(prev => prev + 1)}
                          style={{ padding: '4px 10px', fontSize: '0.8rem', borderRadius: '8px', opacity: currentPage === totalPages ? 0.5 : 1 }}
                        >
                          »
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1.5rem', color: 'var(--text-secondary)', background: 'white', borderRadius: '24px', border: '1px dashed #cbd5e1' }}>
              <div style={{ background: '#f1f5f9', padding: '2rem', borderRadius: '50%' }}>
                <IndianRupee size={64} style={{ opacity: 0.2 }} />
              </div>
              <p style={{ fontSize: '1.1rem', fontWeight: '600' }}>Select a customer from the sidebar to view their ledger statement</p>
            </div>
          )}
        </div>
      </div>

      {/* Payment Receipt Modal */}
      {isPaymentModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px', borderRadius: '24px', padding: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }}>Receive Payment</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Record a collection from {selectedCustomer?.name || 'customer'}</p>
              </div>
              <button onClick={() => setIsPaymentModalOpen(false)} className="btn-icon"><X size={20} /></button>
            </div>

            <form onSubmit={handleRecordPayment}>
              <div className="form-group">
                <label>Amount Received (₹)</label>
                <input
                  type="number"
                  autoFocus
                  style={{ fontSize: '1.5rem', fontWeight: '800', padding: '1rem', background: '#f8fafc', borderRadius: '16px', color: 'var(--success)' }}
                  value={paymentData.amount}
                  onChange={e => setPaymentData({ ...paymentData, amount: e.target.value })}
                  required
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Date</label>
                  <input type="date" value={paymentData.date} onChange={e => setPaymentData({ ...paymentData, date: e.target.value })} style={{ borderRadius: '12px' }} />
                </div>
                <div className="form-group">
                  <label>Mode</label>
                  <select value={paymentData.payment_type} onChange={e => setPaymentData({ ...paymentData, payment_type: e.target.value })} style={{ borderRadius: '12px' }}>
                    <option>Cash</option>
                    <option>Bank Transfer</option>
                    <option>Cheque</option>
                    <option>UPI</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Reference / Notes</label>
                <textarea
                  rows="2"
                  value={paymentData.description}
                  onChange={e => setPaymentData({ ...paymentData, description: e.target.value })}
                  placeholder="e.g. Received for Inv #102"
                  style={{ borderRadius: '12px' }}
                ></textarea>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', marginTop: '1rem', borderRadius: '16px', fontSize: '1.1rem', fontWeight: '700' }}>
                Confirm Receipt
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;