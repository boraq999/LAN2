import React, { useState } from 'react';
import { X, Search, Users, MessageCircle } from 'lucide-react';

interface Chat {
  id: string;
  name: string;
  isGroup?: boolean;
  isOnline?: boolean;
}

interface ForwardModalProps {
  isOpen: boolean;
  message: {
    content: string;
    type: string;
    fileName?: string;
  } | null;
  chats: Chat[];
  onForward: (chatIds: string[]) => void;
  onCancel: () => void;
}

const ForwardModal: React.FC<ForwardModalProps> = ({
  isOpen,
  message,
  chats,
  onForward,
  onCancel
}) => {
  const [selectedChats, setSelectedChats] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen || !message) return null;

  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleChat = (chatId: string) => {
    setSelectedChats(prev =>
      prev.includes(chatId)
        ? prev.filter(id => id !== chatId)
        : [...prev, chatId]
    );
  };

  const handleForward = () => {
    if (selectedChats.length > 0) {
      onForward(selectedChats);
      setSelectedChats([]);
      setSearchQuery('');
    }
  };

  const handleCancel = () => {
    setSelectedChats([]);
    setSearchQuery('');
    onCancel();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="glass rounded-2xl p-6 w-full max-w-md border border-white/20 animate-scaleIn max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">إعادة توجيه الرسالة</h3>
          <button
            onClick={handleCancel}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Message Preview */}
        <div className="glass p-3 rounded-xl mb-4 border border-white/10">
          <p className="text-xs text-gray-400 mb-1">الرسالة:</p>
          {message.type === 'file' ? (
            <div className="flex items-center gap-2">
              <MessageCircle size={16} className="text-primary" />
              <p className="text-sm text-white truncate">📎 {message.fileName}</p>
            </div>
          ) : (
            <p className="text-sm text-white truncate">{message.content}</p>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث..."
            className="w-full bg-dark-card border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>

        {/* Chats List */}
        <div className="flex-1 overflow-y-auto scrollbar-thin mb-4 space-y-2">
          {filteredChats.length > 0 ? (
            filteredChats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => toggleChat(chat.id)}
                className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all ${
                  selectedChats.includes(chat.id)
                    ? 'bg-primary/20 border border-primary/30'
                    : 'bg-dark-card hover:bg-white/5 border border-white/10'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  chat.isGroup
                    ? 'bg-gradient-to-br from-purple-500 to-pink-600'
                    : 'bg-gradient-to-br from-blue-500 to-purple-600'
                }`}>
                  {chat.isGroup ? (
                    <Users size={18} className="text-white" />
                  ) : (
                    <span className="text-white text-sm font-semibold">
                      {chat.name[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm text-white font-medium">{chat.name}</p>
                  <p className="text-xs text-gray-400">
                    {chat.isGroup ? 'مجموعة' : 'محادثة خاصة'}
                  </p>
                </div>
                {selectedChats.includes(chat.id) && (
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
              </button>
            ))
          ) : (
            <p className="text-center text-gray-400 text-sm py-4">لا توجد محادثات</p>
          )}
        </div>

        {/* Selected Count */}
        {selectedChats.length > 0 && (
          <p className="text-xs text-gray-400 mb-4">
            تم اختيار {selectedChats.length} محادثة
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleCancel}
            className="flex-1 px-4 py-3 bg-dark-card hover:bg-dark-hover border border-white/10 text-white font-semibold rounded-xl transition-colors"
          >
            إلغاء
          </button>
          <button
            onClick={handleForward}
            disabled={selectedChats.length === 0}
            className="flex-1 px-4 py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            إرسال ({selectedChats.length})
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForwardModal;
