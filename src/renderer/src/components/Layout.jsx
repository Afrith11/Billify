import Sidebar from './Sidebar';
import { Bell, User, Search, CreditCard, LogOut } from 'lucide-react';
import logo from '../assets/billify.png';
import useStore from '../store/useStore';

const Layout = ({ children, title }) => {
  const { settings, user, logout } = useStore();

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <header className="header no-print">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ 
              background: 'var(--accent-primary)', 
              width: '36px', 
              height: '36px', 
              borderRadius: '10px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: 'white',
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)'
            }}>
              <CreditCard size={20} />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', letterSpacing: '-0.02em' }}>{title}</h3>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input 
                placeholder="Search anything..." 
                style={{ paddingLeft: '2.5rem', width: '250px', background: 'var(--bg-primary)', height: '40px' }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div className="btn btn-outline" style={{ padding: '0.5rem' }}><Bell size={18} /></div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <div className="btn btn-outline" style={{ display: 'flex', gap: '0.75rem', padding: '0.5rem 1rem' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--accent-secondary)' }}></div>
                  <span style={{ fontWeight: '600' }}>{user?.username || 'Admin'}</span>
                  {user?.role && (
                    <span style={{ 
                      fontSize: '0.65rem', 
                      background: user.role === 'Admin' ? '#fee2e2' : '#f1f5f9', 
                      color: user.role === 'Admin' ? '#991b1b' : '#64748b', 
                      padding: '2px 6px', 
                      borderRadius: '4px',
                      fontWeight: '800'
                    }}>
                      {user.role.toUpperCase()}
                    </span>
                  )}
                </div>
                <button 
                  className="btn btn-outline" 
                  onClick={logout}
                  style={{ color: 'var(--error)', padding: '0.5rem' }}
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </div>
          </div>
        </header>
        
        <main className="content-area">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
