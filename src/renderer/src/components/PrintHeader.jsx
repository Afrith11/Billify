import useStore from '../store/useStore';
import { Building2, Mail, Phone, MapPin } from 'lucide-react';
import logoFallback from '../assets/billify.png';

const PrintHeader = ({ title }) => {
  const { settings } = useStore();

  return (
    <div className="print-only" style={{ marginBottom: '2rem', borderBottom: '2px solid #eee', paddingBottom: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '12px', background: 'white', border: '1px solid #eee', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img 
              src={settings?.company_logo || logoFallback} 
              alt="Logo" 
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
            />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', color: '#1e293b' }}>
              {settings?.company_name || 'Billify Business'}
            </h1>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px', fontSize: '0.85rem', color: '#64748b' }}>
              {settings?.company_address && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={14} /> {settings.company_address}
                </div>
              )}
              <div style={{ display: 'flex', gap: '15px' }}>
                {settings?.company_phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Phone size={14} /> {settings.company_phone}
                  </div>
                )}
                {settings?.company_email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Mail size={14} /> {settings.company_email}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '15px' }}>
                {settings?.company_gst && (
                  <div style={{ fontWeight: '700', color: '#475569' }}>
                    GSTIN: {settings.company_gst}
                  </div>
                )}
                {settings?.company_pan && (
                  <div style={{ fontWeight: '700', color: '#475569' }}>
                    PAN: {settings.company_pan}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {title}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>
            Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintHeader;
