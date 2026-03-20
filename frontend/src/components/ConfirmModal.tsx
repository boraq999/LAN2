import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'warning' | 'info';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'تأكيد',
  cancelText = 'إلغاء',
  onConfirm,
  onCancel,
  type = 'danger'
}) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: 'text-error',
          iconBg: 'bg-error/20',
          button: 'bg-error hover:bg-error/90'
        };
      case 'warning':
        return {
          icon: 'text-warning',
          iconBg: 'bg-warning/20',
          button: 'bg-warning hover:bg-warning/90'
        };
      case 'info':
        return {
          icon: 'text-primary',
          iconBg: 'bg-primary/20',
          button: 'bg-primary hover:bg-primary-dark'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="glass rounded-2xl p-6 w-full max-w-md border border-white/20 animate-scaleIn">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl ${styles.iconBg} flex items-center justify-center`}>
              <AlertTriangle size={24} className={styles.icon} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{title}</h3>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Message */}
        <p className="text-sm text-gray-300 mb-6 leading-relaxed">
          {message}
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 bg-dark-card hover:bg-dark-hover border border-white/10 text-white font-semibold rounded-xl transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-3 ${styles.button} text-white font-semibold rounded-xl transition-colors`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
