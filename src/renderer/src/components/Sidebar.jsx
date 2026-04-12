import useStore from '../store/useStore';
import { 
  BarChart3, 
  Package, 
  Users, 
  BookOpen, 
  FileText, 
  Settings,
  CreditCard
} from 'lucide-react';

const Sidebar = () => {
  const { activePage, setActivePage } = useStore();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 size={20} /> },
    { id: 'items', label: 'Items (Product)', icon: <Package size={20} /> },
    { id: 'customers', label: 'Ledger (Customers)', icon: <Users size={20} /> },
    { id: 'daybook', label: 'Day Book', icon: <BookOpen size={20} /> },
    { id: 'payments', label: 'Paid Statements', icon: <CreditCard size={20} /> },
    { id: 'reports', label: 'Reports', icon: <FileText size={20} /> },
  ];

  return (
    <div className="sidebar">
      <div style={{ padding: '0 1.5rem 2rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1rem' }}>
        <h2 style={{ color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileText size={28} /> BillsPack
        </h2>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Desktop Billing Solution</p>
      </div>
      
      <nav style={{ flex: 1 }}>
        {menuItems.map((item) => (
          <div 
            key={item.id}
            className={`nav-item ${activePage === item.id ? 'active' : ''}`}
            onClick={() => setActivePage(item.id)}
          >
            {item.icon}
            <span>{item.label}</span>
          </div>
        ))}
      </nav>

      <div className="nav-item" style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)' }}>
        <Settings size={20} />
        <span>Settings</span>
      </div>
    </div>
  );
};

export default Sidebar;
