import { useState } from 'react';
import useStore from '../store/useStore';
import { ArrowLeft, Edit2, Trash2, Package, Tag, Layers, Palette, IndianRupee, Database, Type, FileText } from 'lucide-react';

const ItemDetails = () => {
  const { selectedItem, setSelectedItem, setActivePage, refreshItems, showNotification } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(selectedItem);

  if (!selectedItem) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <Package size={64} style={{ opacity: 0.1, marginBottom: '1rem' }} />
        <h3>No Item Selected</h3>
        <button className="btn btn-primary" onClick={() => setActivePage('items')} style={{ marginTop: '1rem' }}>
          Back to Inventory
        </button>
      </div>
    );
  }

  const handleSave = async () => {
    try {
      const res = await window.api.updateItem(formData);
      if (res.success) {
        showNotification('Item updated successfully', 'success');
        setSelectedItem(formData);
        await refreshItems();
        setIsEditing(false);
      } else {
        showNotification(res.message, 'error');
      }
    } catch (err) {
      showNotification('Update failed', 'error');
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this item?')) {
      try {
        await window.api.deleteItem(selectedItem.id);
        await refreshItems();
        setActivePage('items');
      } catch (err) {
        showNotification('Error: ' + err.message, 'error');
      }
    }
  };

  const DetailCard = ({ icon: Icon, label, field, value, color = 'var(--accent-primary)', type = 'text' }) => (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.5rem', border: isEditing ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)' }}>
      <div style={{ background: `${color}15`, color: color, padding: '12px', borderRadius: '12px' }}>
        <Icon size={24} />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>{label}</p>
        {isEditing ? (
          <input 
            type={type}
            value={formData[field]} 
            onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
            style={{ width: '100%', padding: '4px 8px', borderRadius: '8px', border: '1px solid #ddd' }}
          />
        ) : (
          <p style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)' }}>{value || 'N/A'}</p>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            onClick={() => setActivePage('items')}
            style={{ background: 'white', border: '1px solid var(--border-color)', padding: '8px', borderRadius: '10px', cursor: 'pointer', display: 'flex' }}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '0.25rem' }}>{isEditing ? 'Editing Item' : 'Item Details'}</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{isEditing ? `Modifying ${selectedItem.name}` : `Comprehensive view of ${selectedItem.name}`}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {isEditing ? (
            <>
              <button className="btn btn-outline" onClick={() => setIsEditing(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} style={{ gap: '8px' }}>
                <Save size={18} /> Save Changes
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-outline" onClick={() => setIsEditing(true)} style={{ borderRadius: '12px' }}>
                <Edit2 size={18} /> Edit
              </button>
              <button className="btn btn-outline" onClick={handleDelete} style={{ borderRadius: '12px', color: 'var(--error)' }}>
                <Trash2 size={18} /> Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        <DetailCard icon={Package} label="Item ID" field="item_id" value={selectedItem.item_id} />
        <DetailCard icon={Type} label="Name" field="name" value={selectedItem.name} />
        <DetailCard icon={Tag} label="Category" field="category" value={selectedItem.category} />
        <DetailCard icon={Layers} label="Size" field="size" value={selectedItem.size} />
        <DetailCard icon={Palette} label="Color" field="color" value={selectedItem.color} />
        <DetailCard icon={IndianRupee} label="Rate" field="rate" type="number" value={`₹${(selectedItem.rate || 0).toLocaleString()}`} />
        <DetailCard icon={FileText} label="HSN / SAC Code" field="hsn_code" value={selectedItem.hsn_code} />
        <DetailCard icon={Database} label="Current Stock" field="quantity" type="number" value={`${selectedItem.quantity} ${selectedItem.unit}`} color={selectedItem.quantity <= 5 ? 'var(--error)' : 'var(--success)'} />
      </div>

      <div className="card" style={{ marginTop: '1.5rem', padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <FileText size={20} style={{ color: 'var(--accent-primary)' }} />
          <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Description</h3>
        </div>
        {isEditing ? (
          <textarea 
            style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1px solid #ddd' }} 
            rows="4" 
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        ) : (
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
            {selectedItem.description || 'No description provided for this item.'}
          </p>
        )}
      </div>

      {/* Quick Summary Section */}
      <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
        <div style={{ flex: 1, background: 'linear-gradient(135deg, #4f46e5 0%, #818cf8 100%)', borderRadius: '16px', padding: '1.5rem', color: 'white' }}>
          <h4 style={{ opacity: 0.8, fontSize: '0.85rem', marginBottom: '0.5rem' }}>Inventory Status</h4>
          <p style={{ fontSize: '1.25rem', fontWeight: '700' }}>
            {selectedItem.quantity <= 5 ? 'Critical Reorder Required' : 'Healthy Stock Levels'}
          </p>
        </div>
        <div style={{ flex: 1, background: 'white', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.5rem' }}>
          <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Value in Stock</h4>
          <p style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--accent-primary)' }}>
            ₹{((selectedItem.rate || 0) * (selectedItem.quantity || 0)).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ItemDetails;
