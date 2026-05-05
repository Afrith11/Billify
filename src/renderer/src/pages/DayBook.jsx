import { useState, useEffect, useRef } from 'react';
import useStore from '../store/useStore';
import { Plus, Search, X, Printer, Trash2, Calendar, ShoppingBag, User, Percent, ReceiptIndianRupee, ChevronRight, AlertCircle } from 'lucide-react';
import InvoiceModal from '../components/InvoiceModal';

const DayBook = () => {
  const { customers, items, refreshItems, refreshCustomers, daybook, refreshDaybook, showNotification } = useStore();
  const [fromDate, setFromDate] = useState(new Date().toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  // New Expense State
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseNotes, setExpenseNotes] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const titleInputRef = useRef(null);

  useEffect(() => {
    if (isExpenseModalOpen && titleInputRef.current) {
      setTimeout(() => titleInputRef.current.focus(), 100);
    }
  }, [isExpenseModalOpen]);

  // New Bill State
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState('INV-0001');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [billItems, setBillItems] = useState([]);
  const [paymentType, setPaymentType] = useState('Cash');
  const [gstPercent, setGstPercent] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [tableSearchTerm, setTableSearchTerm] = useState('');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [goToPage, setGoToPage] = useState('');
  const [selectedInvoiceToPrint, setSelectedInvoiceToPrint] = useState(null);
  const [isInvoiceSaved, setIsInvoiceSaved] = useState(false);
  const [savedInvoiceId, setSavedInvoiceId] = useState(null);

  const fetchNextInvoiceNumber = async () => {
    if (!window.api?.getNextInvoiceNumber) {
      console.error("API getNextInvoiceNumber not available");
      return;
    }
    const num = await window.api.getNextInvoiceNumber();
    setNextInvoiceNumber(num);
  };

  useEffect(() => {
    refreshItems();
    refreshCustomers();
    handleFilter();
  }, []);

  const handleFilter = () => {
    refreshDaybook({ fromDate, toDate });
    setCurrentPage(1);
  };

  const handleAddItem = (item) => {
    const conversion = item.unit === 'Box' ? (item.conversion_qty || 1) : 1;
    const existing = billItems.find(i => i.id === item.id);
    const currentQtyInBill = existing ? existing.quantity : 0;
    
    // Check if adding 1 more unit exceeds stock
    const newQty = currentQtyInBill + 1;
    const stockNeeded = newQty * conversion;

    if (stockNeeded > item.quantity) {
      showNotification(`Insufficient stock! ${item.quantity} pcs available.`, 'error');
      return;
    }

    if (existing) {
      setBillItems(billItems.map(i => i.id === item.id ? { ...i, quantity: newQty, amount: newQty * i.rate } : i));
    } else {
      setBillItems([...billItems, { ...item, quantity: 1, amount: item.rate }]);
    }
  };

  const removeItem = (id) => {
    setBillItems(billItems.filter(i => i.id !== id));
  };

  const updateQty = (id, q, stock, unit, conversion) => {
    // Stock validation
    const actualStockNeeded = (unit === 'Box' && conversion) ? q * conversion : q;
    
    if (actualStockNeeded > stock) {
      const availableUnits = (unit === 'Box' && conversion) ? Math.floor(stock / conversion) : stock;
      showNotification(`Insufficient stock! Only ${availableUnits} ${unit} (${stock} pcs) available.`, 'error');
      return;
    }

    // Input validation
    if ((unit === 'Pcs' || unit === 'Box') && !Number.isInteger(q)) {
      return; // Silently ignore non-integers for Pcs/Box
    }

    setBillItems(billItems.map(i => i.id === id ? { ...i, quantity: q, amount: q * i.rate } : i));
  };

  // Calculations
  const subtotal = (billItems || []).reduce((sum, item) => sum + item.amount, 0);
  const gstAmount = (subtotal * gstPercent) / 100;
  const discountAmount = (subtotal * discountPercent) / 100;
  const netTotal = subtotal + gstAmount - discountAmount;

  const handleNewInvoice = () => {
    setIsModalOpen(true);
    setIsInvoiceSaved(false);
    setSavedInvoiceId(null);
    fetchNextInvoiceNumber();
  };

  const handleNewExpense = () => {
    setIsExpenseModalOpen(true);
  };

  const handleSubmitExpense = async () => {
    if (!expenseTitle) return showNotification('Please enter an expense title.', 'error');
    if (!expenseAmount || parseFloat(expenseAmount) <= 0) return showNotification('Please enter a valid amount greater than 0.', 'error');
    
    try {
      await window.api.addExpense({
        title: expenseTitle,
        amount: parseFloat(expenseAmount),
        date: expenseDate,
        notes: expenseNotes
      });
      setIsExpenseModalOpen(false);
      setExpenseTitle('');
      setExpenseAmount('');
      setExpenseNotes('');
      handleFilter();
      showNotification('Expense Added Successfully', 'success');
    } catch (err) {
      showNotification('Error: ' + err.message, 'error');
    }
  };


  const handleSubmitInvoice = async (shouldPrint = false) => {
    if (!selectedCustomer) return showNotification('Please select a customer.', 'error');
    if (billItems.length === 0) return showNotification('Please add at least one item.', 'error');

    try {
      let finalInvoiceId = savedInvoiceId;
      let finalInvoiceData = null;

      if (!isInvoiceSaved) {
        const freshInvoiceNo = await window.api.getNextInvoiceNumber();
        const invoiceData = {
          invoice_number: freshInvoiceNo,
          customer_id: selectedCustomer.id,
          customer_name: selectedCustomer.name,
          total_amount: subtotal,
          gst_amount: gstAmount,
          discount_amount: discountAmount,
          net_amount: netTotal,
          payment_type: paymentType,
          bill_date: fromDate,
          items: billItems
        };

        const result = await window.api.createInvoice(invoiceData);
        if (result.success) {
          finalInvoiceId = result.id;
          setIsInvoiceSaved(true);
          setSavedInvoiceId(result.id);
          showNotification('Invoice Saved Successfully', 'success');
          handleFilter();
          finalInvoiceData = { ...invoiceData, id: result.id };
        } else {
          throw new Error(result.message);
        }
      }

      if (shouldPrint) {
        // If we just saved it, we have finalInvoiceData. 
        // If it was already saved, we might need to fetch it or construct it.
        const printData = finalInvoiceData || {
          id: savedInvoiceId,
          invoice_number: nextInvoiceNumber,
          customer_name: selectedCustomer.name,
          total_amount: subtotal,
          gst_amount: gstAmount,
          discount_amount: discountAmount,
          net_amount: netTotal,
          payment_type: paymentType,
          bill_date: fromDate
        };
        
        setSelectedInvoiceToPrint(printData);
        setIsModalOpen(false);
        resetForm();
      } else {
        // Just saving, close modal and reset
        setIsModalOpen(false);
        resetForm();
      }
    } catch (err) {
      showNotification('Error: ' + err.message, 'error');
    }
  };

  const resetForm = () => {
    setSelectedCustomer(null);
    setBillItems([]);
    setPaymentType('Cash');
    setGstPercent(0);
    setDiscountPercent(0);
  };

  const filteredItems = (items || []).filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.item_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Summary Logic
  const totalDebit = (daybook || []).reduce((sum, r) => sum + r.debit, 0);
  const totalPayments = (daybook || []).filter(r => r.type === 'payment').reduce((sum, r) => sum + r.credit, 0);
  const totalExpenses = (daybook || []).filter(r => r.type === 'expense').reduce((sum, r) => sum + r.credit, 0);
  const totalReturns = (daybook || []).filter(r => r.type === 'return').reduce((sum, r) => sum + r.credit, 0);
  const totalCredit = totalPayments + totalExpenses + totalReturns;
  const netBalance = totalDebit - totalCredit;

  // Table Search Logic
  const filteredDaybook = (daybook || []).filter(row => 
    row.ref?.toLowerCase().includes(tableSearchTerm.toLowerCase()) ||
    row.customer_name?.toLowerCase().includes(tableSearchTerm.toLowerCase()) ||
    row.type?.toLowerCase().includes(tableSearchTerm.toLowerCase())
  );

  // Pagination Logic
  const totalRecords = filteredDaybook.length;
  const isFiltered = tableSearchTerm.length > 0;
  const totalPages = Math.ceil(totalRecords / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalRecords);
  const paginatedData = filteredDaybook.slice(startIndex, endIndex);

  const goToPageNumber = (num) => {
    const page = Math.max(1, Math.min(num, totalPages));
    setCurrentPage(page);
    setGoToPage('');
  };

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '4px' }}>Day Book</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Comprehensive sales, payments and expense tracking</p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: 'white', padding: '10px 15px', borderRadius: '16px', boxShadow: 'var(--premium-shadow)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '0.75rem', margin: 0, fontWeight: '700', color: 'var(--text-secondary)' }}>FROM</label>
            <input 
              type="date" 
              value={fromDate} 
              onChange={e => setFromDate(e.target.value)} 
              style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }} 
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '0.75rem', margin: 0, fontWeight: '700', color: 'var(--text-secondary)' }}>TO</label>
            <input 
              type="date" 
              value={toDate} 
              onChange={e => setToDate(e.target.value)} 
              style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }} 
            />
          </div>

          <div style={{ position: 'relative', marginLeft: '1rem' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              placeholder="Search transactions..." 
              value={tableSearchTerm}
              onChange={(e) => {
                setTableSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              style={{ 
                paddingLeft: '2.25rem', 
                paddingRight: '1rem', 
                paddingTop: '6px', 
                paddingBottom: '6px', 
                borderRadius: '8px', 
                border: '1px solid var(--border-color)', 
                fontSize: '0.85rem',
                width: '200px'
              }} 
            />
          </div>
          <button 
            className="btn btn-primary" 
            onClick={handleFilter} 
            style={{ padding: '8px 16px', borderRadius: '10px', fontSize: '0.85rem' }}
          >
            Apply Filter
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div className="card" style={{ padding: '1.25rem', borderRadius: '20px', borderLeft: '5px solid var(--success)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>Total Sales</p>
          <p style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--success)' }}>₹{totalDebit.toLocaleString()}</p>
        </div>
        <div className="card" style={{ padding: '1.25rem', borderRadius: '20px', borderLeft: '5px solid #3b82f6', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>Total Payments</p>
          <p style={{ fontSize: '1.25rem', fontWeight: '900', color: '#3b82f6' }}>₹{totalPayments.toLocaleString()}</p>
        </div>
        <div className="card" style={{ padding: '1.25rem', borderRadius: '20px', borderLeft: '5px solid #ef4444', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>Sales Returns</p>
          <p style={{ fontSize: '1.25rem', fontWeight: '900', color: '#ef4444' }}>₹{totalReturns.toLocaleString()}</p>
        </div>
        <div className="card" style={{ padding: '1.25rem', borderRadius: '20px', borderLeft: '5px solid #f97316', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>Expenses</p>
          <p style={{ fontSize: '1.25rem', fontWeight: '900', color: '#f97316' }}>₹{totalExpenses.toLocaleString()}</p>
        </div>
        <div className="card" style={{ padding: '1.25rem', borderRadius: '20px', borderLeft: '5px solid var(--accent-primary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>Net Cash Flow</p>
          <p style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--accent-primary)' }}>₹{netBalance.toLocaleString()}</p>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginBottom: '1.5rem' }}>
        <button className="btn btn-primary" onClick={handleNewInvoice} style={{ borderRadius: '12px' }}>
          <Plus size={18} /> New Invoice
        </button>
        <button className="btn btn-outline" onClick={handleNewExpense} style={{ borderRadius: '12px' }}>
          <Plus size={18} /> Add Expense
        </button>
      </div>

      <div className="table-container" style={{ border: 'none', background: 'white', boxShadow: 'var(--premium-shadow)', borderRadius: '20px' }}>
        <table style={{ borderCollapse: 'separate', borderSpacing: '0' }}>
          <thead>
            <tr style={{ background: 'var(--bg-tertiary)' }}>
              <th style={{ borderRadius: '20px 0 0 0', padding: '1.25rem' }}>Date</th>
              <th style={{ padding: '1.25rem' }}>Reference</th>
              <th style={{ padding: '1.25rem' }}>Type</th>
              <th style={{ padding: '1.25rem' }}>Debit (+)</th>
              <th style={{ padding: '1.25rem' }}>Credit (-)</th>
              <th style={{ borderRadius: '0 20px 0 0', padding: '1.25rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(paginatedData || []).map((row, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '1.25rem' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{row.date}</div>
                </td>
                <td style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{row.ref}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{row.customer_name}</span>
                  </div>
                </td>
                <td style={{ padding: '1.25rem' }}>
                  <span style={{
                    padding: '0.3rem 0.6rem',
                    borderRadius: '8px',
                    fontSize: '0.7rem',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    background: row.type === 'invoice' ? '#3b82f615' : 
                                row.type === 'payment' ? '#10b98115' : 
                                row.type === 'return' ? '#ef444415' : '#f9731615',
                    color: row.type === 'invoice' ? '#3b82f6' : 
                           row.type === 'payment' ? '#10b981' : 
                           row.type === 'return' ? '#ef4444' : '#f97316'
                  }}>
                    {row.type}
                  </span>
                </td>
                <td style={{ padding: '1.25rem', fontWeight: '700', color: row.debit > 0 ? 'var(--success)' : 'var(--text-secondary)' }}>
                  {row.debit > 0 ? `+ ₹${row.debit.toLocaleString()}` : '-'}
                </td>
                <td style={{ padding: '1.25rem', fontWeight: '700', color: row.credit > 0 ? 'var(--error)' : 'var(--text-secondary)' }}>
                  {row.credit > 0 ? `- ₹${row.credit.toLocaleString()}` : '-'}
                </td>
                <td style={{ textAlign: 'right' }}>
                  {row.type === 'invoice' && (
                    <button 
                      className="btn btn-outline btn-icon" 
                      style={{ padding: '0.6rem', borderRadius: '12px' }}
                      onClick={() => setSelectedInvoiceToPrint({ ...row, from_history: true })}
                    >
                      <Printer size={18} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {(daybook || []).length === 0 && (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: 0.3 }}>
                  <ShoppingBag size={64} style={{ marginBottom: '1rem' }} />
                  <p style={{ fontSize: '1.1rem', fontWeight: '600' }}>No records for this period</p>
                </div>
              </td></tr>
            )}
          </tbody>
        </table>

        {/* Pagination Controls */}
        {totalRecords > 0 && (
          <div style={{ 
            padding: '1.25rem 2rem', 
            borderTop: '1px solid var(--border-color)', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            background: 'white',
            borderRadius: '0 0 20px 20px',
            position: 'sticky',
            bottom: 0,
            zIndex: 10,
            boxShadow: '0 -4px 10px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
                Showing <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{totalRecords > 0 ? startIndex + 1 : 0}–{endIndex}</span> of <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{totalRecords}</span> {isFiltered ? 'filtered entries' : 'entries'}
              </span>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>Rows per page:</label>
                <select 
                  value={itemsPerPage} 
                  onChange={(e) => {
                    setItemsPerPage(parseInt(e.target.value));
                    setCurrentPage(1);
                  }}
                  style={{ 
                    padding: '4px 8px', 
                    borderRadius: '8px', 
                    border: '1px solid var(--border-color)', 
                    fontSize: '0.85rem',
                    width: 'auto',
                    background: 'white'
                  }}
                >
                  {[15, 30, 50, 100, 500].map(val => (
                    <option key={val} value={val}>{val}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {/* Go to Page */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: '1rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Go to:</span>
                <input 
                  type="number" 
                  value={goToPage}
                  onChange={(e) => setGoToPage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && goToPageNumber(parseInt(goToPage))}
                  placeholder="Page"
                  style={{ width: '60px', padding: '4px 8px', borderRadius: '8px', fontSize: '0.85rem', background: 'white' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  className="btn btn-outline" 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                  style={{ padding: '6px 12px', fontSize: '0.85rem', borderRadius: '8px', opacity: currentPage === 1 ? 0.5 : 1 }}
                >
                  « Prev
                </button>
                
                {/* Page Numbers */}
                {[...Array(totalPages)].map((_, i) => {
                  const pageNum = i + 1;
                  // Show current page, first, last, and neighbors
                  if (
                    pageNum === 1 || 
                    pageNum === totalPages || 
                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                  ) {
                    return (
                      <button 
                        key={pageNum}
                        className={`btn ${currentPage === pageNum ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => setCurrentPage(pageNum)}
                        style={{ 
                          padding: '6px 12px', 
                          fontSize: '0.85rem', 
                          borderRadius: '8px',
                          minWidth: '36px',
                          justifyContent: 'center',
                          background: currentPage === pageNum ? 'var(--accent-primary)' : 'white',
                          boxShadow: currentPage === pageNum ? '0 4px 6px rgba(79, 70, 229, 0.2)' : 'none'
                        }}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                  if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                    return <span key={pageNum} style={{ color: 'var(--text-secondary)' }}>...</span>;
                  }
                  return null;
                })}

                <button 
                  className="btn btn-outline" 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  style={{ padding: '6px 12px', fontSize: '0.85rem', borderRadius: '8px', opacity: currentPage === totalPages ? 0.5 : 1 }}
                >
                  Next »
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Expense Modal */}
      {isExpenseModalOpen && (
        <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center' }}>
          <div className="modal-content" style={{ 
            maxWidth: '500px', 
            borderRadius: '24px', 
            padding: '2rem', 
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: '#fef3c7', padding: '10px', borderRadius: '12px', color: '#d97706' }}>
                  <ReceiptIndianRupee size={24} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: '800', margin: 0 }}>Add Expense</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>Log a new business expenditure</p>
                </div>
              </div>
              <button 
                onClick={() => setIsExpenseModalOpen(false)} 
                style={{ 
                  background: '#f1f5f9', 
                  border: 'none', 
                  padding: '8px', 
                  borderRadius: '12px', 
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
              >
                <X size={20} />
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Row 1: Title */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontWeight: '500', color: 'var(--text-primary)', marginBottom: '8px', display: 'block' }}>
                  Expense Title <span style={{ color: 'var(--error)' }}>*</span>
                </label>
                <input 
                  ref={titleInputRef}
                  placeholder="e.g. Monthly Rent, Office Supplies" 
                  value={expenseTitle} 
                  onChange={e => setExpenseTitle(e.target.value)} 
                  style={{ 
                    borderRadius: '12px', 
                    padding: '14px', 
                    border: '1px solid var(--border-color)',
                    fontSize: '1rem'
                  }}
                />
              </div>

              {/* Row 2: Amount and Date */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontWeight: '500', color: 'var(--text-primary)', marginBottom: '8px', display: 'block' }}>
                    Amount (₹) <span style={{ color: 'var(--error)' }}>*</span>
                  </label>
                  <input 
                    type="number" 
                    placeholder="0.00" 
                    value={expenseAmount} 
                    onChange={e => setExpenseAmount(e.target.value)} 
                    style={{ 
                      borderRadius: '12px', 
                      padding: '14px', 
                      border: '1px solid var(--border-color)',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontWeight: '500', color: 'var(--text-primary)', marginBottom: '8px', display: 'block' }}>
                    Date <span style={{ color: 'var(--error)' }}>*</span>
                  </label>
                  <input 
                    type="date" 
                    value={expenseDate} 
                    onChange={e => setExpenseDate(e.target.value)} 
                    style={{ 
                      borderRadius: '12px', 
                      padding: '14px', 
                      border: '1px solid var(--border-color)',
                      fontSize: '1rem'
                    }}
                  />
                </div>
              </div>

              {/* Row 3: Notes */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontWeight: '500', color: 'var(--text-primary)', marginBottom: '8px', display: 'block' }}>
                  Notes (Optional)
                </label>
                <textarea 
                  placeholder="Add any additional details or remarks..." 
                  value={expenseNotes} 
                  onChange={e => setExpenseNotes(e.target.value)}
                  style={{ 
                    width: '100%', 
                    borderRadius: '12px', 
                    border: '1px solid var(--border-color)', 
                    padding: '14px', 
                    minHeight: '100px',
                    fontSize: '0.95rem',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ marginTop: '0.5rem' }}>
                <button 
                  className="btn btn-primary" 
                  onClick={handleSubmitExpense}
                  style={{ 
                    width: '100%', 
                    padding: '14px', 
                    borderRadius: '16px', 
                    fontWeight: '700', 
                    fontSize: '1.05rem',
                    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  Save Expense
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '1200px' }}>
            <div className="invoice-container">
              {/* Left Column: Product Selection */}
              <div className="items-panel">
                <div className="items-panel-header">
                  <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1rem' }}>Select Items</h2>
                  <div style={{ position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <input
                      placeholder="Search items..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ paddingLeft: '2.5rem', width: '100%', borderRadius: '12px', border: '1px solid #ddd' }}
                    />
                  </div>
                </div>

                <div className="items-panel-list">
                   {(filteredItems || []).map(item => (
                    <div
                      key={item.id}
                      className="item-card"
                      onClick={() => handleAddItem(item)}
                    >
                      <div className="plus-icon">
                        <Plus size={16} />
                      </div>
                      
                      <h4>{item.name}</h4>

                      <p className="meta">
                        Category: {item.category}
                      </p>

                      <p className="meta">
                        Size: {item.size} | Color: {item.color}
                      </p>

                      <p className="stock" style={{ color: item.quantity <= 5 ? 'var(--error)' : 'var(--success)' }}>
                        Stock: {item.quantity} {item.unit}
                        {item.quantity <= 5 && <span style={{ marginLeft: '8px', fontSize: '0.7rem', color: 'var(--error)', background: '#fee2e2', padding: '2px 6px', borderRadius: '4px' }}>Low</span>}
                      </p>

                      <div className="price">
                        ₹{item.rate.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Bill Review */}
              <div className="invoice-panel">
                <div className="invoice-content">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                    <div>
                      <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }}>New Invoice <span style={{ color: 'var(--accent-primary)', marginLeft: '8px' }}>{nextInvoiceNumber}</span></h2>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Review items and finalize payment</p>
                    </div>
                    <button onClick={() => setIsModalOpen(false)} style={{ background: '#f1f5f9', border: 'none', padding: '10px', borderRadius: '14px', cursor: 'pointer' }}>
                      <X size={20} />
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><User size={14} /> Select Customer</label>
                      <select
                        onChange={(e) => setSelectedCustomer(customers.find(c => c.id === parseInt(e.target.value)))}
                        value={selectedCustomer?.id || ''}
                        style={{ borderRadius: '12px', background: '#f8fafc' }}
                      >
                        <option value="">-- Choose Profile --</option>
                        {(customers || []).map(c => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
                      </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><ReceiptIndianRupee size={14} /> Payment Mode</label>
                      <div style={{ display: 'flex', gap: '0.5rem', background: '#f8fafc', padding: '4px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                        <button
                          onClick={() => setPaymentType('Cash')}
                          style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: paymentType === 'Cash' ? 'white' : 'transparent', boxShadow: paymentType === 'Cash' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', fontWeight: '600', color: paymentType === 'Cash' ? 'var(--success)' : 'var(--text-secondary)', cursor: 'pointer' }}
                        >Cash</button>
                        <button
                          onClick={() => setPaymentType('Credit')}
                          style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: paymentType === 'Credit' ? 'white' : 'transparent', boxShadow: paymentType === 'Credit' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', fontWeight: '600', color: paymentType === 'Credit' ? 'var(--accent-primary)' : 'var(--text-secondary)', cursor: 'pointer' }}
                        >Credit</button>
                      </div>
                    </div>
                  </div>

                  <table className="modern-invoice-table" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem' }}>
                    <thead>
                      <tr style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', borderBottom: '2px solid var(--bg-tertiary)' }}>
                        <th style={{ textAlign: 'left', padding: '12px' }}>Item Details</th>
                        <th style={{ textAlign: 'center', padding: '12px' }}>Qty</th>
                        <th style={{ textAlign: 'center', padding: '12px' }}>Rate</th>
                        <th style={{ textAlign: 'right', padding: '12px' }}>Total</th>
                        <th style={{ width: '40px', padding: '12px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {(billItems || []).map(item => {
                        const originalItem = items.find(i => i.id === item.id);
                        return (
                          <tr key={item.id}>
                            <td>
                              <p style={{ fontWeight: '600' }}>{item.name}</p>
                              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Size: {item.size}</p>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <input
                                type="number"
                                step={item.unit === 'Meters' ? '0.01' : '1'}
                                value={item.quantity}
                                onChange={(e) => updateQty(item.id, parseFloat(e.target.value) || 0, originalItem.quantity, item.unit, item.conversion_qty)}
                                style={{ width: '80px', padding: '6px', borderRadius: '8px', textAlign: 'center', border: '1px solid #eee' }}
                              />
                              {item.unit === 'Box' && item.conversion_qty && (
                                <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                  ({(item.quantity * item.conversion_qty).toLocaleString()} pcs)
                                </p>
                              )}
                            </td>
                            <td style={{ textAlign: 'center', fontWeight: '500' }}>₹{item.rate}</td>
                            <td style={{ textAlign: 'right', fontWeight: '700' }}>₹{item.amount.toLocaleString()}</td>
                            <td style={{ textAlign: 'right' }}>
                              <button onClick={() => removeItem(item.id)} className="btn-icon" style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer' }}><Trash2 size={16} /></button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {billItems.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                      <AlertCircle size={40} style={{ opacity: 0.2 }} />
                      <p>Start by selecting items from the left panel</p>
                    </div>
                  )}

                  <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '24px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}><Percent size={12} /> GST (%)</label>
                        <input type="number" value={gstPercent} onChange={e => setGstPercent(parseFloat(e.target.value) || 0)} style={{ background: 'white', borderRadius: '10px' }} />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}><Percent size={12} /> Discount (%)</label>
                        <input type="number" value={discountPercent} onChange={e => setDiscountPercent(parseFloat(e.target.value) || 0)} style={{ background: 'white', borderRadius: '10px' }} />
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        <span>Subtotal ({billItems.length} items)</span>
                        <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>₹{subtotal.toLocaleString()}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        <span>Tax / GST</span>
                        <span style={{ color: '#6366f1', fontWeight: '600' }}>+ ₹{gstAmount.toLocaleString()}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        <span>Total Discount</span>
                        <span style={{ color: 'var(--success)', fontWeight: '600' }}>- ₹{discountAmount.toLocaleString()}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', paddingTop: '1rem', borderTop: '2px dashed #e2e8f0' }}>
                        <span style={{ fontSize: '1.25rem', fontWeight: '800' }}>Grand Total</span>
                        <span style={{ fontSize: '1.75rem', fontWeight: '900', color: 'var(--accent-primary)', letterSpacing: '-0.02em' }}>₹{netTotal.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="invoice-footer" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <button
                    className="btn btn-outline"
                    disabled={!selectedCustomer || billItems.length === 0 || isInvoiceSaved}
                    style={{ 
                      padding: '1.25rem', 
                      borderRadius: '20px', 
                      fontSize: '1.1rem', 
                      fontWeight: '800', 
                      opacity: (!selectedCustomer || billItems.length === 0 || isInvoiceSaved) ? 0.6 : 1,
                    }}
                    onClick={() => handleSubmitInvoice(false)}
                  >
                    {isInvoiceSaved ? 'Invoice Saved' : 'Create Invoice'}
                  </button>
                  <button
                    className="btn btn-primary"
                    disabled={!selectedCustomer || billItems.length === 0}
                    style={{ 
                      padding: '1.25rem', 
                      borderRadius: '20px', 
                      fontSize: '1.1rem', 
                      fontWeight: '800', 
                      boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.3)',
                      opacity: (!selectedCustomer || billItems.length === 0) ? 0.6 : 1,
                    }}
                    onClick={() => handleSubmitInvoice(true)}
                  >
                    <Printer size={20} /> Print Invoice
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedInvoiceToPrint && (
        <InvoiceModal 
          invoice={selectedInvoiceToPrint} 
          onClose={() => {
            setSelectedInvoiceToPrint(null);
            setIsInvoiceSaved(false);
            setSavedInvoiceId(null);
          }}
          autoPrint={!selectedInvoiceToPrint.from_history} // Only autoprint if it's not from the daybook table click
        />
      )}
    </div>
  );
};

export default DayBook;