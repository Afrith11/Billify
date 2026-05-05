import { useState, useEffect } from 'react';
import useStore from '../store/useStore';
import { 
  RotateCcw, 
  Search, 
  Calendar, 
  ArrowLeftRight, 
  Plus, 
  ChevronRight,
  User,
  ShoppingBag,
  FileText,
  Trash2,
  Save,
  Undo2
} from 'lucide-react';

const Returns = () => {
  const { salesReturns, refreshSalesReturns, invoices, refreshInvoices, payables, refreshPayables, showNotification } = useStore();
  const [view, setView] = useState('list'); // 'list' or 'new'
  const [returnType, setReturnType] = useState('sales'); // 'sales' or 'purchase'
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [returnItems, setReturnItems] = useState([]);
  const [notes, setNotes] = useState('');
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    refreshSalesReturns();
    refreshPurchaseReturns();
    refreshInvoices();
    refreshPayables();
  }, []);

  const handleSelectInvoice = async (inv) => {
    setSelectedInvoice(inv);
    try {
      const items = await window.api.getInvoiceItems(inv.id);
      setReturnItems(items.map(item => ({
        ...item,
        returnQty: 0,
        soldQty: item.quantity // Keep track of original sold quantity
      })));
    } catch (error) {
      console.error('Error fetching items:', error);
      showNotification('Failed to load invoice items', 'error');
      setReturnItems([]);
    }
  };

  const addItemToReturn = (item) => {
    setReturnItems([...returnItems, { ...item, returnQty: 1 }]);
  };

  const updateReturnQty = (idx, qty) => {
    const newItems = [...returnItems];
    const val = isNaN(qty) ? 0 : qty;
    
    // Rule: Return quantity cannot exceed sold quantity and cannot be negative
    if (val < 0) return;
    if (val > newItems[idx].soldQty) {
      showNotification(`Return quantity cannot exceed sold quantity (${newItems[idx].soldQty})`, 'warning');
      return;
    }

    newItems[idx].returnQty = val;
    setReturnItems(newItems);
  };

  const removeItem = (idx) => {
    setReturnItems(returnItems.filter((_, i) => i !== idx));
  };

  const submitReturn = async () => {
    if (returnType === 'sales') {
      const itemsToReturn = returnItems.filter(i => i.returnQty > 0);
      if (!selectedInvoice || itemsToReturn.length === 0) {
        showNotification('Please select an invoice and specify return quantities.', 'error');
        return;
      }

      const totalAmount = (itemsToReturn || []).reduce((sum, i) => sum + (i.rate * (i.returnQty || 0)), 0);
      const gstAmount = totalAmount * 0.18;
      const netAmount = totalAmount + gstAmount;

      const returnData = {
        invoice_id: selectedInvoice.id,
        customer_id: selectedInvoice.customer_id,
        return_date: returnDate,
        total_amount: totalAmount,
        gst_amount: gstAmount,
        net_amount: netAmount,
        notes: notes,
        items: itemsToReturn.map(i => ({
          item_id: i.item_id,
          quantity: i.returnQty,
          rate: i.rate,
          amount: i.rate * i.returnQty,
          unit: i.unit,
          conversion_qty: i.conversion_qty
        }))
      };

      try {
        const result = await window.api.createSalesReturn(returnData);
        if (result.success) {
          showNotification(`Sales Return processed successfully`, 'success');
          resetForm();
        } else {
          showNotification('Error: ' + result.message, 'error');
        }
      } catch (error) {
        showNotification('System error occurred', 'error');
      }
    } else {
      // Purchase Return
      if (!selectedInvoice) {
        showNotification('Please select an expense to return.', 'error');
        return;
      }
      try {
        const res = await window.api.createPurchaseReturn({
          expense_id: selectedInvoice.id,
          return_date: returnDate,
          amount: selectedInvoice.amount,
          notes: notes
        });
        if (res.success) {
          showNotification('Purchase Return processed successfully', 'success');
          resetForm();
          refreshPayables();
        }
      } catch (err) {
        showNotification('Failed to process purchase return', 'error');
      }
    }
  };

  const resetForm = () => {
    setSelectedInvoice(null);
    setReturnItems([]);
    setNotes('');
    setView('list');
    refreshSalesReturns();
  };

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button 
          className={`btn ${view === 'list' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setView('list')}
        >
          Return History
        </button>
        <button 
          className={`btn ${view === 'new' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setView('new')}
        >
          <Plus size={18} /> New {returnType === 'sales' ? 'Sales' : 'Purchase'} Return
        </button>
        
        <div style={{ marginLeft: 'auto', display: 'flex', background: 'var(--bg-tertiary)', padding: '4px', borderRadius: '12px' }}>
          <button 
            onClick={() => { setReturnType('sales'); setSelectedInvoice(null); }}
            style={{ 
              padding: '6px 16px', 
              borderRadius: '10px', 
              border: 'none', 
              background: returnType === 'sales' ? 'white' : 'transparent',
              boxShadow: returnType === 'sales' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '0.85rem'
            }}
          >
            Sales
          </button>
          <button 
            onClick={() => { setReturnType('purchase'); setSelectedInvoice(null); }}
            style={{ 
              padding: '6px 16px', 
              borderRadius: '10px', 
              border: 'none', 
              background: returnType === 'purchase' ? 'white' : 'transparent',
              boxShadow: returnType === 'purchase' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '0.85rem'
            }}
          >
            Purchase
          </button>
        </div>
      </div>

      {view === 'list' ? (
        <div className="table-container" style={{ margin: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Return #</th>
                <th>Original Invoice</th>
                <th>Customer</th>
                <th style={{ textAlign: 'right' }}>Refund Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {returnType === 'sales' ? (
                salesReturns.length > 0 ? salesReturns.map(ret => (
                  <tr key={ret.id}>
                    <td>{ret.return_date}</td>
                    <td style={{ fontWeight: '700' }}>{ret.return_number}</td>
                    <td>#{ret.invoice_number}</td>
                    <td>{ret.customer_name}</td>
                    <td style={{ textAlign: 'right', fontWeight: '800', color: '#dc2626' }}>
                      ₹{ret.net_amount.toLocaleString()}
                    </td>
                    <td>
                      <span style={{ padding: '4px 8px', borderRadius: '6px', background: '#fef2f2', color: '#991b1b', fontSize: '0.7rem', fontWeight: '800' }}>
                        PROCESSED
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>No sales returns processed yet.</td></tr>
                )
              ) : (
                purchaseReturns.length > 0 ? purchaseReturns.map(ret => (
                  <tr key={ret.id}>
                    <td>{ret.return_date}</td>
                    <td style={{ fontWeight: '700' }}>PR-{ret.id}</td>
                    <td>Expense ID: {ret.expense_id}</td>
                    <td>{ret.vendor_name}</td>
                    <td style={{ textAlign: 'right', fontWeight: '800', color: '#dc2626' }}>
                      ₹{ret.amount.toLocaleString()}
                    </td>
                    <td>
                      <span style={{ padding: '4px 8px', borderRadius: '6px', background: '#ecfdf5', color: '#065f46', fontSize: '0.7rem', fontWeight: '800' }}>
                        RETURNED
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>No purchase returns processed yet.</td></tr>
                )
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '2rem' }}>
          {/* Main Return Form */}
          <div className="card">
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Undo2 size={24} color="var(--accent-primary)" /> Sales Return Form
            </h3>
            
            {!selectedInvoice ? (
              <div style={{ padding: '4rem', textAlign: 'center', background: '#f8fafc', borderRadius: '16px', border: '2px dashed #e2e8f0' }}>
                <FileText size={48} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                <p>Search and select an invoice from the right panel to begin.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Selected {returnType === 'sales' ? 'Invoice' : 'Expense'}</label>
                    <input type="text" value={returnType === 'sales' ? `#${selectedInvoice.invoice_number}` : selectedInvoice.title} disabled />
                  </div>
                  <div className="form-group">
                    <label>Return Date</label>
                    <input type="date" value={returnDate} onChange={e => setReturnDate(e.target.value)} />
                  </div>
                </div>

                {returnType === 'sales' ? (
                  <div className="table-container" style={{ margin: 0 }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Item Description</th>
                          <th style={{ textAlign: 'right', width: '100px' }}>Sold Qty</th>
                          <th style={{ width: '120px' }}>Return Qty</th>
                          <th style={{ textAlign: 'right' }}>Rate</th>
                          <th style={{ textAlign: 'right' }}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {returnItems.length > 0 ? returnItems.map((item, idx) => (
                          <tr key={idx} style={{ 
                            background: item.returnQty > 0 ? 'rgba(37, 99, 235, 0.05)' : 'transparent',
                            transition: 'background 0.3s ease'
                          }}>
                            <td>
                              <div style={{ fontWeight: item.returnQty > 0 ? '600' : '400' }}>{item.item_name}</div>
                            </td>
                            <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>{item.soldQty}</td>
                            <td>
                              <input 
                                type="number" 
                                min="0"
                                max={item.soldQty}
                                value={item.returnQty} 
                                onChange={e => updateReturnQty(idx, parseInt(e.target.value))}
                                style={{ 
                                  padding: '8px 12px', 
                                  width: '100%', 
                                  border: item.returnQty > 0 ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                                  borderRadius: '10px',
                                  fontWeight: '800',
                                  textAlign: 'center',
                                  transition: 'all 0.2s ease'
                                }}
                              />
                            </td>
                            <td style={{ textAlign: 'right' }}>₹{item.rate.toLocaleString()}</td>
                            <td style={{ textAlign: 'right', fontWeight: '700', color: item.returnQty > 0 ? 'var(--accent-primary)' : 'inherit' }}>
                              ₹{(item.rate * item.returnQty).toLocaleString()}
                            </td>
                          </tr>
                        )) : (
                          <tr><td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>Select an invoice to see items</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ padding: '2rem', background: '#fef2f2', borderRadius: '16px', border: '1px solid #fee2e2' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '0.85rem', color: '#991b1b', textTransform: 'uppercase', fontWeight: '700' }}>Expense to Return</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: '800' }}>{selectedInvoice.title}</div>
                        <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>Vendor: {selectedInvoice.vendor_name}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.85rem', color: '#991b1b', fontWeight: '700' }}>Refund Amount</div>
                        <div style={{ fontSize: '2rem', fontWeight: '900', color: '#dc2626' }}>₹{selectedInvoice.amount.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                )}

                <div style={{ 
                  background: '#f8fafc', 
                  padding: '1.5rem', 
                  borderRadius: '12px', 
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <h4 style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{returnType === 'sales' ? 'Total Return Amount' : 'Net Refund Value'}</h4>
                    <div style={{ fontSize: '1.5rem', fontWeight: '800', color: returnType === 'sales' ? 'var(--accent-primary)' : '#dc2626' }}>
                      ₹{returnType === 'sales' 
                        ? (returnItems || []).reduce((sum, i) => sum + (i.rate * (i.returnQty || 0)), 0).toLocaleString()
                        : selectedInvoice.amount.toLocaleString()
                      }
                    </div>
                  </div>
                  <div className="form-group" style={{ margin: 0, width: '50%' }}>
                    <label>Return Notes / Reason</label>
                    <textarea 
                      rows="2" 
                      placeholder="Enter reason for return..."
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      style={{ marginBottom: 0, borderRadius: '12px' }}
                    ></textarea>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                  <button className="btn btn-outline" onClick={() => setSelectedInvoice(null)}>Cancel</button>
                  <button className="btn btn-primary" onClick={submitReturn} style={{ padding: '12px 32px', borderRadius: '12px', gap: '10px' }}>
                    <Save size={20} /> Process Return
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Invoice/Expense Selection Sidebar */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h4 style={{ margin: 0 }}>Select {returnType === 'sales' ? 'Invoice' : 'Expense'}</h4>
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input type="text" placeholder="Search..." style={{ paddingLeft: '2.5rem' }} />
            </div>
            <div style={{ flex: 1, overflowY: 'auto', maxHeight: '500px' }}>
              {returnType === 'sales' ? (
                invoices.map(inv => (
                  <div 
                    key={inv.id}
                    onClick={() => handleSelectInvoice(inv)}
                    style={{ 
                      padding: '1rem', 
                      borderBottom: '1px solid var(--border-color)', 
                      cursor: 'pointer',
                      background: selectedInvoice?.id === inv.id ? '#f1f5f9' : 'transparent',
                      borderRadius: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: '700' }}>#{inv.invoice_number}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{inv.bill_date}</span>
                    </div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{inv.customer_name}</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--accent-primary)', marginTop: '4px' }}>₹{inv.net_amount.toLocaleString()}</div>
                  </div>
                ))
              ) : (
                payables.map(exp => (
                  <div 
                    key={exp.id}
                    onClick={() => setSelectedInvoice(exp)}
                    style={{ 
                      padding: '1rem', 
                      borderBottom: '1px solid var(--border-color)', 
                      cursor: 'pointer',
                      background: selectedInvoice?.id === exp.id ? '#f1f5f9' : 'transparent',
                      borderRadius: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: '700' }}>{exp.title}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{exp.expense_date}</span>
                    </div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{exp.vendor_name}</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#dc2626', marginTop: '4px' }}>₹{exp.amount.toLocaleString()}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Returns;
