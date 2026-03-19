import React, { useState, useEffect } from 'react';
import { Users, Shield, Settings, Activity, LogOut, Search, Plus, Ban, Trash2, Edit, Key } from 'lucide-react';
import { Socket } from 'socket.io-client';
import AddUserModal from './AddUserModal';
import AddGroupModal from './AddGroupModal';

interface User {
  id: string;
  username: string;
  status: 'active' | 'suspended' | 'banned';
  role: 'admin' | 'user';
  joinedAt: string;
  lastActive: string;
}

interface Group {
  id: string;
  name: string;
  member_count: number;
  status: 'active' | 'suspended';
  created_at: string;
  created_by: string;
}

interface ActivityLog {
  id: number;
  user_id: string;
  username: string;
  action: string;
  details: string;
  created_at: string;
}

interface AdminDashboardProps {
  socket: Socket | null;
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ socket, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'groups' | 'settings' | 'logs'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    if (socket) {
      socket.emit('admin:get-users');
      socket.emit('admin:get-groups');
      socket.emit('admin:get-logs');

      socket.on('admin:users-list', (usersList: User[]) => {
        setUsers(usersList);
      });

      socket.on('admin:groups-list', (groupsList: Group[]) => {
        setGroups(groupsList);
      });

      socket.on('admin:logs-list', (logsList: ActivityLog[]) => {
        setLogs(logsList);
      });

      return () => {
        socket.off('admin:users-list');
        socket.off('admin:groups-list');
        socket.off('admin:logs-list');
      };
    }
  }, [socket]);

  const handleUpdatePassword = (userId: string) => {
    if (!newPassword.trim() || newPassword.length < 4) {
      alert('Password must be at least 4 characters');
      return;
    }
    socket?.emit('admin:update-password', { userId, newPassword });
    socket?.once('admin:update-password-success', () => {
      alert('Password updated successfully');
      setEditingUserId(null);
      setNewPassword('');
    });
  };

  const handleSuspendUser = (userId: string) => {
    socket?.emit('admin:suspend-user', { userId });
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      socket?.emit('admin:delete-user', { userId });
    }
  };

  const handleSuspendGroup = (groupId: string) => {
    socket?.emit('admin:suspend-group', { groupId });
  };

  const handleDeleteGroup = (groupId: string) => {
    if (confirm('Are you sure you want to delete this group?')) {
      socket?.emit('admin:delete-group', { groupId });
    }
  };

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGroups = groups.filter(group => 
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tabs = [
    { id: 'users', label: 'Users', icon: Users },
    { id: 'groups', label: 'Groups', icon: Shield },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'logs', label: 'Activity Logs', icon: Activity },
  ];

  return (
    <div className="h-screen flex bg-dark-bg">
      {/* Sidebar */}
      <div className="w-64 glass border-r border-white/10 flex flex-col">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
              <Shield size={24} className="text-white" />
            </div>
            <div>
              <h2 className="font-bold text-white text-lg">Admin Panel</h2>
              <p className="text-xs text-gray-400">LAN Chat</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-2 transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary/20 text-primary border border-primary/30'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="glass border-b border-white/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">
                {tabs.find(t => t.id === activeTab)?.label}
              </h1>
              <p className="text-sm text-gray-400">
                Manage your {activeTab} and permissions
              </p>
            </div>
            {(activeTab === 'users' || activeTab === 'groups') && (
              <button
                onClick={() => activeTab === 'users' ? setShowAddUserModal(true) : setShowAddGroupModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark rounded-xl text-white font-medium transition-colors"
              >
                <Plus size={20} />
                Add {activeTab === 'users' ? 'User' : 'Group'}
              </button>
            )}
          </div>

          {(activeTab === 'users' || activeTab === 'groups') && (
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${activeTab}...`}
                className="w-full bg-dark-card border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
          {activeTab === 'users' && (
            <div className="grid gap-4">
              {filteredUsers.map((user) => (
                <div key={user.id} className="glass p-4 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                      {user.username[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-white">{user.username}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.status === 'active' ? 'bg-success/20 text-success' :
                          user.status === 'suspended' ? 'bg-warning/20 text-warning' :
                          'bg-error/20 text-error'
                        }`}>
                          {user.status}
                        </span>
                        {user.role === 'admin' && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary">
                            Admin
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">
                        Joined: {new Date(user.joinedAt || user.joined_at).toLocaleDateString()} • 
                        Last active: {new Date(user.lastActive || user.last_active).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {editingUserId === user.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="New password"
                          className="px-3 py-1 bg-dark-card border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-primary/50"
                        />
                        <button
                          onClick={() => handleUpdatePassword(user.id)}
                          className="px-3 py-1 bg-primary hover:bg-primary-dark rounded-lg text-white text-sm transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingUserId(null);
                            setNewPassword('');
                          }}
                          className="px-3 py-1 bg-dark-card hover:bg-dark-hover rounded-lg text-white text-sm transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => setEditingUserId(user.id)}
                          className="p-2 hover:bg-primary/10 rounded-lg text-primary transition-colors"
                          title="Change Password"
                        >
                          <Key size={18} />
                        </button>
                        <button
                          onClick={() => handleSuspendUser(user.id)}
                          className="p-2 hover:bg-warning/10 rounded-lg text-warning transition-colors"
                          title="Suspend User"
                        >
                          <Ban size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-2 hover:bg-error/10 rounded-lg text-error transition-colors"
                          title="Delete User"
                        >
                          <Trash2 size={18} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'groups' && (
            <div className="grid gap-4">
              {filteredGroups.map((group) => (
                <div key={group.id} className="glass p-4 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                      <Users size={24} className="text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-white">{group.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          group.status === 'active' ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'
                        }`}>
                          {group.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">
                        {group.member_count} members • Created: {new Date(group.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSuspendGroup(group.id)}
                      className="p-2 hover:bg-warning/10 rounded-lg text-warning transition-colors"
                      title="Suspend Group"
                    >
                      <Ban size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteGroup(group.id)}
                      className="p-2 hover:bg-error/10 rounded-lg text-error transition-colors"
                      title="Delete Group"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-4">
              <div className="glass p-6 rounded-xl">
                <h3 className="text-lg font-semibold text-white mb-4">General Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">Allow User Registration</p>
                      <p className="text-sm text-gray-400">Users can join without admin approval</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">File Sharing</p>
                      <p className="text-sm text-gray-400">Allow users to share files</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">Code Sharing</p>
                      <p className="text-sm text-gray-400">Allow users to share code snippets</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="glass p-6 rounded-xl">
                <h3 className="text-lg font-semibold text-white mb-4">File Upload Limits</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Max File Size (MB)</label>
                    <input
                      type="number"
                      defaultValue={50}
                      className="w-full bg-dark-card border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-primary/50"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="glass p-6 rounded-xl">
              <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {logs.length > 0 ? (
                  logs.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        log.action.includes('login') ? 'bg-success' :
                        log.action.includes('delete') || log.action.includes('suspend') ? 'bg-error' :
                        log.action.includes('create') ? 'bg-primary' :
                        'bg-gray-400'
                      }`}></div>
                      <div className="flex-1">
                        <p className="text-sm text-white">
                          <span className="font-medium">{log.username || 'System'}</span> - {log.details}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(log.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-center py-4">No activity logs yet</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {showAddUserModal && (
        <AddUserModal socket={socket} onClose={() => setShowAddUserModal(false)} />
      )}

      {showAddGroupModal && (
        <AddGroupModal socket={socket} onClose={() => setShowAddGroupModal(false)} />
      )}
    </div>
  );
};

export default AdminDashboard;
