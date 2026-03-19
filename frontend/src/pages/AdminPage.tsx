import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import AdminLogin from '../components/AdminLogin';
import AdminDashboard from '../components/AdminDashboard';

const SOCKET_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3001'
  : `http://${window.location.hostname}:3001`;

function AdminPage() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });
    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const handleAdminLogin = (username: string, password: string) => {
    if (username === 'admin' && password === 'admin123') {
      setIsAuthenticated(true);
      if (socket) {
        socket.emit('register', { username: 'Administrator', avatar: '', role: 'admin' });
      }
    } else {
      alert('Invalid credentials');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    if (socket) {
      socket.disconnect();
    }
    navigate('/');
  };

  return (
    <div className="h-screen bg-dark-bg">
      {!isAuthenticated ? (
        <AdminLogin 
          onLogin={handleAdminLogin} 
          onCancel={() => navigate('/')} 
        />
      ) : (
        <AdminDashboard socket={socket} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default AdminPage;
