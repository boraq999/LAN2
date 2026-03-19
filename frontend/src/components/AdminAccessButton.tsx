import React from 'react';
import { Shield } from 'lucide-react';

const AdminAccessButton: React.FC = () => {
  const handleAdminAccess = () => {
    window.open('/admin', '_blank');
  };

  return (
    <button
      onClick={handleAdminAccess}
      className="fixed bottom-4 right-4 p-3 glass rounded-full hover:bg-primary/20 transition-colors z-30 group"
      title="Admin Panel"
    >
      <Shield size={24} className="text-primary" />
      <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-dark-card px-3 py-2 rounded-lg text-sm text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        Admin Panel
      </span>
    </button>
  );
};

export default AdminAccessButton;
