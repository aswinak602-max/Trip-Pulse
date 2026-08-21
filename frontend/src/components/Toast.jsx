import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg, duration) => addToast(msg, 'success', duration),
    error: (msg, duration) => addToast(msg, 'error', duration),
    warning: (msg, duration) => addToast(msg, 'warning', duration),
    info: (msg, duration) => addToast(msg, 'info', duration),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast Container */}
      <div style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '420px',
        width: 'calc(100vw - 48px)',
        pointerEvents: 'none'
      }}>
        {toasts.map((t) => {
          let bg = 'rgba(17, 24, 39, 0.95)';
          let border = 'rgba(255, 255, 255, 0.15)';
          let color = '#fff';
          let icon = <CheckCircle2 size={18} color="#34d399" />;

          if (t.type === 'success') {
            border = 'rgba(16, 185, 129, 0.4)';
            icon = <CheckCircle2 size={18} color="#34d399" style={{ flexShrink: 0 }} />;
          } else if (t.type === 'error') {
            border = 'rgba(239, 68, 68, 0.4)';
            icon = <AlertCircle size={18} color="#f87171" style={{ flexShrink: 0 }} />;
          } else if (t.type === 'warning') {
            border = 'rgba(245, 158, 11, 0.4)';
            icon = <AlertTriangle size={18} color="#fbbf24" style={{ flexShrink: 0 }} />;
          } else if (t.type === 'info') {
            border = 'rgba(59, 130, 246, 0.4)';
            icon = <Info size={18} color="#60a5fa" style={{ flexShrink: 0 }} />;
          }

          return (
            <div
              key={t.id}
              style={{
                pointerEvents: 'auto',
                background: bg,
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: `1px solid ${border}`,
                borderRadius: 'var(--radius-md, 12px)',
                padding: '12px 16px',
                color: color,
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                fontSize: '0.88rem',
                lineHeight: 1.45
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {icon}
                <span>{t.message}</span>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.5)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px'
                }}
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      success: (msg) => console.log('Toast:', msg),
      error: (msg) => console.error('Toast Error:', msg),
      warning: (msg) => console.warn('Toast Warning:', msg),
      info: (msg) => console.info('Toast Info:', msg),
    };
  }
  return context;
};

export default ToastProvider;
