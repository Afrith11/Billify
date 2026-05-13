import { useState, useEffect } from 'react';
import useStore from '../store/useStore';
import { 
  Printer, 
  Download, 
  Edit, 
  Trash2, 
  ArrowLeft, 
  Building2, 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  CreditCard, 
  FileText,
  AlertCircle
} from 'lucide-react';
import logoFallback from '../assets/billify.png';

const InvoiceDetails = () => {
  const { selectedInvoiceId, setActivePage, settings, showNotification } = useStore();
  const [invoice, setInvoice] = useState(null);
  const [items, setItems] = useState([]);
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedInvoiceId) {
      fetchInvoiceData();
    }
  }, [selectedInvoiceId]);

  const fetchInvoiceData = async () => {
    setLoading(true);
    try {
      const invData = await window.api.getInvoiceById(selectedInvoiceId);
      if (invData) {
        setInvoice(invData);
        const itemData = await window.api.getInvoiceItems(selectedInvoiceId);
        setItems(itemData || []);
        const returnData = await window.api.getInvoiceReturns(selectedInvoiceId);
        setReturns(returnData || []);
      } else {
        showNotification('Invoice not found', 'error');
        setActivePage('daybook');
      }
    } catch (err) {
      console.error('Failed to fetch invoice details:', err);
      showNotification('Error loading invoice details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    // For now, reuse print as it allows saving as PDF
    window.print();
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this invoice? This action cannot be undone and will reverse stock changes.')) {
      try {
        const res = await window.api.deleteInvoice(selectedInvoiceId);
        if (res.success) {
          showNotification('Invoice deleted and stock reversed', 'success');
          setActivePage('daybook');
        } else {
          showNotification('Error: ' + res.message, 'error');
        }
      } catch (err) {
        showNotification('Failed to delete invoice', 'error');
      }
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div className="loader">Loading Invoice Details...</div>
      </div>
    );
  }

  if (!invoice) return null;

  const totalReturnAmount = (returns || []).reduce((sum, r) => sum + (r.amount || 0), 0);
  const finalBalance = (invoice.net_amount || 0) - totalReturnAmount;

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out', paddingBottom: '4rem' }}>
      {/* Action Bar */}
      <div className="no-print" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '2rem',
        background: 'white',
        padding: '1rem 1.5rem',
        borderRadius: '16px',
        boxShadow: 'var(--premium-shadow)'
      }}>
        <button className="btn btn-outline" onClick={() => setActivePage('daybook')} style={{ gap: '8px' }}>
          <ArrowLeft size={18} /> Back to Day Book
        </button>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-primary" onClick={handlePrint} style={{ gap: '8px' }}>
            <Printer size={18} /> Print
          </button>
          <button className="btn btn-outline" onClick={handleDownloadPDF} style={{ gap: '8px' }}>
            <Download size={18} /> PDF
          </button>
          <button className="btn btn-outline" style={{ gap: '8px' }}>
            <Edit size={18} /> Edit
          </button>
          <button className="btn btn-outline" onClick={handleDelete} style={{ gap: '8px', color: '#ef4444', borderColor: '#fee2e2' }}>
            <Trash2 size={18} /> Delete
          </button>
        </div>
      </div>

      {/* Invoice Content */}
      <div className="invoice-print-area" style={{ 
        background: 'white', 
        borderRadius: '24px', 
        boxShadow: 'var(--premium-shadow)',
        overflow: 'hidden',
        border: '1px solid #f1f5f9'
      }}>
        {/* Header Ribbon */}
        <div style={{ 
          background: 'linear-gradient(90deg, var(--accent-primary), #818cf8)', 
          height: '8px' 
        }}></div>

        <div style={{ padding: '2rem' }}>
          {/* Top Section: Branding & Invoice Meta */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
              <div style={{ 
                width: '90px', 
                height: '90px', 
                background: 'white', 
                border: '1px solid #f1f5f9', 
                borderRadius: '20px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                padding: '10px',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
              }}>
                <img 
                  src={settings?.company_logo || logoFallback} 
                  alt="Logo" 
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
                />
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: '900', letterSpacing: '-0.02em', color: '#1e293b' }}>
                  {settings?.company_name || 'Billify Solutions'}
                </h1>
                <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '6px', color: '#64748b', fontSize: '0.95rem' }}>
                  <p style={{ margin: 0, display: 'flex', gap: '8px', alignItems: 'center' }}><MapPin size={16} /> {settings?.company_address || '-'}</p>
                  <div style={{ display: 'flex', gap: '20px' }}>
                    <p style={{ margin: 0, display: 'flex', gap: '8px', alignItems: 'center' }}><Phone size={16} /> {settings?.company_phone || '-'}</p>
                    <p style={{ margin: 0, display: 'flex', gap: '8px', alignItems: 'center' }}><Mail size={16} /> {settings?.company_email || '-'}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '20px', fontWeight: '700', color: '#334155', marginTop: '4px' }}>
                    {settings?.company_gst && <span>GSTIN: {settings.company_gst}</span>}
                    {settings?.company_pan && <span>PAN: {settings.company_pan}</span>}
                  </div>
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ 
                display: 'inline-block', 
                padding: '0.5rem 1.25rem', 
                background: '#f8fafc', 
                borderRadius: '12px', 
                color: 'var(--accent-primary)', 
                fontWeight: '800', 
                fontSize: '0.85rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '1rem'
              }}>
                Tax Invoice
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '800', margin: 0 }}>#{invoice.invoice_number}</h2>
              <div style={{ marginTop: '1.5rem' }}>
                <div style={{ marginBottom: '12px' }}>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>Date</p>
                  <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>{invoice.bill_date ? new Date(invoice.bill_date).toLocaleDateString() : '-'}</p>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>Status</p>
                  <p style={{ margin: 0 }}>
                    <span style={{ 
                      display: 'inline-block',
                      padding: '4px 12px',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: '800',
                      background: invoice.status === 'Paid' ? '#dcfce7' : invoice.status === 'Returned' ? '#fee2e2' : '#fef9c3',
                      color: invoice.status === 'Paid' ? '#166534' : invoice.status === 'Returned' ? '#991b1b' : '#854d0e'
                    }}>
                      {invoice.status || 'Pending'}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Billing Info Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
            <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '20px', border: '1px solid #f1f5f9' }}>
              <p style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: '800', color: '#94a3b8', letterSpacing: '0.1em', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={14} /> Bill To
              </p>
              <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', color: '#1e293b' }}>{invoice.customer_name}</h3>
              <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '6px', color: '#475569', fontSize: '1rem' }}>
                <p style={{ margin: 0 }}>{invoice.customer_address || 'No address provided'}</p>
                <p style={{ margin: 0, fontWeight: '600' }}>{invoice.customer_phone}</p>
                {invoice.customer_gst && <p style={{ margin: 0, color: 'var(--accent-primary)', fontWeight: '700' }}>GSTIN: {invoice.customer_gst}</p>}
              </div>
            </div>
            <div style={{ padding: '1.25rem' }}>
              <p style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: '800', color: '#94a3b8', letterSpacing: '0.1em', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CreditCard size={14} /> Payment Details
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Method</p>
                  <p style={{ margin: 0, fontWeight: '700', fontSize: '1.1rem' }}>{invoice.payment_type}</p>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Amount Status</p>
                  <p style={{ margin: 0, fontWeight: '700', color: invoice.status === 'Paid' ? '#10b981' : '#f59e0b' }}>
                    {invoice.status === 'Paid' ? 'Fully Settled' : 'Payment Pending'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="table-container" style={{ margin: '0 0 2rem 0', border: 'none', boxShadow: 'none' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', borderRadius: '12px 0 0 12px', color: '#64748b', fontSize: '0.8rem' }}>#</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: '#64748b', fontSize: '0.8rem' }}>Item Description</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center', color: '#64748b', fontSize: '0.8rem' }}>HSN</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center', color: '#64748b', fontSize: '0.8rem' }}>Qty</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#64748b', fontSize: '0.8rem' }}>Rate</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#64748b', fontSize: '0.8rem' }}>Tax</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right', borderRadius: '0 12px 12px 0', color: '#64748b', fontSize: '0.8rem' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem 1rem', color: '#94a3b8', fontWeight: '600' }}>{idx + 1}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ fontWeight: '700', color: '#1e293b' }}>{item.item_name}</div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: '#64748b' }}>{item.hsn_code || '-'}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                      <div style={{ fontWeight: '800', color: '#1e293b' }}>
                        {item.unit === 'Meters' ? Number(item.quantity || 0).toFixed(2) : (item.quantity || 0)} {item.unit}
                      </div>
                      {item.unit === 'Box' && item.conversion_qty && (
                        <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px', fontStyle: 'italic' }}>
                          (1 Box = {item.conversion_qty} Pcs) | Total = {(item.quantity || 0) * item.conversion_qty} Pcs
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>₹{(item.rate || 0).toLocaleString()}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#64748b' }}>-</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: '800', color: '#1e293b' }}>₹{(item.amount || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bottom Grid: Returns & Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }}>
            <div>
              {returns.length > 0 && (
                <div style={{ background: '#fef2f2', padding: '1.5rem', borderRadius: '24px', border: '1px solid #fee2e2' }}>
                  <h4 style={{ margin: '0 0 1rem 0', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertCircle size={18} /> Returned Items
                  </h4>
                  <table style={{ width: '100%', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ color: '#991b1b', borderBottom: '1px solid #fecaca' }}>
                        <th style={{ textAlign: 'left', padding: '6px 0' }}>Item</th>
                        <th style={{ textAlign: 'center', padding: '6px 0' }}>Qty</th>
                        <th style={{ textAlign: 'right', padding: '6px 0' }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {returns.map((ret, idx) => (
                        <tr key={idx}>
                          <td style={{ padding: '6px 0', fontWeight: '600' }}>{ret.item_name}</td>
                          <td style={{ padding: '6px 0', textAlign: 'center' }}>{ret.quantity}</td>
                          <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: '700' }}>₹{(ret.amount || 0).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ borderTop: '2px solid #fecaca' }}>
                        <td colSpan="2" style={{ padding: '8px 0', fontWeight: '800', color: '#991b1b' }}>Returned Value</td>
                        <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: '900', color: '#dc2626', fontSize: '1rem' }}>₹{totalReturnAmount.toLocaleString()}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>

            <div>
              <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                    <span>Subtotal</span>
                    <span style={{ fontWeight: '700', color: '#1e293b' }}>₹{(invoice.total_amount || 0).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                    <span>Tax (GST)</span>
                    <span style={{ fontWeight: '700', color: '#1e293b' }}>₹{(invoice.gst_amount || 0).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ef4444' }}>
                    <span>Discount</span>
                    <span style={{ fontWeight: '700' }}>- ₹{(invoice.discount_amount || 0).toLocaleString()}</span>
                  </div>
                  {invoice.round_off !== 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                      <span>Round Off</span>
                      <span style={{ fontWeight: '700' }}>{invoice.round_off > 0 ? '+' : ''} ₹{(invoice.round_off || 0).toLocaleString()}</span>
                    </div>
                  )}
                  
                  <div style={{ margin: '1rem 0', height: '1px', background: '#e2e8f0' }}></div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: '900', color: '#1e293b' }}>Grand Total</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--accent-primary)' }}>₹{(invoice.net_amount || 0).toLocaleString()}</span>
                  </div>

                  {totalReturnAmount > 0 && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626', marginTop: '0.5rem' }}>
                        <span style={{ fontWeight: '600' }}>Less Returns</span>
                        <span style={{ fontWeight: '800' }}>- ₹{totalReturnAmount.toLocaleString()}</span>
                      </div>
                      <div style={{ margin: '1rem 0', height: '2px', background: '#dc2626', opacity: 0.2 }}></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '1.1rem', fontWeight: '900', color: '#991b1b' }}>Adjusted Balance</span>
                        <span style={{ fontSize: '1.5rem', fontWeight: '900', color: '#dc2626' }}>₹{finalBalance.toLocaleString()}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {settings?.bank_name && (
                <div style={{ marginTop: '1.5rem', padding: '0.75rem 1rem', borderLeft: '4px solid var(--accent-primary)', background: '#f8fafc' }}>
                  <p style={{ margin: '0 0 8px 0', fontSize: '0.75rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>Bank Settlement Info</p>
                  <p style={{ margin: '4px 0', fontSize: '0.9rem', fontWeight: '700' }}>{settings.bank_name}</p>
                  <p style={{ margin: '4px 0', fontSize: '0.85rem' }}>A/C: {settings.bank_account} | IFSC: {settings.bank_ifsc}</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div style={{ marginTop: '3rem', textAlign: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '1.5rem' }}>
            <p style={{ fontSize: '0.9rem', color: '#94a3b8', margin: 0 }}>Thank you for your business!</p>
            <p style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: '6px' }}>This is a computer generated invoice and does not require a physical signature.</p>
            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', gap: '3rem' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ height: '40px' }}></div>
                <div style={{ borderTop: '1px solid #e2e8f0', width: '180px', paddingTop: '8px', fontSize: '0.8rem', color: '#64748b' }}>Receiver's Signature</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ height: '40px' }}></div>
                <div style={{ borderTop: '1px solid #e2e8f0', width: '180px', paddingTop: '8px', fontSize: '0.8rem', fontWeight: '700', color: '#1e293b' }}>For {settings?.company_name || 'Billify Solutions'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>
        {`
          @media print {
            .no-print { display: none !important; }
            body { background: white !important; margin: 0 !important; padding: 0 !important; }
            .invoice-print-area { 
              box-shadow: none !important; 
              border: none !important; 
              border-radius: 0 !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            @page { 
              size: A4; 
              margin: 10mm 15mm; 
            }
            /* Force background colors to print */
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          }
        `}
      </style>
    </div>
  );
};

export default InvoiceDetails;
