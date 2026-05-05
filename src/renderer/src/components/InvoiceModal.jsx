import { useState, useEffect } from 'react';
import useStore from '../store/useStore';
import { X, Printer, Download, MapPin, Phone, Mail, Building2 } from 'lucide-react';
import logoFallback from '../assets/billify.png';

const InvoiceModal = ({ invoice, onClose, autoPrint = false }) => {
  const { settings } = useStore();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (invoice && invoice.id) {
      fetchInvoiceItems();
    }
  }, [invoice]);

  useEffect(() => {
    if (!loading && autoPrint) {
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading, autoPrint]);

  const fetchInvoiceItems = async () => {
    setLoading(true);
    try {
      // If the invoice object comes from the daybook, it might not have the real DB ID if it's a join or union.
      // But DayBook row for 'invoice' type should have the original ID.
      const data = await window.api.getInvoiceItems(invoice.id);
      setItems(data || []);
    } catch (err) {
      console.error('Failed to fetch invoice items:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!invoice) return null;

  return (
    <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.7)' }}>
      <div className="modal-content" style={{ 
        maxWidth: '900px', 
        borderRadius: '16px', 
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '90vh'
      }}>
        {/* Modal Header (No Print) */}
        <div className="no-print" style={{ 
          padding: '1rem 2rem', 
          background: 'white', 
          borderBottom: '1px solid #eee',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0
        }}>
          <h3 style={{ margin: 0 }}>Invoice #{invoice.invoice_number}</h3>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn btn-primary" onClick={handlePrint}>
              <Printer size={18} /> Print Invoice
            </button>
            <button className="btn btn-outline" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Invoice Body (Scrollable & Printable) */}
        <div style={{ flex: 1, overflowY: 'auto', background: '#f8fafc', padding: '2rem' }}>
          <div className="invoice-print-area" style={{ 
            background: 'white', 
            padding: '3rem', 
            minHeight: '100%',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
            borderRadius: '8px'
          }}>
            {/* Invoice Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3rem' }}>
              <div style={{ display: 'flex', gap: '1.5rem' }}>
                <div style={{ width: '100px', height: '100px', background: 'white', border: '1px solid #eee', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                   <img 
                    src={settings?.company_logo || logoFallback} 
                    alt="Logo" 
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
                  />
                </div>
                <div>
                  <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: '900' }}>{settings?.company_name || 'Billify Solutions'}</h1>
                  <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {settings?.company_address && <p style={{ margin: 0, display: 'flex', gap: '6px' }}><MapPin size={14} /> {settings.company_address}</p>}
                    <p style={{ margin: 0, display: 'flex', gap: '15px' }}>
                      {settings?.company_phone && <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Phone size={14} /> {settings.company_phone}</span>}
                      {settings?.company_email && <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Mail size={14} /> {settings.company_email}</span>}
                    </p>
                    {(settings?.company_gst || settings?.company_pan) && (
                      <p style={{ margin: 0, display: 'flex', gap: '15px', fontWeight: '700', color: '#1e293b', marginTop: '4px' }}>
                        {settings.company_gst && <span>GSTIN: {settings.company_gst}</span>}
                        {settings.company_pan && <span>PAN: {settings.company_pan}</span>}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <h2 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#e2e8f0', margin: 0, textTransform: 'uppercase' }}>Tax Invoice</h2>
                <div style={{ marginTop: '1rem' }}>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b' }}>Invoice Number</p>
                  <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800' }}>{invoice.invoice_number}</p>
                  <p style={{ margin: '1rem 0 0 0', fontSize: '0.9rem', color: '#64748b' }}>Date</p>
                  <p style={{ margin: 0, fontSize: '1rem', fontWeight: '700' }}>{invoice.bill_date}</p>
                </div>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '2px solid #f1f5f9', margin: '2rem 0' }} />

            {/* Billing Info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3rem' }}>
              <div>
                <p style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: '800', color: '#94a3b8', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Bill To</p>
                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{invoice.customer_name}</h3>
                {/* We might need to fetch customer details to show address/GST here */}
                <p style={{ margin: '4px 0', fontSize: '0.9rem', color: '#64748b' }}>Payment Mode: <span style={{ fontWeight: '700', color: '#1e293b' }}>{invoice.payment_type}</span></p>
              </div>
            </div>

            {/* Items Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '3rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.8rem' }}>#</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.8rem' }}>Description</th>
                  <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.8rem' }}>HSN/SAC</th>
                  <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.8rem' }}>Qty</th>
                  <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.8rem' }}>Rate</th>
                  <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.8rem' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Loading items...</td></tr>
                ) : items.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '1rem', color: '#94a3b8' }}>{idx + 1}</td>
                    <td style={{ padding: '1rem' }}>
                      <p style={{ margin: 0, fontWeight: '700' }}>{item.item_name}</p>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center', color: '#64748b' }}>{item.hsn_code || '-'}</td>
                    <td style={{ padding: '1rem', textAlign: 'center', fontWeight: '600' }}>{item.quantity}</td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>₹{item.rate.toLocaleString()}</td>
                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '700' }}>₹{item.amount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals Section */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ width: '300px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', color: '#64748b' }}>
                  <span>Subtotal</span>
                  <span style={{ fontWeight: '700', color: '#1e293b' }}>₹{invoice.total_amount.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', color: '#64748b' }}>
                  <span>GST / Tax</span>
                  <span style={{ fontWeight: '700', color: '#1e293b' }}>+ ₹{invoice.gst_amount.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', color: '#64748b' }}>
                  <span>Discount</span>
                  <span style={{ fontWeight: '700', color: '#ef4444' }}>- ₹{invoice.discount_amount.toLocaleString()}</span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  padding: '1rem 0', 
                  marginTop: '1rem', 
                  borderTop: '2px solid #1e293b' 
                }}>
                  <span style={{ fontSize: '1.25rem', fontWeight: '900' }}>Grand Total</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--accent-primary)' }}>₹{invoice.net_amount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Bank Details & Terms */}
            <div style={{ marginTop: '5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
              {settings?.bank_name && (
                <div>
                  <p style={{ fontSize: '0.75rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Bank Details</p>
                  <p style={{ margin: '4px 0', fontSize: '0.9rem' }}>Bank: <span style={{ fontWeight: '700' }}>{settings.bank_name}</span></p>
                  <p style={{ margin: '4px 0', fontSize: '0.9rem' }}>A/C No: <span style={{ fontWeight: '700' }}>{settings.bank_account}</span></p>
                  <p style={{ margin: '4px 0', fontSize: '0.9rem' }}>IFSC: <span style={{ fontWeight: '700' }}>{settings.bank_ifsc}</span></p>
                </div>
              )}
              <div style={{ textAlign: 'right' }}>
                <div style={{ height: '80px' }}></div>
                <p style={{ borderTop: '1px solid #e2e8f0', display: 'inline-block', minWidth: '150px', paddingTop: '8px', fontSize: '0.85rem', fontWeight: '700' }}>Authorized Signatory</p>
              </div>
            </div>

            <div style={{ marginTop: '5rem', textAlign: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '1.5rem' }}>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Thank you for your business!</p>
              <p style={{ fontSize: '0.65rem', color: '#cbd5e1', marginTop: '4px' }}>Generated via Billify ERP</p>
            </div>
          </div>
        </div>

        <style>
          {`
            @media print {
              body * {
                visibility: hidden;
              }
              .invoice-print-area, .invoice-print-area * {
                visibility: visible;
              }
              .invoice-print-area {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                margin: 0;
                padding: 0 !important;
                box-shadow: none !important;
                border: none !important;
              }
              .no-print {
                display: none !important;
              }
              @page {
                size: A4;
                margin: 20mm;
              }
            }
          `}
        </style>
      </div>
    </div>
  );
};

export default InvoiceModal;
