import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Smile, Mic, Phone, Video, MoreVertical, FileText, Users, Download, Copy, Forward, Trash2 } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ConfirmModal from './ConfirmModal';
import ForwardModal from './ForwardModal';

interface Message {
  id: number;
  senderId: string;
  senderName: string;
  content: string;
  type: 'text' | 'code' | 'file';
  timestamp: string;
  fileName?: string;
  fileSize?: number;
  language?: string;
  isDeleted?: boolean;
}

interface ChatAreaProps {
  chatId: string | null;
  chatName: string;
  messages: Message[];
  currentUserId: string;
  onSendMessage: (content: string, type: string) => void;
  onSendFile: (file: File) => void;
  onTyping: (isTyping: boolean) => void;
  onToggleInfo: () => void;
  onDeleteMessage?: (messageId: number) => void;
  allChats?: Array<{ id: string; name: string; isGroup?: boolean; isOnline?: boolean }>;
}

const ChatArea: React.FC<ChatAreaProps> = ({
  chatId,
  chatName,
  messages,
  currentUserId,
  onSendMessage,
  onSendFile,
  onTyping,
  onToggleInfo,
  onDeleteMessage,
  allChats = [],
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isCodeMode, setIsCodeMode] = useState(false);
  const [hoveredMessageId, setHoveredMessageId] = useState<number | null>(null);
  const [selectedMessageId, setSelectedMessageId] = useState<number | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<number | null>(null);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [messageToForward, setMessageToForward] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setSelectedMessageId(null);
        setMenuPosition(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMessageClick = (e: React.MouseEvent, messageId: number) => {
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setSelectedMessageId(messageId);
    setMenuPosition({
      x: rect.right - 150,
      y: rect.top
    });
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    setSelectedMessageId(null);
    setMenuPosition(null);
  };

  const handleForwardMessage = (message: Message) => {
    setMessageToForward(message);
    setShowForwardModal(true);
    setSelectedMessageId(null);
    setMenuPosition(null);
  };

  const handleForwardConfirm = (chatIds: string[]) => {
    if (messageToForward) {
      chatIds.forEach(chatId => {
        if (messageToForward.type === 'file') {
          // Forward file
          onSendMessage(`📎 ${messageToForward.fileName}`, 'file');
        } else {
          // Forward text/code
          onSendMessage(messageToForward.content, messageToForward.type);
        }
      });
    }
    setShowForwardModal(false);
    setMessageToForward(null);
  };

  const handleForwardCancel = () => {
    setShowForwardModal(false);
    setMessageToForward(null);
  };

  const handleDeleteMessage = (messageId: number) => {
    setMessageToDelete(messageId);
    setShowDeleteConfirm(true);
    setSelectedMessageId(null);
    setMenuPosition(null);
  };

  const confirmDelete = () => {
    if (messageToDelete) {
      onDeleteMessage?.(messageToDelete);
    }
    setShowDeleteConfirm(false);
    setMessageToDelete(null);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setMessageToDelete(null);
  };

  const handleFileDownload = (fileData: string, fileName: string) => {
    try {
      // Create a link and trigger download
      const link = document.createElement('a');
      link.href = fileData;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download file');
    }
  };

  const handleSend = () => {
    if (inputValue.trim()) {
      onSendMessage(inputValue, isCodeMode ? 'code' : 'text');
      setInputValue('');
      setIsCodeMode(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onSendFile(file);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '0 KB';
    const kb = bytes / 1024;
    return kb > 1024 ? `${(kb / 1024).toFixed(2)} MB` : `${kb.toFixed(2)} KB`;
  };

  const detectCodeLanguage = (content: string): string => {
    if (content.includes('import React') || content.includes('useState')) return 'jsx';
    if (content.includes('function') || content.includes('const')) return 'javascript';
    if (content.includes('def ') || content.includes('import ')) return 'python';
    return 'javascript';
  };

  if (!chatId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-dark-bg">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-purple-600/20 flex items-center justify-center">
            <Users size={40} className="text-primary" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Select a chat to start messaging</h3>
          <p className="text-gray-400">Choose from your existing conversations or start a new one</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-dark-bg">
      {/* Header */}
      <div className="glass border-b border-white/10 p-3 md:p-4 flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm md:text-base flex-shrink-0">
            {chatName?.[0]?.toUpperCase() || 'C'}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-white text-sm md:text-base truncate">{chatName}</h3>
            <p className="text-xs text-success">Online</p>
          </div>
        </div>
        <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
          <button className="p-2 hover:bg-white/5 rounded-lg transition-colors hidden sm:block">
            <Phone size={18} className="text-gray-400" />
          </button>
          <button className="p-2 hover:bg-white/5 rounded-lg transition-colors hidden sm:block">
            <Video size={18} className="text-gray-400" />
          </button>
          <button 
            onClick={onToggleInfo}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <MoreVertical size={18} className="text-gray-400" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-3 md:p-4 space-y-3 md:space-y-4">
        {messages.map((message) => {
          const isSent = message.senderId === currentUserId;
          
          if (message.isDeleted) {
            return (
              <div key={message.id} className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[85%] md:max-w-2xl">
                  <div className="glass p-3 rounded-xl border border-white/10 opacity-60">
                    <p className="text-xs md:text-sm text-gray-400 italic">🗑️ تم حذف الرسالة</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 px-1">{formatTime(message.timestamp)}</p>
                </div>
              </div>
            );
          }
          
          return (
            <div 
              key={message.id} 
              className={`flex ${isSent ? 'justify-end' : 'justify-start'} group relative`}
              onMouseEnter={() => setHoveredMessageId(message.id)}
              onMouseLeave={() => setHoveredMessageId(null)}
            >
              <div 
                className={`flex gap-2 max-w-[85%] md:max-w-2xl ${isSent ? 'flex-row-reverse' : 'flex-row'} cursor-pointer`}
                onClick={(e) => handleMessageClick(e, message.id)}
              >
                {!isSent && (
                  <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                    {message.senderName?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  {!isSent && (
                    <p className="text-xs text-gray-400 mb-1 px-1">{message.senderName || 'Unknown'}</p>
                  )}
                  {message.type === 'code' ? (
                    <div className="rounded-xl overflow-hidden border border-white/10 overflow-x-auto">
                      <SyntaxHighlighter
                        language={message.language || detectCodeLanguage(message.content)}
                        style={vscDarkPlus}
                        customStyle={{
                          margin: 0,
                          padding: '0.75rem',
                          background: '#1e1e1e',
                          fontSize: '0.75rem',
                        }}
                        wrapLongLines={true}
                      >
                        {message.content}
                      </SyntaxHighlighter>
                    </div>
                  ) : message.type === 'file' ? (
                    <div className={`glass p-3 md:p-4 rounded-xl border border-white/10`}>
                      <div className="flex items-center gap-2 md:gap-3">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <FileText size={16} className="text-primary md:w-5 md:h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs md:text-sm font-medium text-white truncate">{message.fileName}</p>
                          <p className="text-xs text-gray-400">{formatFileSize(message.fileSize)}</p>
                        </div>
                        <button
                          onClick={() => handleFileDownload(message.fileData || '', message.fileName || 'file')}
                          className="p-2 hover:bg-primary/20 rounded-lg transition-colors flex-shrink-0"
                          title="Download file"
                        >
                          <Download size={16} className="text-primary" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className={`message-bubble text-xs md:text-sm ${isSent ? 'message-sent' : 'message-received'}`}>
                      <p className="break-words">{message.content}</p>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1 px-1">{formatTime(message.timestamp)}</p>
                </div>
              </div>
            </div>
          );
        })}
        
        {/* Context Menu */}
        {selectedMessageId && menuPosition && (
          <div
            ref={menuRef}
            className="fixed glass border border-white/20 rounded-xl shadow-2xl py-2 z-50 min-w-[150px]"
            style={{
              left: `${menuPosition.x}px`,
              top: `${menuPosition.y}px`,
            }}
          >
            {(() => {
              const message = messages.find(m => m.id === selectedMessageId);
              const isSent = message?.senderId === currentUserId;
              
              return (
                <>
                  {message?.type !== 'file' && (
                    <button
                      onClick={() => handleCopyMessage(message?.content || '')}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-white/10 transition-colors text-left"
                    >
                      <Copy size={16} className="text-gray-400" />
                      <span className="text-sm text-white">نسخ</span>
                    </button>
                  )}
                  
                  <button
                    onClick={() => message && handleForwardMessage(message)}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-white/10 transition-colors text-left"
                  >
                    <Forward size={16} className="text-gray-400" />
                    <span className="text-sm text-white">إعادة توجيه</span>
                  </button>
                  
                  {isSent && onDeleteMessage && (
                    <button
                      onClick={() => handleDeleteMessage(selectedMessageId)}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-error/20 transition-colors text-left border-t border-white/10 mt-1 pt-2"
                    >
                      <Trash2 size={16} className="text-error" />
                      <span className="text-sm text-error">حذف</span>
                    </button>
                  )}
                </>
              );
            })()}
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="glass border-t border-white/10 p-2 md:p-4">
        <div className="flex items-end gap-2 md:gap-3">
          <div className="flex-1 min-w-0">
            {isCodeMode && (
              <div className="mb-2 flex items-center gap-2">
                <span className="text-xs text-primary font-mono">Code Mode</span>
                <button
                  onClick={() => setIsCodeMode(false)}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  Exit
                </button>
              </div>
            )}
            <textarea
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                onTyping(e.target.value.length > 0);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={isCodeMode ? 'Type your code...' : 'Type a message...'}
              className={`w-full bg-dark-card border border-white/10 rounded-xl px-3 py-2 md:px-4 md:py-3 text-xs md:text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary/50 transition-colors resize-none ${
                isCodeMode ? 'font-mono' : ''
              }`}
              rows={isCodeMode ? 3 : 1}
            />
          </div>
          <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 md:p-3 hover:bg-white/5 rounded-xl transition-colors"
            >
              <Paperclip size={18} className="text-gray-400 md:w-5 md:h-5" />
            </button>
            <button
              onClick={() => setIsCodeMode(!isCodeMode)}
              className={`p-2 md:p-3 rounded-xl transition-colors ${
                isCodeMode ? 'bg-primary/20 text-primary' : 'hover:bg-white/5 text-gray-400'
              }`}
            >
              <span className="text-xs md:text-sm font-mono">{'{}'}</span>
            </button>
            <button
              onClick={handleSend}
              disabled={!inputValue.trim()}
              className="p-2 md:p-3 bg-primary hover:bg-primary-dark rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={18} className="text-white md:w-5 md:h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="حذف الرسالة"
        message="هل أنت متأكد من حذف هذه الرسالة؟ لن تتمكن من استرجاعها."
        confirmText="حذف"
        cancelText="إلغاء"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        type="danger"
      />

      {/* Forward Modal */}
      <ForwardModal
        isOpen={showForwardModal}
        message={messageToForward}
        chats={allChats.filter(chat => chat.id !== chatId)}
        onForward={handleForwardConfirm}
        onCancel={handleForwardCancel}
      />
    </div>
  );
};

export default ChatArea;
