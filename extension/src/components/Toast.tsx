import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle, AlertTriangle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastProps {
  message: string;
  type: ToastType;
  visible: boolean;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, visible, onClose }) => {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  if (!visible) return null;

  const icons = {
    success: <CheckCircle size={16} />,
    error: <AlertTriangle size={16} />,
    info: <Info size={16} />
  };

  return (
    <div className="toast-container">
      <div className={`toast toast-${type}`}>
        {icons[type]}
        <span>{message}</span>
      </div>
    </div>
  );
};

export const useToast = () => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<ToastType>('info');

  const showToast = useCallback((msg: string, t: ToastType = 'info') => {
    setMessage(msg);
    setType(t);
    setVisible(true);
  }, []);

  const hideToast = useCallback(() => {
    setVisible(false);
  }, []);

  return { visible, message, type, showToast, hideToast };
};
