import { useState, useEffect } from 'react';
import useStore from '../store/useStore';
import { Lock, User, ShieldCheck, ArrowRight, Eye, EyeOff } from 'lucide-react';
import logo from '../assets/billify.png';

const AuthPage = () => {
  const { setAuth, showNotification } = useStore();
  const [isSetup, setIsSetup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const status = await window.api.checkAuthStatus();
      if (!status.authEnabled) {
        setAuth({ username: 'Guest', role: 'admin' });
      } else {
        setIsSetup(!status.hasAdmin);
      }
    } catch (error) {
      console.error('Status check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await window.api.login({ 
        username: formData.username, 
        password: formData.password 
      });
      if (res.success) {
        setAuth({ username: res.username, role: res.role });
        showNotification('Welcome back!', 'success');
      } else {
        showNotification(res.message, 'error');
      }
    } catch (error) {
      showNotification('Login failed', 'error');
    }
  };

  const handleSetup = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      showNotification('Passwords do not match', 'error');
      return;
    }
    try {
      const res = await window.api.createAdmin({ 
        username: formData.username, 
        password: formData.password 
      });
      if (res.success) {
        setAuth({ username: formData.username, role: 'admin' });
        showNotification('Admin account created successfully!', 'success');
      } else {
        showNotification(res.message, 'error');
      }
    } catch (error) {
      showNotification('Setup failed', 'error');
    }
  };

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <div className="loading-spinner"></div>
    </div>
  );

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      padding: '2rem'
    }}>
      <div className="card" style={{ 
        width: '100%', 
        maxWidth: '450px', 
        padding: '3rem', 
        borderRadius: '32px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)',
        border: 'none',
        background: 'white',
        animation: 'fadeIn 0.6s ease-out'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <img 
            src={logo} 
            alt="Billify Logo" 
            style={{ width: '80px', height: '80px', marginBottom: '1.5rem', borderRadius: '20px', background: 'white', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} 
          />
          <h1 style={{ fontSize: '2rem', fontWeight: '900', color: 'var(--accent-primary)', margin: 0, letterSpacing: '-0.04em' }}>Billify</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>
            {isSetup ? 'Create Admin Account' : 'Secure Admin Login'}
          </p>
        </div>

        <form onSubmit={isSetup ? handleSetup : handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: '700' }}>
              <User size={14} /> Username
            </label>
            <input 
              required
              value={formData.username}
              onChange={e => setFormData({ ...formData, username: e.target.value })}
              placeholder="Enter username"
              style={{ padding: '14px', borderRadius: '14px', background: '#f8fafc' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: '700' }}>
              <Lock size={14} /> Password
            </label>
            <div style={{ position: 'relative' }}>
              <input 
                required
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                style={{ padding: '14px', paddingRight: '3rem', borderRadius: '14px', background: '#f8fafc', width: '100%' }}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {isSetup && (
            <div className="form-group" style={{ marginBottom: 0, animation: 'slideDown 0.3s ease-out' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: '700' }}>
                <ShieldCheck size={14} /> Confirm Password
              </label>
              <input 
                required
                type={showPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="••••••••"
                style={{ padding: '14px', borderRadius: '14px', background: '#f8fafc' }}
              />
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ 
              padding: '1.25rem', 
              borderRadius: '16px', 
              fontSize: '1rem', 
              fontWeight: '800', 
              marginTop: '1rem',
              boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
          >
            {isSetup ? 'Create Account' : 'Login'}
            <ArrowRight size={20} />
          </button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>
            Powered by <strong>BILLIFY SECURE ENGINE</strong>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
