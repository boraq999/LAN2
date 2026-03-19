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

    newSocket.on('connect', () => {
      console.log('Admin socket connected');
    });

    newSocket.on('admin:login-success', (data) => {
      console.log('Admin login success:', data);
      setIsAuthenticated(true);
    });

    newSocket.on('admin:login-error', (error) => {
      console.error('Admin login error:', error);
      alert(error.message || 'Invalid admin credentials');
    });

    setSocket(newSocket);

    return () => {
      newSocket.off('admin:login-success');
      newSocket.off('admin:login-error');
      newSocket.close();
    };
  }, []);

  const handleAdminLogin = (username: string, password: string) => {
    console.log('Attempting admin login:', username);
    if (socket && socket.connected) {
      socket.emit('admin:login', { username, password });
    } else {
      console.error('Socket not connected');
      alert('Connection error. Please refresh the page.');
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
