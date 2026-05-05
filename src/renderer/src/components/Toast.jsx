import useStore from '../store/useStore';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

const Toast = () => {
  const { notification, hideNotification } = useStore();

  if (!notification || !notification.visible) return null;

  const Icon = notification.type === 'success' ? CheckCircle : AlertCircle;

  return (
    <div className="toast-container">
      <div className={`toast toast-${notification.type}`}>
        <div className="toast-icon">
          <Icon size={20} />
        </div>
        <div style={{ flex: 1 }}>{notification.message}</div>
        <button 
          onClick={hideNotification}
          style={{ 
            background: 'none', 
            border: 'none', 
            padding: '4px', 
            cursor: 'pointer',
            display: 'flex',
            color: 'inherit',
            opacity: 0.6
          }}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default Toast;
