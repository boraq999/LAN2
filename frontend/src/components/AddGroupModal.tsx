import React, { useState, useEffect } from 'react';
import { X, Users, Check } from 'lucide-react';

interface User {
  id: string;
  username: string;
  status: string;
}

interface AddGroupModalProps {
  socket: any;
  onClose: () => void;
}

const AddGroupModal: React.FC<AddGroupModalProps> = ({ socket, onClose }) => {
  const [groupName, setGroupName] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (socket) {
      socket.emit('admin:get-users');
      
      socket.on('admin:users-list', (usersList: User[]) => {
        setUsers(usersList.filter(u => u.status === 'active'));
      });
    }
  }, [socket]);

  const toggleMember = (userId: string) => {
    setSelectedMembers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!groupName.trim()) {
      setError('Please enter group name');
      return;
    }

    socket?.emit('admin:create-group', { 
      name: groupName.trim(), 
      members: selectedMembers 
    });

    socket?.once('admin:create-group-success', () => {
      setSuccess('Group created successfully!');
      setTimeout(() => {
        onClose();
      }, 1500);
    });

    socket?.once('admin:create-group-error', (error: any) => {
      setError(error.message);
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass rounded-2xl p-6 w-full max-w-md border border-white/20 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Create New Group</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Group Name
            </label>
            <div className="relative">
              <Users size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={groupName}
                onChange={(e) => {
                  setGroupName(e.target.value);
                  setError('');
                }}
                placeholder="Enter group name"
                className="w-full bg-dark-card border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 transition-colors"
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Add Members (Optional)
            </label>
            <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-thin">
              {users.map((user) => (
                <div
                  key={user.id}
                  onClick={() => toggleMember(user.id)}
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                    selectedMembers.includes(user.id)
                      ? 'bg-primary/20 border border-primary/30'
                      : 'bg-dark-card border border-white/10 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
                      {user.username[0].toUpperCase()}
                    </div>
                    <span className="text-white text-sm">{user.username}</span>
                  </div>
                  {selectedMembers.includes(user.id) && (
                    <Check size={18} className="text-primary" />
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {selectedMembers.length} member(s) selected
            </p>
          </div>

          {error && (
            <div className="bg-error/10 border border-error/30 rounded-xl p-3">
              <p className="text-sm text-error">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-success/10 border border-success/30 rounded-xl p-3">
              <p className="text-sm text-success">{success}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-dark-card hover:bg-dark-hover border border-white/10 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!groupName.trim()}
              className="flex-1 bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Group
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddGroupModal;
