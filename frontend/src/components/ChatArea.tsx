import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Smile, Mic, Phone, Video, MoreVertical, FileText, Users } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

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
}

interface ChatAreaProps {
  chatId: string | null;
  chatName: string;
  messages: Message[];
  currentUserId: string;
  onSendMessage: (content: string, type: string) => void;
  onSendFile: (file: File) => void;
  onTyping: (isTyping: boolean) => void;
}

const ChatArea: React.FC<ChatAreaProps> = ({
  chatId,
  chatName,
  messages,
  currentUserId,
  onSendMessage,
  onSendFile,
  onTyping,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isCodeMode, setIsCodeMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
      <div className="glass border-b border-white/10 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
            {chatName[0].toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-white">{chatName}</h3>
            <p className="text-xs text-success">Online</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            <Phone size={20} className="text-gray-400" />
          </button>
          <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            <Video size={20} className="text-gray-400" />
          </button>
          <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            <MoreVertical size={20} className="text-gray-400" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
        {messages.map((message) => {
          const isSent = message.senderId === currentUserId;
          return (
            <div key={message.id} className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex gap-2 max-w-2xl ${isSent ? 'flex-row-reverse' : 'flex-row'}`}>
                {!isSent && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                    {message.senderName[0].toUpperCase()}
                  </div>
                )}
                <div>
                  {!isSent && (
                    <p className="text-xs text-gray-400 mb-1 px-1">{message.senderName}</p>
                  )}
                  {message.type === 'code' ? (
                    <div className="rounded-xl overflow-hidden border border-white/10">
                      <SyntaxHighlighter
                        language={message.language || detectCodeLanguage(message.content)}
                        style={vscDarkPlus}
                        customStyle={{
                          margin: 0,
                          padding: '1rem',
                          background: '#1e1e1e',
                          fontSize: '0.875rem',
                        }}
                      >
                        {message.content}
                      </SyntaxHighlighter>
                    </div>
                  ) : message.type === 'file' ? (
                    <div className={`glass p-4 rounded-xl flex items-center gap-3 ${isSent ? 'message-sent' : ''}`}>
                      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                        <FileText size={20} className="text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{message.fileName}</p>
                        <p className="text-xs text-gray-400">{formatFileSize(message.fileSize)}</p>
                      </div>
                    </div>
                  ) : (
                    <div className={`message-bubble ${isSent ? 'message-sent' : 'message-received'}`}>
                      <p className="text-sm">{message.content}</p>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1 px-1">{formatTime(message.timestamp)}</p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="glass border-t border-white/10 p-4">
        <div className="flex items-end gap-3">
          <div className="flex-1">
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
              className={`w-full bg-dark-card border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary/50 transition-colors resize-none ${
                isCodeMode ? 'font-mono' : ''
              }`}
              rows={isCodeMode ? 4 : 1}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-3 hover:bg-white/5 rounded-xl transition-colors"
            >
              <Paperclip size={20} className="text-gray-400" />
            </button>
            <button
              onClick={() => setIsCodeMode(!isCodeMode)}
              className={`p-3 rounded-xl transition-colors ${
                isCodeMode ? 'bg-primary/20 text-primary' : 'hover:bg-white/5 text-gray-400'
              }`}
            >
              <span className="text-sm font-mono">{'{}'}</span>
            </button>
            <button
              onClick={handleSend}
              disabled={!inputValue.trim()}
              className="p-3 bg-primary hover:bg-primary-dark rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={20} className="text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;
