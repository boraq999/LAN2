import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import InfoPanel from './components/InfoPanel';
import LoginModal from './components/LoginModal';

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
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ [key: string]: Message[] }>({});
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

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

    newSocket.on('users-update', (updatedUsers: User[]) => {
      setUsers(updatedUsers);
      updateChatsFromUsers(updatedUsers);
    });

    newSocket.on('receive-message', (message: Message) => {
      setMessages((prev) => ({
        ...prev,
        [message.roomId]: [...(prev[message.roomId] || []), message],
      }));

      // Update last message in chat list
      setChats((prev) =>
        prev.map((chat) =>
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
        )
      );
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const updateChatsFromUsers = (updatedUsers: User[]) => {
    const newChats: Chat[] = updatedUsers
      .filter((user) => user.id !== currentUser?.id)
      .map((user) => ({
        id: user.id,
        name: user.username,
        avatar: user.avatar,
        lastMessage: 'Start a conversation',
        timestamp: 'Now',
        isOnline: user.status === 'online',
      }));

    // Add a default group chat
    const groupChat: Chat = {
      id: 'group-main',
      name: 'Team Apollo',
      avatar: '',
      lastMessage: 'Welcome to the group!',
      timestamp: 'Now',
      isGroup: true,
      isOnline: true,
    };

    setChats([groupChat, ...newChats]);
  };

  const handleLogin = (username: string) => {
    const user: User = {
      id: '',
      username,
      avatar: '',
      status: 'online',
    };
    setCurrentUser(user);
    setIsLoggedIn(true);

    if (socket) {
      socket.emit('register', { username, avatar: '' });
    }
  };

  const handleChatSelect = (chatId: string) => {
    setActiveChat(chatId);
    if (socket) {
      socket.emit('join-room', chatId);
    }
    if (!messages[chatId]) {
      setMessages((prev) => ({ ...prev, [chatId]: [] }));
    }
  };

  const handleSendMessage = (content: string, type: string) => {
    if (!socket || !activeChat) return;

    socket.emit('send-message', {
      content,
      type,
      roomId: activeChat,
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
      });
    };
    reader.readAsDataURL(file);
  };

  const handleTyping = (isTyping: boolean) => {
    if (!socket || !activeChat) return;
    socket.emit('typing', { roomId: activeChat, isTyping });
  };

  const activeChatData = chats.find((chat) => chat.id === activeChat);
  const activeMessages = activeChat ? messages[activeChat] || [] : [];

  const members = [
    { id: '1', name: 'Aisha', status: 'online' as const },
    { id: '2', name: 'Khalid', status: 'online' as const },
    { id: '3', name: 'Sarah', status: 'offline' as const },
    { id: '4', name: 'Ben', status: 'online' as const },
    { id: '5', name: 'Omar', status: 'online' as const },
  ];

  return (
    <div className="h-screen flex overflow-hidden relative">
      {!isLoggedIn && <LoginModal onLogin={handleLogin} />}

      <Sidebar
        chats={chats}
        activeChat={activeChat}
        onChatSelect={handleChatSelect}
        currentUser={currentUser}
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
      />

      <InfoPanel
        chatName={activeChatData?.name || ''}
        members={members}
        isOpen={showInfoPanel && activeChat !== null}
        onClose={() => setShowInfoPanel(false)}
      />
    </div>
  );
}

export default App;
