import { useState, useEffect } from 'react';
import useStore from '../store/useStore';
import { Plus, Edit2, Trash2, Search, X, Phone, Mail, MapPin } from 'lucide-react';

const Customers = () => {
  const { customers, refreshCustomers } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    customer_id: '',
    name: '',
    phone: '',
    address: '',
    email: '',
    tax_id: ''
  });

  useEffect(() => {
    refreshCustomers();
  }, []);

  const handleOpenModal = (customer = null) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData(customer);
    } else {
      setEditingCustomer(null);
      setFormData({
        customer_id: `CST-${Date.now().toString().slice(-6)}`,
        name: '',
        phone: '',
        address: '',
        email: '',
        tax_id: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingCustomer) {
      await window.api.updateCustomer(formData);
    } else {
      await window.api.addCustomer(formData);
    }
    setIsModalOpen(false);
    refreshCustomers();
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this customer?')) {
      await window.api.deleteCustomer(id);
      refreshCustomers();
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone?.includes(searchTerm)
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input 
            placeholder="Search customers..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '2.5rem', width: '300px' }}
          />
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={18} /> Add New Customer
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {filteredCustomers.map(customer => (
          <div key={customer.id} className="card" style={{ position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ marginBottom: '0.25rem' }}>{customer.name}</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ID: {customer.customer_id}</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => handleOpenModal(customer)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><Edit2 size={16} /></button>
                <button onClick={() => handleDelete(customer.id)} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer' }}><Trash2 size={16} /></button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
              {customer.phone && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Phone size={14} /> {customer.phone}</div>}
              {customer.email && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Mail size={14} /> {customer.email}</div>}
              {customer.address && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><MapPin size={14} /> {customer.address}</div>}
              {customer.tax_id && <div style={{ marginTop: '0.5rem', padding: '0.4rem', background: 'var(--bg-tertiary)', borderRadius: '4px', fontSize: '0.7rem' }}><b>GST/TAX:</b> {customer.tax_id}</div>}
            </div>
            
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
              <button className="btn btn-outline" style={{ flex: 1, fontSize: '0.75rem' }}>View History</button>
              <button className="btn btn-primary" style={{ flex: 1, fontSize: '0.75rem' }}>New Bill</button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2>{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Customer ID</label>
                  <input value={formData.customer_id} onChange={e => setFormData({...formData, customer_id: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Full Name</label>
                  <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>GST / Tax ID</label>
                  <input value={formData.tax_id} onChange={e => setFormData({...formData, tax_id: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>Address</label>
                <textarea rows="3" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})}></textarea>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingCustomer ? 'Update Customer' : 'Save Customer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
