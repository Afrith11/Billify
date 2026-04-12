import { useState, useEffect } from 'react';
import useStore from '../store/useStore';
import { Plus, Search, X, Printer, Trash2, Calendar } from 'lucide-react';

const DayBook = () => {
  const { customers, items, refreshItems, refreshCustomers } = useStore();
  const [bills, setBills] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // New Bill State
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [billItems, setBillItems] = useState([]);
  const [paymentType, setPaymentType] = useState('Cash');
  const [paidAmount, setPaidAmount] = useState(0);

  useEffect(() => {
    refreshItems();
    refreshCustomers();
    loadBills();
  }, [selectedDate]);

  const loadBills = async () => {
    const data = await window.api.getBills({ date: selectedDate });
    setBills(data);
  };

  const handleAddItem = (item) => {
    const existing = billItems.find(i => i.id === item.id);
    if (existing) {
      setBillItems(billItems.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1, amount: (i.quantity + 1) * i.rate } : i));
    } else {
      setBillItems([...billItems, { ...item, quantity: 1, amount: item.rate }]);
    }
  };

  const removeItem = (id) => {
    setBillItems(billItems.filter(i => i.id !== id));
  };

  const updateQty = (id, q) => {
    setBillItems(billItems.map(i => i.id === id ? { ...i, quantity: q, amount: q * i.rate } : i));
  };

  const totalAmount = billItems.reduce((sum, item) => sum + item.amount, 0);

  const handleSubmitBill = async () => {
    if (!selectedCustomer) return alert('Select a customer');
    if (billItems.length === 0) return alert('Add items to bill');

    const billData = {
      invoice_number: `INV-${Date.now().toString().slice(-6)}`,
      customer_id: selectedCustomer.id,
      customer_name: selectedCustomer.name,
      total_amount: totalAmount,
      payment_type: paymentType,
      paid_amount: paymentType === 'Cash' ? totalAmount : paidAmount,
      bill_date: selectedDate,
      items: billItems
    };

    await window.api.createBill(billData);
    setIsModalOpen(false);
    resetForm();
    loadBills();
    alert('Bill generated successfully!');
  };

  const resetForm = () => {
    setSelectedCustomer(null);
    setBillItems([]);
    setPaymentType('Cash');
    setPaidAmount(0);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ position: 'relative' }}>
            <Calendar size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input 
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ paddingLeft: '2.5rem', width: '180px' }}
            />
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> New Bill
        </button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Total Amount</th>
              <th>Payment</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bills.map(bill => (
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
                <td>
                  <button className="btn btn-outline" style={{ padding: '0.4rem' }}><Printer size={14} /></button>
                </td>
              </tr>
            ))}
            {bills.length === 0 && (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>No bills found for this date</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '900px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2>Create New Bill</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div>
                <div className="form-group">
                  <label>Select Customer</label>
                  <select onChange={(e) => setSelectedCustomer(customers.find(c => c.id === parseInt(e.target.value)))} value={selectedCustomer?.id || ''}>
                    <option value="">-- Choose Customer --</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label>Search and Add Items</label>
                  <div className="table-container" style={{ maxHeight: '300px', overflowY: 'auto', marginTop: '0.5rem' }}>
                    <table>
                      <thead><tr><th>Item</th><th>Rate</th><th>Add</th></tr></thead>
                      <tbody>
                        {items.map(item => (
                          <tr key={item.id}>
                            <td>{item.name}</td>
                            <td>₹{item.rate}</td>
                            <td><button onClick={() => handleAddItem(item)} className="btn btn-primary" style={{ padding: '0.3rem' }}><Plus size={14} /></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '1.5rem' }}>
                <h3>Bill Details</h3>
                <div className="table-container" style={{ marginTop: '1rem', maxHeight: '250px', overflowY: 'auto' }}>
                  <table>
                    <thead><tr><th>Item</th><th>Qty</th><th>Amt</th><th></th></tr></thead>
                    <tbody>
                      {billItems.map(item => (
                        <tr key={item.id}>
                          <td>{item.name}</td>
                          <td><input type="number" value={item.quantity} onChange={(e) => updateQty(item.id, parseInt(e.target.value))} style={{ width: '50px', padding: '0.2rem' }} /></td>
                          <td>₹{item.amount}</td>
                          <td><button onClick={() => removeItem(item.id)} style={{ background: 'none', border: 'none', color: 'var(--error)' }}><Trash2 size={14} /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ marginTop: '1.5rem', background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span>Subtotal:</span>
                    <span>₹{totalAmount}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--accent-primary)' }}>
                    <span>Total:</span>
                    <span>₹{totalAmount}</span>
                  </div>
                </div>

                <div style={{ marginTop: '1.5rem' }}>
                  <label>Payment Mode</label>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                    <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input type="radio" name="pay" value="Cash" checked={paymentType === 'Cash'} onChange={() => setPaymentType('Cash')} style={{ width: 'auto' }} /> Cash
                    </label>
                    <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input type="radio" name="pay" value="Credit" checked={paymentType === 'Credit'} onChange={() => setPaymentType('Credit')} style={{ width: 'auto' }} /> Credit
                    </label>
                  </div>
                </div>

                <button 
                  className="btn btn-primary" 
                  style={{ width: '100%', marginTop: '1.5rem', padding: '1rem' }}
                  onClick={handleSubmitBill}
                >
                  Confirm & Finalize Bill
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DayBook;
