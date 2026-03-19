import React, { useState } from 'react';
import { Search, Users, Bell, Settings, Menu, X } from 'lucide-react';

interface User {
  id: string;
  username: string;
  avatar: string;
  status: string;
}

interface Chat {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  unread?: number;
  isGroup?: boolean;
  isOnline?: boolean;
}

interface SidebarProps {
  chats: Chat[];
  activeChat: string | null;
  onChatSelect: (chatId: string) => void;
  currentUser: User | null;
}

const Sidebar: React.FC<SidebarProps> = ({ chats, activeChat, onChatSelect, currentUser }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 glass rounded-xl"
      >
        {isOpen ? <X size={24} className="text-white" /> : <Menu size={24} className="text-white" />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        />
      )}

      {/* Sidebar */}
      <div className={`
        w-80 glass border-r border-white/10 flex flex-col h-screen
        fixed lg:relative z-40
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-semibold">
              {currentUser?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <h2 className="font-semibold text-white">LAN Chat</h2>
              <p className="text-xs text-gray-400">{currentUser?.username || 'Guest'}</p>
            </div>
          </div>
          <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            <Settings size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search"
            className="w-full bg-dark-bg/50 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>
      </div>

      {/* Chats List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="p-2">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-2">
            Chats
          </h3>
          {chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => onChatSelect(chat.id)}
              className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all mb-1 ${
                activeChat === chat.id
                  ? 'bg-primary/20 border border-primary/30'
                  : 'hover:bg-white/5'
              }`}
            >
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                  {chat.isGroup ? <Users size={20} /> : chat.name[0].toUpperCase()}
                </div>
                {chat.isOnline && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-dark-card"></div>
                )}
              </div>
              <div className="flex-1 text-left overflow-hidden">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-white text-sm truncate">{chat.name}</h4>
                  <span className="text-xs text-gray-400">{chat.timestamp}</span>
                </div>
                <p className="text-xs text-gray-400 truncate">{chat.lastMessage}</p>
              </div>
              {chat.unread && (
                <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center text-xs font-semibold text-white">
                  {chat.unread}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div className="p-3 border-t border-white/10">
        <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
          <div className="relative">
            <Bell size={20} className="text-gray-400" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full"></div>
          </div>
          <span className="text-sm text-gray-300">Notifications</span>
          <span className="ml-auto bg-primary/20 text-primary text-xs font-semibold px-2 py-1 rounded-full">
            3
          </span>
        </button>
      </div>
      </div>
    </>
  );
};

export default Sidebar;
