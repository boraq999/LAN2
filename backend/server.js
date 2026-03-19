const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: true,
    credentials: true,
    methods: ["GET", "POST"]
  },
  maxHttpBufferSize: 50e6 // 50MB for file transfers
});

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Store connected users with roles
const users = new Map();
const rooms = new Map();
const adminCredentials = { username: 'admin', password: 'admin123' };

// Admin data storage
const adminData = {
  users: [],
  groups: [],
  settings: {
    allowRegistration: true,
    fileSharing: true,
    codeSharing: true,
    maxFileSize: 50
  }
};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // User registration
  socket.on('register', (userData) => {
    users.set(socket.id, {
      id: socket.id,
      username: userData.username,
      avatar: userData.avatar,
      status: 'online',
      role: userData.role || 'user',
      joinedAt: new Date().toISOString(),
      lastActive: new Date().toISOString()
    });
    
    // Add to admin data
    adminData.users.push({
      id: socket.id,
      username: userData.username,
      status: 'active',
      role: userData.role || 'user',
      joinedAt: new Date().toISOString(),
      lastActive: new Date().toISOString()
    });
    
    io.emit('users-update', Array.from(users.values()));
  });

  // Join room/chat
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    if (!rooms.has(roomId)) {
      rooms.set(roomId, { id: roomId, members: [] });
    }
    const room = rooms.get(roomId);
    if (!room.members.includes(socket.id)) {
      room.members.push(socket.id);
    }
  });

  // Send message
  socket.on('send-message', (data) => {
    const message = {
      id: Date.now(),
      senderId: socket.id,
      senderName: users.get(socket.id)?.username || 'Unknown',
      content: data.content,
      type: data.type || 'text',
      timestamp: new Date().toISOString(),
      roomId: data.roomId
    };
    io.to(data.roomId).emit('receive-message', message);
  });

  // File transfer
  socket.on('send-file', (data) => {
    const fileMessage = {
      id: Date.now(),
      senderId: socket.id,
      senderName: users.get(socket.id)?.username || 'Unknown',
      type: 'file',
      fileName: data.fileName,
      fileSize: data.fileSize,
      fileData: data.fileData,
      timestamp: new Date().toISOString(),
      roomId: data.roomId
    };
    io.to(data.roomId).emit('receive-message', fileMessage);
  });

  // Typing indicator
  socket.on('typing', (data) => {
    socket.to(data.roomId).emit('user-typing', {
      userId: socket.id,
      username: users.get(socket.id)?.username,
      isTyping: data.isTyping
    });
  });

  // Disconnect
  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    if (user) {
      // Update admin data
      const userIndex = adminData.users.findIndex(u => u.id === socket.id);
      if (userIndex !== -1) {
        adminData.users[userIndex].lastActive = new Date().toISOString();
      }
    }
    users.delete(socket.id);
    io.emit('users-update', Array.from(users.values()));
    console.log('User disconnected:', socket.id);
  });

  // Admin: Get users list
  socket.on('admin:get-users', () => {
    socket.emit('admin:users-list', adminData.users);
  });

  // Admin: Get groups list
  socket.on('admin:get-groups', () => {
    socket.emit('admin:groups-list', adminData.groups);
  });

  // Admin: Suspend user
  socket.on('admin:suspend-user', (data) => {
    const userIndex = adminData.users.findIndex(u => u.id === data.userId);
    if (userIndex !== -1) {
      adminData.users[userIndex].status = 
        adminData.users[userIndex].status === 'active' ? 'suspended' : 'active';
      io.emit('admin:users-list', adminData.users);
      
      // Disconnect suspended user
      if (adminData.users[userIndex].status === 'suspended') {
        io.to(data.userId).emit('user-suspended');
      }
    }
  });

  // Admin: Delete user
  socket.on('admin:delete-user', (data) => {
    adminData.users = adminData.users.filter(u => u.id !== data.userId);
    io.emit('admin:users-list', adminData.users);
    io.to(data.userId).emit('user-deleted');
  });

  // Admin: Suspend group
  socket.on('admin:suspend-group', (data) => {
    const groupIndex = adminData.groups.findIndex(g => g.id === data.groupId);
    if (groupIndex !== -1) {
      adminData.groups[groupIndex].status = 
        adminData.groups[groupIndex].status === 'active' ? 'suspended' : 'active';
      io.emit('admin:groups-list', adminData.groups);
    }
  });

  // Admin: Delete group
  socket.on('admin:delete-group', (data) => {
    adminData.groups = adminData.groups.filter(g => g.id !== data.groupId);
    io.emit('admin:groups-list', adminData.groups);
  });

  // Admin: Create group
  socket.on('admin:create-group', (data) => {
    const newGroup = {
      id: 'group-' + Date.now(),
      name: data.name,
      members: data.members || [],
      status: 'active',
      createdAt: new Date().toISOString(),
      createdBy: socket.id
    };
    adminData.groups.push(newGroup);
    io.emit('admin:groups-list', adminData.groups);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Local Network: http://0.0.0.0:${PORT}`);
});
