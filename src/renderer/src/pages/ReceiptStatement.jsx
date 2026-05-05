import { useState, useEffect } from 'react';
import useStore from '../store/useStore';
import { 
  Receipt, 
  Search, 
  Filter, 
  Calendar, 
  Download, 
  Printer,
  TrendingDown,
  ChevronRight,
  User
} from 'lucide-react';

const ReceiptStatement = () => {
  const { receipts, refreshReceipts } = useStore();
  const [filters, setFilters] = useState({
    fromDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
    searchTerm: ''
  });

  useEffect(() => {
    refreshReceipts({ fromDate: filters.fromDate, toDate: filters.toDate });
  }, [filters.fromDate, filters.toDate]);

  const filteredReceipts = receipts.filter(r => 
    r.customer_name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
    (r.invoice_number && r.invoice_number.toLowerCase().includes(filters.searchTerm.toLowerCase()))
  );

  const totalReceived = (filteredReceipts || []).reduce((sum, r) => sum + r.amount, 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card" style={{ background: 'linear-gradient(135deg, #059669, #10b981)', color: 'white', border: 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '600', opacity: 0.9 }}>TOTAL RECEIPTS</span>
            <TrendingDown size={20} />
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: '800', margin: '0.5rem 0' }}>₹{totalReceived.toLocaleString()}</h2>
          <p style={{ fontSize: '0.75rem', opacity: 0.8 }}>Selected Period</p>
        </div>
        <div className="card">
          <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)' }}>TRANSACTION COUNT</span>
          <h2 style={{ margin: '0.5rem 0' }}>{(filteredReceipts || []).length}</h2>
          <div style={{ height: '4px', background: '#e2e8f0', borderRadius: '2px', marginTop: '1rem' }}>
            <div style={{ width: '70%', height: '100%', background: 'var(--accent-primary)', borderRadius: '2px' }}></div>
          </div>
        </div>
        <div className="card">
          <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)' }}>CASH RECEIPTS</span>
          <h2 style={{ margin: '0.5rem 0' }}>₹{(filteredReceipts || []).filter(r => r.payment_method === 'Cash').reduce((sum, r) => sum + r.amount, 0).toLocaleString()}</h2>
        </div>
        <div className="card">
          <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)' }}>OTHER MODES</span>
          <h2 style={{ margin: '0.5rem 0' }}>₹{(filteredReceipts || []).filter(r => r.payment_method !== 'Cash').reduce((sum, r) => sum + r.amount, 0).toLocaleString()}</h2>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="card" style={{ marginBottom: '2rem', padding: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontWeight: '700', fontSize: '0.8rem', marginBottom: '0.5rem' }}>SEARCH CUSTOMER / INVOICE</label>
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input 
                type="text" 
                placeholder="Type to search..." 
                style={{ paddingLeft: '2.5rem' }}
                value={filters.searchTerm}
                onChange={(e) => setFilters({...filters, searchTerm: e.target.value})}
              />
            </div>
          </div>
          <div style={{ width: '200px' }}>
            <label style={{ fontWeight: '700', fontSize: '0.8rem', marginBottom: '0.5rem' }}>FROM DATE</label>
            <input 
              type="date" 
              value={filters.fromDate}
              onChange={(e) => setFilters({...filters, fromDate: e.target.value})}
            />
          </div>
          <div style={{ width: '200px' }}>
            <label style={{ fontWeight: '700', fontSize: '0.8rem', marginBottom: '0.5rem' }}>TO DATE</label>
            <input 
              type="date" 
              value={filters.toDate}
              onChange={(e) => setFilters({...filters, toDate: e.target.value})}
            />
          </div>
          <button className="btn btn-outline" onClick={handlePrint} style={{ height: '42px' }}>
            <Printer size={18} /> Print
          </button>
          <button className="btn btn-primary" style={{ height: '42px' }}>
            <Download size={18} /> Export
          </button>
        </div>
      </div>

      {/* Receipts Table */}
      <div className="table-container" style={{ margin: 0 }}>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Customer Details</th>
              <th>Reference</th>
              <th>Payment Mode</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {filteredReceipts.length > 0 ? filteredReceipts.map((receipt) => (
              <tr key={receipt.id}>
                <td>
                  <div style={{ fontWeight: '600' }}>{receipt.payment_date}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Rec #{receipt.id}</div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' }}>
                      <User size={16} />
                    </div>
                    <div>
                      <div style={{ fontWeight: '700' }}>{receipt.customer_name}</div>
                    </div>
                  </div>
                </td>
                <td>
                  {receipt.invoice_number ? (
                    <span style={{ fontWeight: '600', color: 'var(--accent-primary)' }}>INV: {receipt.invoice_number}</span>
                  ) : (
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{receipt.description || 'General Receipt'}</span>
                  )}
                </td>
                <td>
                  <span style={{ 
                    padding: '4px 10px', 
                    borderRadius: '8px', 
                    fontSize: '0.75rem', 
                    fontWeight: '700',
                    background: receipt.payment_method === 'Cash' ? '#ecfdf5' : '#eff6ff',
                    color: receipt.payment_method === 'Cash' ? '#065f46' : '#1e40af',
                    border: `1px solid ${receipt.payment_method === 'Cash' ? '#d1fae5' : '#dbeafe'}`
                  }}>
                    {receipt.payment_method.toUpperCase()}
                  </span>
                </td>
                <td style={{ textAlign: 'right', fontWeight: '800', fontSize: '1.1rem', color: '#059669' }}>
                  ₹{receipt.amount.toLocaleString()}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
                  <Receipt size={48} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                  <p>No receipts found for the selected criteria.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <style>{`
        @media print {
          .sidebar, .header, .btn, .card:not(.stats-card) { display: none !important; }
          .main-content, .content-area { padding: 0 !important; overflow: visible !important; height: auto !important; }
          .table-container { border: none !important; box-shadow: none !important; }
          th { background: #f8fafc !important; border-bottom: 2px solid #e2e8f0 !important; }
        }
      `}</style>
    </div>
  );
};

export default ReceiptStatement;
