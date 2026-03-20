import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import InfoPanel from './components/InfoPanel';
import LoginModal from './components/LoginModal';
import AdminAccessButton from './components/AdminAccessButton';

interface User {
  id: string;
  username: string;
  avatar: string;
  status: string;
}

interface Message {
  id: number;
  senderId: string;
  senderName: string;
  content: string;
  type: 'text' | 'code' | 'file';
  timestamp: string;
  roomId: string;
  fileName?: string;
  fileSize?: number;
  fileData?: string;
  language?: string;
  isDeleted?: boolean;
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

const SOCKET_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3001'
  : `http://${window.location.hostname}:3001`;

function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [privateChats, setPrivateChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [activeChatType, setActiveChatType] = useState<'private' | 'group'>('group');
  const [messages, setMessages] = useState<{ [key: string]: Message[] }>({});
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to server');
    });

    newSocket.on('user:login-success', (userData) => {
      setCurrentUser({
        id: userData.id,
        username: userData.username,
        avatar: userData.avatar || '',
        status: 'online'
      });
      setIsLoggedIn(true);
      setLoginError('');
    });

    newSocket.on('user:login-error', (error) => {
      setLoginError(error.message);
      setIsLoggedIn(false);
    });

    newSocket.on('user-suspended', () => {
      alert('Your account has been suspended by admin');
      setIsLoggedIn(false);
      setCurrentUser(null);
    });

    newSocket.on('user-deleted', () => {
      alert('Your account has been deleted by admin');
      setIsLoggedIn(false);
      setCurrentUser(null);
    });

    newSocket.on('users:online', (updatedUsers: User[]) => {
      console.log('👥 Online users updated:', updatedUsers.length);
      setUsers(updatedUsers);
    });

    newSocket.on('groups-list', (groupsList: any[]) => {
      const groupChats = groupsList
        .filter(g => g.status === 'active')
        .map(g => ({
          id: g.id,
          name: g.name,
          avatar: '',
          lastMessage: 'Group chat',
          timestamp: 'Now',
          isGroup: true,
          isOnline: true
        }));
      setChats(groupChats);
    });

    newSocket.on('private-chats-list', (privateChatsData: any[]) => {
      const privateChatsList = privateChatsData.map(chat => ({
        id: chat.roomId,
        name: chat.username,
        avatar: chat.avatar,
        lastMessage: 'Start chatting',
        timestamp: 'Now',
        isGroup: false,
        isOnline: chat.status === 'online'
      }));
      setPrivateChats(privateChatsList);
    });

    newSocket.on('private-chat-started', (data: any) => {
      // Request user info from backend to add to sidebar
      newSocket.emit('get-user-info', { userId: data.otherUserId });
    });

    newSocket.on('user-info', (userData: any) => {
      // Add to private chats list if not exists
      setPrivateChats(prev => {
        const roomId = [currentUser?.id, userData.id].filter(Boolean).sort().join('-');
        const exists = prev.find(chat => chat.id === roomId);
        
        if (!exists) {
          return [{
            id: roomId,
            name: userData.username,
            avatar: userData.avatar || '',
            lastMessage: 'Start chatting',
            timestamp: 'Now',
            isGroup: false,
            isOnline: userData.status === 'online'
          }, ...prev];
        }
        return prev;
      });
    });

    newSocket.on('receive-message', (message: Message) => {
      setMessages((prev) => ({
        ...prev,
        [message.roomId]: [...(prev[message.roomId] || []), message],
      }));

      // Update last message in chats
      const updateChatsList = (chatsList: Chat[]) => 
        chatsList.map((chat) =>
          chat.id === message.roomId
            ? {
                ...chat,
                lastMessage: message.type === 'file' ? `📎 ${message.fileName}` : message.content,
                timestamp: new Date(message.timestamp).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                }),
              }
            : chat
        );

      setChats(updateChatsList);
      setPrivateChats(updateChatsList);
    });

    newSocket.on('message-deleted', (data: { messageId: number; roomId: string }) => {
      setMessages((prev) => ({
        ...prev,
        [data.roomId]: prev[data.roomId]?.map(msg => 
          msg.id === data.messageId ? { ...msg, isDeleted: true } : msg
        ) || []
      }));
    });

    newSocket.on('room-messages', (data) => {
      setMessages((prev) => ({
        ...prev,
        [data.roomId]: data.messages || []
      }));
    });

    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    if (socket && isLoggedIn && currentUser) {
      console.log('🔄 Fetching groups and private chats for:', currentUser.username);
      socket.emit('get-groups');
      socket.emit('get-private-chats', { userId: currentUser.id });
    }
  }, [socket, isLoggedIn, currentUser]);

  const updateChatsFromUsers = (updatedUsers: User[]) => {
    // This function is no longer needed as we handle private chats separately
  };

  const handleStartPrivateChat = (userId: string) => {
    if (socket && currentUser) {
      const roomId = [currentUser.id, userId].sort().join('-');
      
      // Always set as active chat
      setActiveChat(roomId);
      setActiveChatType('private');
      socket.emit('join-room', roomId);
      
      // Check if chat already exists in list
      const existingChat = privateChats.find(chat => chat.id === roomId);
      
      if (!existingChat) {
        // Start new private chat and request user info
        socket.emit('start-private-chat', { userId1: currentUser.id, userId2: userId });
      }
    }
  };

  const handleLogin = (username: string, password: string) => {
    if (socket) {
      socket.emit('user:login', { username, password });
    }
  };

  const handleChatSelect = (chatId: string) => {
    setActiveChat(chatId);
    
    // Determine if it's a private or group chat
    const isPrivate = chatId.includes('-');
    setActiveChatType(isPrivate ? 'private' : 'group');
    
    if (socket) {
      socket.emit('join-room', chatId);
    }
  };

  const handleSendMessage = (content: string, type: string) => {
    if (!socket || !activeChat) return;

    socket.emit('send-message', {
      content,
      type,
      roomId: activeChat,
      roomType: activeChatType,
    });
  };

  const handleSendFile = (file: File) => {
    if (!socket || !activeChat) return;

    const reader = new FileReader();
    reader.onload = () => {
      socket.emit('send-file', {
        fileName: file.name,
        fileSize: file.size,
        fileData: reader.result,
        roomId: activeChat,
        roomType: activeChatType,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleTyping = (isTyping: boolean) => {
    if (!socket || !activeChat) return;
    socket.emit('typing', { roomId: activeChat, isTyping });
  };

  const handleDeleteMessage = (messageId: number) => {
    if (!socket || !activeChat) return;
    
    if (confirm('هل تريد حذف هذه الرسالة؟')) {
      socket.emit('delete-message', { messageId, roomId: activeChat });
    }
  };

  const activeChatData = [...chats, ...privateChats].find((chat) => chat.id === activeChat);
  const activeMessages = activeChat ? messages[activeChat] || [] : [];

  // Combine all chats for sidebar
  const allChats = [...privateChats, ...chats];

  const members = [
    { id: '1', name: 'Aisha', status: 'online' as const },
    { id: '2', name: 'Khalid', status: 'online' as const },
    { id: '3', name: 'Sarah', status: 'offline' as const },
    { id: '4', name: 'Ben', status: 'online' as const },
    { id: '5', name: 'Omar', status: 'online' as const },
  ];

  return (
    <div className="h-screen flex overflow-hidden relative">
      {!isLoggedIn && (
        <LoginModal onLogin={handleLogin} />
      )}
      
      {loginError && (
        <div className="fixed top-4 right-4 bg-error/90 text-white px-4 py-3 rounded-xl z-50">
          {loginError}
        </div>
      )}

      <Sidebar
        chats={allChats}
        activeChat={activeChat}
        onChatSelect={handleChatSelect}
        currentUser={currentUser}
        onStartPrivateChat={handleStartPrivateChat}
        onlineUsers={users}
      />

      <ChatArea
        chatId={activeChat}
        chatName={activeChatData?.name || ''}
        messages={activeMessages}
        currentUserId={currentUser?.id || ''}
        onSendMessage={handleSendMessage}
        onSendFile={handleSendFile}
        onTyping={handleTyping}
        onToggleInfo={() => setShowInfoPanel(!showInfoPanel)}
        onDeleteMessage={handleDeleteMessage}
        allChats={allChats}
      />

      <InfoPanel
        chatName={activeChatData?.name || ''}
        members={members}
        isOpen={showInfoPanel && activeChat !== null}
        onClose={() => setShowInfoPanel(false)}
      />

      <AdminAccessButton />
    </div>
  );
}

export default App;
