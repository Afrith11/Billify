import { useState, useEffect } from 'react';
import useStore from '../store/useStore';
import { Plus, Edit2, Trash2, Search, X, Package, Filter, ChevronDown } from 'lucide-react';
import logo from '../assets/billify.png';

const Items = () => {
  const { items, refreshItems, setActivePage, setSelectedItem, showNotification } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    item_id: '',
    name: '',
    category: '',
    size: 'M',
    color: '',
    rate: '',
    quantity: '',
    unit: 'Pcs',
    description: '',
    hsn_code: '',
    conversion_qty: ''
  });

  const categories = ['All', 'Shirt', 'T-Shirt', 'Jeans', 'Trousers', 'Saree', 'Kurta', 'Other'];
  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '38', '40', '42', '44'];

  const fetchData = async () => {
    setIsLoading(true);
    try {
      await refreshItems();
      setError(null);
    } catch (err) {
      console.error('Failed to fetch items:', err);
      setError('Failed to load items. Please check if the database is accessible.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData(item);
    } else {
      setEditingItem(null);
      setFormData({
        item_id: 'ITM-',
        name: '',
        category: 'Shirt',
        size: 'M',
        color: '',
        rate: '',
        quantity: '',
        unit: 'Pcs',
        description: '',
        hsn_code: '',
        conversion_qty: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.item_id === 'ITM-') {
      showNotification('Please enter a unique numeric suffix for the Item ID (e.g., ITM-001)', 'error');
      return;
    }

    if (!formData.item_id.startsWith('ITM-')) {
      showNotification('Item ID must start with ITM-', 'error');
      return;
    }

    if (formData.unit === 'Box' && (!formData.conversion_qty || formData.conversion_qty <= 0)) {
      showNotification('Please enter a conversion value for Box (e.g. 1 Box = 10 Pcs).', 'error');
      return;
    }

    // Quantity validation
    const qty = parseFloat(formData.quantity);
    if (isNaN(qty) || qty < 0) {
      showNotification('Please enter a valid stock quantity.', 'error');
      return;
    }

    if ((formData.unit === 'Pcs' || formData.unit === 'Box') && !Number.isInteger(Number(formData.quantity))) {
      showNotification(`${formData.unit} quantity must be a whole number.`, 'error');
      return;
    }

    if (formData.hsn_code && !/^[0-9A-Z]{4,8}$/.test(formData.hsn_code)) {
      showNotification('HSN / SAC Code should be 4-8 characters (numeric preferred).', 'error');
      return;
    }

    if (!window.api) {
      console.error('Electron API not available');
      showNotification('System error: Communication bridge is missing. Please restart the app.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      let res;
      if (editingItem) {
        res = await window.api.updateItem(formData);
      } else {
        res = await window.api.addItem(formData);
      }

      if (res && res.success === false) {
        showNotification(res.message, 'error');
        return;
      }

      setIsModalOpen(false);
      await refreshItems();
      showNotification(`Item ${editingItem ? 'updated' : 'added'} successfully`, 'success');
    } catch (err) {
      console.error('Error saving item:', err);
      showNotification('System error occurred while saving item.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation(); // Prevent row click navigation
    if (confirm('Are you sure you want to delete this item?')) {
      if (!window.api) {
        showNotification('System error: Communication bridge is missing.', 'error');
        return;
      }
      setIsLoading(true);
      try {
        await window.api.deleteItem(id);
        await refreshItems();
      } catch (err) {
        console.error('Error deleting item:', err);
        showNotification('Error deleting item: ' + err.message, 'error');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleEdit = (e, item) => {
    e.stopPropagation(); // Prevent row click navigation
    handleOpenModal(item);
  };

  const handleRowClick = (item) => {
    setSelectedItem(item);
    setActivePage('item-details');
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.item_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              placeholder="Search items by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.5rem', width: '300px', borderRadius: '12px', background: 'white' }}
            />
          </div>
          <div style={{ position: 'relative' }}>
            <Filter size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{ paddingLeft: '2.5rem', width: '180px', borderRadius: '12px', background: 'white', appearance: 'none' }}
            >
              {categories.map(cat => <option key={cat}>{cat}</option>)}
            </select>
            <ChevronDown size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()} style={{ borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.2)' }}>
          <Plus size={18} /> Add New Item
        </button>
      </div>

      {isLoading && items.length === 0 ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
          <div className="loading-spinner"></div>
        </div>
      ) : error ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--error)', border: '1px dashed var(--error)' }}>
          <p>{error}</p>
          <button className="btn btn-outline" onClick={fetchData} style={{ marginTop: '1rem' }}>Retry</button>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="card" style={{ 
          textAlign: 'center', 
          padding: '5rem', 
          color: 'var(--text-secondary)', 
          background: 'var(--bg-secondary)', 
          border: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <img 
            src={logo} 
            alt="Billify Logo" 
            className="brand-watermark"
            style={{ width: '120px', marginBottom: '2rem', filter: 'grayscale(1) opacity(0.2)' }} 
          />
          <p style={{ fontSize: '1.1rem', fontWeight: '500' }}>{searchTerm ? 'No items match your search criteria.' : 'Your inventory is empty.'}</p>
          {!searchTerm && <button className="btn btn-primary" onClick={() => handleOpenModal()} style={{ marginTop: '1.5rem' }}>Add First Item</button>}
        </div>
      ) : (
        <>
          <div className="table-container" style={{ border: 'none', background: 'white', boxShadow: 'var(--premium-shadow)', borderRadius: '16px', flex: 1, overflowY: 'auto' }}>
            <table style={{ borderCollapse: 'separate', borderSpacing: '0' }}>
              <thead>
                <tr style={{ background: 'var(--bg-tertiary)' }}>
                  <th style={{ borderRadius: '16px 0 0 0' }}>Item Details</th>
                  <th>Category</th>
                  <th>Size/Color</th>
                  <th>Rate</th>
                  <th>Stock</th>
                  <th style={{ borderRadius: '0 16px 0 0', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map(item => (
                  <tr 
                    key={item.id} 
                    onClick={() => handleRowClick(item)}
                  >
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span className="item-name">{item.name}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ID: {item.item_id}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ background: 'var(--bg-tertiary)', padding: '4px 10px', borderRadius: '8px', fontSize: '0.8rem' }}>{item.category}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600 }}>{item.size}</span>
                        {item.color && <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: item.color.toLowerCase(), border: '1px solid #ddd' }} title={item.color}></div>}
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{item.color}</span>
                      </div>
                    </td>
                    <td className="rate-pill">₹{(item.rate || 0).toLocaleString()}</td>
                    <td className="stock-pill">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          color: item.quantity <= 5 ? 'var(--error)' : 'inherit'
                        }} className={item.quantity <= 5 ? 'stock-low' : ''}>
                          {item.quantity} {item.unit}
                        </span>
                        {item.quantity <= 5 && <span style={{ fontSize: '0.7rem', color: 'var(--error)', background: '#fee2e2', padding: '2px 6px', borderRadius: '4px' }}>Low</span>}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button onClick={(e) => handleEdit(e, item)} className="btn btn-outline btn-icon" style={{ padding: '0.5rem', borderRadius: '10px' }} title="Edit"><Edit2 size={16} /></button>
                        <button onClick={(e) => handleDelete(e, item.id)} className="btn btn-outline btn-icon" style={{ padding: '0.5rem', color: 'var(--error)', borderRadius: '10px' }} title="Delete"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'flex-end', background: 'white', borderRadius: '0 0 16px 16px', borderTop: '1px solid var(--border-color)', boxShadow: '0 -2px 10px rgba(0,0,0,0.02)' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
              Total Items: <span style={{ color: 'var(--accent-primary)', fontSize: '1.1rem' }}>{filteredItems.length}</span>
            </span>
          </div>
        </>
      )}

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '700px', borderRadius: '24px', padding: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }}>{editingItem ? 'Update Item' : 'New Item Entry'}</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Fill in the details for your inventory</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} style={{ background: '#f1f5f9', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: '8px', borderRadius: '12px' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="form-group">
                  <label>Item ID</label>
                  <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                    <span style={{ 
                      padding: '0.75rem 1rem', 
                      background: '#e2e8f0', 
                      color: 'var(--text-primary)', 
                      fontWeight: '700',
                      borderRight: '1px solid var(--border-color)',
                      fontSize: '0.9rem'
                    }}>
                      ITM-
                    </span>
                    <input 
                      style={{ 
                        background: 'transparent', 
                        border: 'none', 
                        padding: '0.75rem 1rem',
                        flex: 1,
                        outline: 'none',
                        fontSize: '0.9rem',
                        fontWeight: '600'
                      }} 
                      value={formData.item_id.replace('ITM-', '')} 
                      onChange={e => {
                        const suffix = e.target.value.toUpperCase();
                        setFormData({ ...formData, item_id: 'ITM-' + suffix });
                      }} 
                      required 
                      placeholder="001"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Item Name</label>
                  <input style={{ background: '#f8fafc' }} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required placeholder="e.g. Slim Fit Denim" />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select style={{ background: '#f8fafc' }} value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                    {categories.filter(c => c !== 'All').map(cat => <option key={cat}>{cat}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Size</label>
                  <select style={{ background: '#f8fafc' }} value={formData.size} onChange={e => setFormData({ ...formData, size: e.target.value })}>
                    {sizes.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Color</label>
                  <input style={{ background: '#f8fafc' }} value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })} placeholder="e.g. Navy Blue" />
                </div>
                <div className="form-group">
                  <label>Rate (₹)</label>
                  <input style={{ background: '#f8fafc' }} type="number" step="0.01" value={formData.rate} onChange={e => setFormData({ ...formData, rate: parseFloat(e.target.value) })} required />
                </div>
                <div className="form-group">
                  <label>HSN / SAC Code</label>
                  <input 
                    style={{ background: '#f8fafc' }} 
                    value={formData.hsn_code} 
                    onChange={e => setFormData({ ...formData, hsn_code: e.target.value })} 
                    placeholder="e.g. 6203 / 9987" 
                  />
                </div>
                <div className="form-group">
                  <label>Stock Quantity</label>
                  <input style={{ background: '#f8fafc' }} type="number" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) })} required />
                </div>
                <div className="form-group">
                  <label>Unit</label>
                  <select style={{ background: '#f8fafc' }} value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })}>
                    <option>Pcs</option>
                    <option>Meters</option>
                    <option>Box</option>
                    <option>Set</option>
                  </select>
                </div>
                {formData.unit === 'Box' ? (
                  <div className="form-group" style={{ animation: 'fadeIn 0.3s ease-out' }}>
                    <label>Conversion (1 Box = ? Pcs)</label>
                    <input 
                      type="number"
                      style={{ background: '#f0f9ff', borderColor: '#bae6fd' }} 
                      value={formData.conversion_qty} 
                      onChange={e => setFormData({ ...formData, conversion_qty: parseFloat(e.target.value) })} 
                      placeholder="e.g. 10"
                      required
                    />
                  </div>
                ) : (
                  <div></div>
                )}
              </div>
              <div className="form-group" style={{ marginTop: '0.5rem' }}>
                <label>Description (Optional)</label>
                <textarea style={{ background: '#f8fafc' }} rows="2" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}></textarea>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)} style={{ padding: '0.75rem 1.5rem' }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 2rem', background: 'var(--accent-primary)' }}>{editingItem ? 'Update Item' : 'Add to Inventory'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Items;