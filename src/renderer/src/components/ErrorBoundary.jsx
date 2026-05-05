import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          height: '100vh', 
          width: '100vw', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          background: '#f8fafc',
          padding: '2rem',
          textAlign: 'center',
          fontFamily: 'Inter, sans-serif'
        }}>
          <div style={{ 
            background: '#fee2e2', 
            color: '#ef4444', 
            padding: '2rem', 
            borderRadius: '24px', 
            maxWidth: '500px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <AlertTriangle size={64} style={{ marginBottom: '1.5rem' }} />
            <h1 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '1rem', color: '#1e293b' }}>Something went wrong</h1>
            <p style={{ color: '#64748b', marginBottom: '2rem', lineHeight: '1.6' }}>
              The application encountered an unexpected error. Don&apos;t worry, your data is safe.
            </p>
            
            <div style={{ 
              background: 'white', 
              padding: '1rem', 
              borderRadius: '12px', 
              fontSize: '0.85rem', 
              textAlign: 'left', 
              marginBottom: '2rem',
              border: '1px solid #fecaca',
              overflowX: 'auto',
              maxHeight: '150px'
            }}>
              <code style={{ color: '#b91c1c' }}>{this.state.error?.toString()}</code>
            </div>

            <button 
              onClick={() => window.location.reload()}
              style={{ 
                background: '#4f46e5', 
                color: 'white', 
                border: 'none', 
                padding: '12px 24px', 
                borderRadius: '12px', 
                fontWeight: '700', 
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <RefreshCw size={18} /> Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
