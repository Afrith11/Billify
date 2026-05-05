import { useState, useEffect } from 'react';
import useStore from '../store/useStore';
import { Plus, Edit2, Trash2, Search, X, Phone, Mail, MapPin, Users, IndianRupee, History, TrendingDown, TrendingUp } from 'lucide-react';

const Customers = () => {
  const { customers, refreshCustomers, setActivePage, showNotification } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  const [formData, setFormData] = useState({
    customer_id: '',
    name: '',
    phone: '',
    address: '',
    email: '',
    tax_id: '',
    credit_limit: 0
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      await refreshCustomers();
      setError(null);
    } catch (err) {
      console.error('Failed to fetch customers:', err);
      setError('Failed to load customers. Please check database connection.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (customer = null) => {
    setFormErrors({});
    if (customer) {
      setEditingCustomer(customer);
      setFormData(customer);
    } else {
      setEditingCustomer(null);
      setFormData({
        customer_id: 'CUS-',
        name: '',
        phone: '',
        address: '',
        email: '',
        tax_id: '',
        credit_limit: 10000
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    const newErrors = {};
    if (formData.customer_id === 'CUS-') newErrors.customer_id = true;
    if (!formData.name) newErrors.name = true;
    if (!formData.phone) newErrors.phone = true;

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      showNotification('Please fill in all mandatory fields correctly.', 'error');
      // Focus first error
      const firstError = Object.keys(newErrors)[0];
      const element = document.getElementsByName(firstError)[0];
      if (element) element.focus();
      return;
    }

    if (!window.api) {
      console.error('Electron API not available');
      showNotification('System error: Communication bridge is missing. Please restart the app.', 'error');
      return;
    }
    setIsLoading(true);
    try {
      if (editingCustomer) {
        await window.api.updateCustomer(formData);
      } else {
        await window.api.addCustomer(formData);
      }
      setIsModalOpen(false);
      await refreshCustomers();
    } catch (err) {
      console.error('Error saving customer:', err);
      showNotification('Error saving customer: ' + err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this customer? This will NOT delete their transaction history.')) {
      if (!window.api) {
        showNotification('System error: Communication bridge is missing.', 'error');
        return;
      }
      setIsLoading(true);
      try {
        await window.api.deleteCustomer(id);
        await refreshCustomers();
      } catch (err) {
        console.error('Error deleting customer:', err);
        showNotification('Error deleting customer: ' + err.message, 'error');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone?.includes(searchTerm) ||
    c.customer_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input
            placeholder="Search by name, phone, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '2.75rem', width: '350px', borderRadius: '14px', background: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
          />
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()} style={{ borderRadius: '14px', padding: '0.75rem 1.5rem', boxShadow: '0 8px 16px -4px rgba(79, 70, 229, 0.2)' }}>
          <Plus size={20} /> New Customer Profile
        </button>
      </div>

      {isLoading && customers.length === 0 ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
          <div className="loading-spinner"></div>
        </div>
      ) : error ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--error)', border: '1px dashed var(--error)' }}>
          <p>{error}</p>
          <button className="btn btn-outline" onClick={fetchData} style={{ marginTop: '1rem' }}>Retry</button>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '5rem', background: 'var(--bg-secondary)', border: 'none', borderRadius: '24px' }}>
          <Users size={64} style={{ marginBottom: '1.5rem', opacity: 0.1, color: 'var(--accent-primary)' }} />
          <p style={{ fontSize: '1.1rem', fontWeight: '500', color: 'var(--text-secondary)' }}>{searchTerm ? 'No results for your search.' : 'Database currenty empty of customers.'}</p>
          {!searchTerm && <button className="btn btn-primary" onClick={() => handleOpenModal()} style={{ marginTop: '1.5rem' }}>Register First Customer</button>}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '2rem' }}>
          {filteredCustomers.map(customer => (
            <div key={customer.id} className="card" style={{
              position: 'relative',
              borderRadius: '24px',
              border: '1px solid #f1f5f9',
              background: 'white',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)',
              transition: 'all 0.2s ease',
              cursor: 'default'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, #4f46e5 0%, #818cf8 100%)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                    fontWeight: 'bold'
                  }}>
                    {customer.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="item-name" style={{ marginBottom: '0.1rem', fontSize: '1.1rem' }}>{customer.name}</h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '500' }}>{customer.customer_id}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  <button onClick={() => handleOpenModal(customer)} className="btn-icon" style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(customer.id)} className="btn-icon" style={{ color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={16} /></button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                {customer.phone && <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><Phone size={14} style={{ color: 'var(--text-secondary)' }} /> {customer.phone}</div>}
                {customer.email && <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><Mail size={14} style={{ color: 'var(--text-secondary)' }} /> {customer.email}</div>}
                {customer.address && <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><MapPin size={14} style={{ color: 'var(--text-secondary)' }} /> {customer.address}</div>}
              </div>

              <div style={{
                marginTop: '1.5rem',
                padding: '1.25rem',
                background: 'var(--bg-primary)',
                borderRadius: '16px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem'
              }}>
                <div>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', fontWeight: 'bold' }}>Current Balance</p>
                  <p style={{
                    fontSize: '1.1rem',
                    fontWeight: '800',
                    color: (customer.balance || 0) > 0 ? 'var(--error)' : 'var(--success)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    ₹{(customer.balance || 0).toLocaleString()}
                    {(customer.balance || 0) > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', fontWeight: 'bold' }}>Credit Limit</p>
                  <p style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-primary)' }}>₹{(customer.credit_limit || 0).toLocaleString()}</p>
                </div>
              </div>

              <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                <button
                  className="btn btn-outline"
                  onClick={() => setActivePage('reports')}
                  style={{ flex: 1, borderRadius: '12px', fontSize: '0.8rem', padding: '0.6rem', background: 'white' }}
                >
                  <History size={14} /> Ledger
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => setActivePage('daybook')}
                  style={{ flex: 1, borderRadius: '12px', fontSize: '0.8rem', padding: '0.6rem' }}
                >
                  <IndianRupee size={14} /> New Bill
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ borderRadius: '24px', maxWidth: '650px', padding: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }}>{editingCustomer ? 'Update Profile' : 'New Customer Entry'}</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Comprehensive client data for ledger tracking</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} style={{ background: '#f1f5f9', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: '8px', borderRadius: '10px' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="form-group">
                  <label>Customer ID <span className="required">*</span></label>
                  <div className={`form-input-container ${formErrors.customer_id ? 'input-error' : ''}`} style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                    <span style={{ 
                      padding: '0.75rem 1rem', 
                      background: '#e2e8f0', 
                      color: 'var(--text-primary)', 
                      fontWeight: '700',
                      borderRight: '1px solid var(--border-color)',
                      fontSize: '0.9rem'
                    }}>
                      CUS-
                    </span>
                    <input 
                      name="customer_id"
                      style={{ 
                        background: 'transparent', 
                        border: 'none', 
                        padding: '0.75rem 1rem',
                        flex: 1,
                        outline: 'none',
                        fontSize: '0.9rem',
                        fontWeight: '600'
                      }} 
                      value={formData.customer_id.replace('CUS-', '')} 
                      onChange={e => {
                        const suffix = e.target.value.toUpperCase();
                        setFormData({ ...formData, customer_id: 'CUS-' + suffix });
                        if (suffix) setFormErrors({ ...formErrors, customer_id: false });
                      }} 
                      required 
                      placeholder="001"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Full Name <span className="required">*</span></label>
                  <input 
                    name="name"
                    className={formErrors.name ? 'input-error' : ''} 
                    style={{ background: '#f8fafc' }} 
                    value={formData.name} 
                    onChange={e => {
                      setFormData({ ...formData, name: e.target.value });
                      if (e.target.value) setFormErrors({ ...formErrors, name: false });
                    }} 
                    required 
                    placeholder="e.g. John Doe" 
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number <span className="required">*</span></label>
                  <input 
                    name="phone"
                    className={formErrors.phone ? 'input-error' : ''} 
                    style={{ background: '#f8fafc' }} 
                    value={formData.phone} 
                    onChange={e => {
                      setFormData({ ...formData, phone: e.target.value });
                      if (e.target.value) setFormErrors({ ...formErrors, phone: false });
                    }} 
                    required
                    placeholder="+91 ..." 
                  />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input style={{ background: '#f8fafc' }} type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="email@example.com" />
                </div>
                <div className="form-group">
                  <label>GST / Tax ID</label>
                  <input style={{ background: '#f8fafc' }} value={formData.tax_id} onChange={e => setFormData({ ...formData, tax_id: e.target.value })} placeholder="Optional" />
                </div>
                <div className="form-group">
                  <label>Credit Limit (₹)</label>
                  <input style={{ background: '#f8fafc' }} type="number" value={formData.credit_limit} onChange={e => setFormData({ ...formData, credit_limit: parseFloat(e.target.value) })} />
                </div>
              </div>
              <div className="form-group" style={{ marginTop: '0.5rem' }}>
                <label>Billing Address</label>
                <textarea style={{ background: '#f8fafc' }} rows="3" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} placeholder="Street address, City, ZIP"></textarea>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem' }}>
                <p className="helper-text">* Indicates required field</p>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)} style={{ padding: '0.75rem 1.5rem' }}>Discard</button>
                  <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>{editingCustomer ? 'Update Profile' : 'Register Customer'}</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;