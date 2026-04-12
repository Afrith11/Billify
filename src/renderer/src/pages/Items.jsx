import { useState, useEffect } from 'react';
import useStore from '../store/useStore';
import { Plus, Edit2, Trash2, Search, X } from 'lucide-react';

const Items = () => {
  const { items, refreshItems } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    item_id: '',
    name: '',
    rate: '',
    quantity: '',
    unit: 'Pcs',
    description: ''
  });

  useEffect(() => {
    refreshItems();
  }, []);

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData(item);
    } else {
      setEditingItem(null);
      setFormData({
        item_id: `ITM-${Date.now().toString().slice(-6)}`,
        name: '',
        rate: '',
        quantity: '',
        unit: 'Pcs',
        description: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingItem) {
      await window.api.updateItem(formData);
    } else {
      await window.api.addItem(formData);
    }
    setIsModalOpen(false);
    refreshItems();
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this item?')) {
      await window.api.deleteItem(id);
      refreshItems();
    }
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.item_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input 
            placeholder="Search items..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '2.5rem', width: '300px' }}
          />
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={18} /> Add New Item
        </button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Rate</th>
              <th>Qty</th>
              <th>Unit</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map(item => (
              <tr key={item.id}>
                <td style={{ color: 'var(--text-secondary)' }}>{item.item_id}</td>
                <td style={{ fontWeight: 500 }}>{item.name}</td>
                <td>₹{item.rate.toLocaleString()}</td>
                <td style={{ color: item.quantity < 5 ? 'var(--error)' : 'inherit' }}>{item.quantity}</td>
                <td>{item.unit}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => handleOpenModal(item)} className="btn btn-outline" style={{ padding: '0.4rem' }}><Edit2 size={14} /></button>
                    <button onClick={() => handleDelete(item.id)} className="btn btn-outline" style={{ padding: '0.4rem', color: 'var(--error)' }}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2>{editingItem ? 'Edit Item' : 'Add New Item'}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Item ID</label>
                  <input value={formData.item_id} onChange={e => setFormData({...formData, item_id: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Item Name</label>
                  <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Rate (₹)</label>
                  <input type="number" step="0.01" value={formData.rate} onChange={e => setFormData({...formData, rate: parseFloat(e.target.value)})} required />
                </div>
                <div className="form-group">
                  <label>Initial Quantity</label>
                  <input type="number" value={formData.quantity} onChange={e => setFormData({...formData, quantity: parseInt(e.target.value)})} required />
                </div>
                <div className="form-group">
                  <label>Unit</label>
                  <select value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})}>
                    <option>Pcs</option>
                    <option>Kg</option>
                    <option>Ltr</option>
                    <option>Mtr</option>
                    <option>Box</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingItem ? 'Update Item' : 'Save Item'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Items;
