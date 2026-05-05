import { useState, useEffect } from 'react';
import useStore from '../store/useStore';
import { 
  BarChart, 
  Package, 
  Users, 
  BookOpen, 
  FileText, 
  Settings,
  CreditCard,
  RotateCcw,
  TrendingUp,
  ShoppingCart,
  ChevronDown,
  ChevronRight,
  User,
  Shield,
  HardDrive
} from 'lucide-react';
import logo from '../assets/billify.png';

const Sidebar = () => {
  const { activePage, setActivePage, settings, user } = useStore();
  const isAdmin = user?.role?.toLowerCase() === 'admin';
  // Default to collapsed unless current page is a settings sub-page
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(activePage.startsWith('settings'));

  const menuItems = [
    { section: 'OPERATIONS' },
    { id: 'dashboard', label: 'Dashboard', icon: <BarChart size={20} /> },
    { id: 'items', label: 'Items', icon: <Package size={20} /> },
    { id: 'customers', label: 'Customers', icon: <Users size={20} /> },
    { id: 'daybook', label: 'Day Book', icon: <BookOpen size={20} /> },
    { id: 'payments', label: 'Payments', icon: <CreditCard size={20} /> },
    { id: 'returns', label: 'Returns', icon: <RotateCcw size={20} /> },
    
    { section: 'ACCOUNTING & REPORTS' },
    { id: 'paid-statement', label: 'Paid Statement', icon: <FileText size={20} /> },
    { id: 'receipt-statement', label: 'Receipts', icon: <CreditCard size={20} /> },
    { id: 'receivable-report', label: 'Receivables', icon: <TrendingUp size={20} /> },
    { id: 'payable-report', label: 'Payables', icon: <ShoppingCart size={20} /> },
    { id: 'sales-report', label: 'Sales Report', icon: <FileText size={20} /> },
  ];

  const handleSettingsToggle = (e) => {
    e.stopPropagation();
    setIsSettingsExpanded(!isSettingsExpanded);
  };

  return (
    <div className="sidebar no-print">
      <div style={{ padding: '2rem 1.5rem', textAlign: 'center' }}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <img 
            src={logo} 
            alt="Billify Logo" 
            style={{ 
              width: '64px', 
              height: '64px', 
              borderRadius: '16px',
              boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
              marginBottom: '0.75rem',
              background: 'white',
              objectFit: 'contain',
              border: '1px solid var(--border-color)'
            }} 
          />
        </div>
        <h2 style={{ 
          fontSize: '1.5rem', 
          fontWeight: '900', 
          color: 'var(--accent-primary)',
          margin: 0,
          letterSpacing: '-0.02em'
        }}>
          Billify
        </h2>
        <p style={{ 
          fontSize: '0.65rem', 
          color: 'var(--text-secondary)', 
          fontWeight: '800', 
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginTop: '0.25rem'
        }}>
          Premium Billing
        </p>
      </div>
      
      <nav style={{ flex: 1 }} className="sidebar-content">
        {menuItems.map((item, idx) => (
          item.section ? (
            <div key={`sec-${idx}`} style={{ 
              fontSize: '0.7rem', 
              fontWeight: '800', 
              color: 'var(--text-secondary)', 
              padding: '1.5rem 1.25rem 0.5rem',
              letterSpacing: '0.05em'
            }}>
              {item.section}
            </div>
          ) : (
            <div 
              key={item.id}
              className={`nav-item ${activePage === item.id ? 'active' : ''}`}
              onClick={() => setActivePage(item.id)}
            >
              <span style={{ opacity: activePage === item.id ? 1 : 0.7 }}>{item.icon}</span>
              <span style={{ fontSize: '0.9rem' }}>{item.label}</span>
            </div>
          )
        ))}
        
        <div style={{ marginTop: '1.5rem' }}>
          <div 
            className={`nav-item ${activePage.startsWith('settings') ? 'active' : ''}`}
            onClick={() => setIsSettingsExpanded(!isSettingsExpanded)}
            style={{ justifyContent: 'space-between' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Settings size={20} />
              <span style={{ fontSize: '0.9rem' }}>Settings</span>
            </div>
            <div>
              {isSettingsExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </div>
          </div>

          <div style={{ 
            maxHeight: isSettingsExpanded ? '300px' : '0',
            overflow: 'hidden',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            paddingLeft: '1.25rem',
            marginTop: isSettingsExpanded ? '0.25rem' : '0',
            opacity: isSettingsExpanded ? 1 : 0
          }}>
            <div 
              className={`nav-item ${activePage === 'settings-profile' ? 'active' : ''}`}
              onClick={() => setActivePage('settings-profile')}
              style={{ padding: '0.75rem 1rem', fontSize: '0.9rem', marginBottom: '2px' }}
            >
              <User size={18} style={{ opacity: activePage === 'settings-profile' ? 1 : 0.6 }} />
              <span>Business Profile</span>
            </div>
            
            {isAdmin && (
              <>
                <div 
                  className={`nav-item ${activePage === 'settings-security' ? 'active' : ''}`}
                  onClick={() => setActivePage('settings-security')}
                  style={{ padding: '0.75rem 1rem', fontSize: '0.9rem', marginBottom: '2px' }}
                >
                  <Shield size={18} style={{ opacity: activePage === 'settings-security' ? 1 : 0.6 }} />
                  <span>Security</span>
                </div>
                <div 
                  className={`nav-item ${activePage === 'settings-backup' ? 'active' : ''}`}
                  onClick={() => setActivePage('settings-backup')}
                  style={{ padding: '0.75rem 1rem', fontSize: '0.9rem', marginBottom: '2px' }}
                >
                  <HardDrive size={18} style={{ opacity: activePage === 'settings-backup' ? 1 : 0.6 }} />
                  <span>Backup & Sync</span>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;
