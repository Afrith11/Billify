import Sidebar from './Sidebar';
import { Bell, User, Search } from 'lucide-react';

const Layout = ({ children, title }) => {
  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <header className="header">
          <h3>{title}</h3>
          
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
              <div className="btn btn-outline" style={{ display: 'flex', gap: '0.75rem', padding: '0.5rem 1rem' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--accent-secondary)' }}></div>
                <span>Admin</span>
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
