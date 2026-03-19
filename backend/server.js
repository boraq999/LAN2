const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { db, users: userQueries, groups: groupQueries, messages: messageQueries, logs: logQueries, settings: settingQueries } = require('./database');

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
const onlineUsers = new Map(); // For real-time tracking only

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Log activity
  logQueries.create.run(socket.id, 'connect', 'User connected to server');

  // User registration
  socket.on('register', (userData) => {
    try {
      // Check if user exists
      const existingUser = userQueries.getById.get(socket.id);
      
      if (!existingUser) {
        // Create new user in database
        userQueries.create.run(
          socket.id,
          userData.username,
          userData.avatar || '',
          userData.role || 'user',
          'active'
        );
      } else {
        // Update last active
        userQueries.updateLastActive.run(socket.id);
      }

      // Add to online users
      onlineUsers.set(socket.id, {
        id: socket.id,
        username: userData.username,
        avatar: userData.avatar,
        status: 'online',
        role: userData.role || 'user'
      });

      // Log activity
      logQueries.create.run(socket.id, 'register', `User ${userData.username} registered`);
      
      io.emit('users-update', Array.from(onlineUsers.values()));
    } catch (error) {
      console.error('Registration error:', error);
    }
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
    try {
      const user = onlineUsers.get(socket.id);
      
      // Save message to database
      const result = messageQueries.create.run(
        socket.id,
        user?.username || 'Unknown',
        data.roomId,
        data.content,
        data.type || 'text',
        null,
        null,
        null,
        null
      );

      const message = {
        id: result.lastInsertRowid,
        senderId: socket.id,
        senderName: user?.username || 'Unknown',
        content: data.content,
        type: data.type || 'text',
        timestamp: new Date().toISOString(),
        roomId: data.roomId
      };
      
      io.to(data.roomId).emit('receive-message', message);
      
      // Log activity
      logQueries.create.run(socket.id, 'send_message', `Sent message to ${data.roomId}`);
    } catch (error) {
      console.error('Send message error:', error);
    }
  });

  // File transfer
  socket.on('send-file', (data) => {
    try {
      const user = onlineUsers.get(socket.id);
      
      // Save file message to database
      const result = messageQueries.create.run(
        socket.id,
        user?.username || 'Unknown',
        data.roomId,
        '',
        'file',
        data.fileName,
        data.fileSize,
        data.fileData,
        null
      );

      const fileMessage = {
        id: result.lastInsertRowid,
        senderId: socket.id,
        senderName: user?.username || 'Unknown',
        type: 'file',
        fileName: data.fileName,
        fileSize: data.fileSize,
        fileData: data.fileData,
        timestamp: new Date().toISOString(),
        roomId: data.roomId
      };
      
      io.to(data.roomId).emit('receive-message', fileMessage);
      
      // Log activity
      logQueries.create.run(socket.id, 'send_file', `Sent file ${data.fileName}`);
    } catch (error) {
      console.error('Send file error:', error);
    }
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
    try {
      // Update user status in database
      userQueries.updateStatus.run('offline', socket.id);
      
      // Remove from online users
      onlineUsers.delete(socket.id);
      
      // Log activity
      logQueries.create.run(socket.id, 'disconnect', 'User disconnected');
      
      io.emit('users-update', Array.from(onlineUsers.values()));
      console.log('User disconnected:', socket.id);
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  });

  // Admin: Get users list
  socket.on('admin:get-users', () => {
    try {
      const allUsers = userQueries.getAll.all();
      socket.emit('admin:users-list', allUsers);
    } catch (error) {
      console.error('Get users error:', error);
    }
  });

  // Admin: Get groups list
  socket.on('admin:get-groups', () => {
    try {
      const allGroups = groupQueries.getAll.all();
      socket.emit('admin:groups-list', allGroups);
    } catch (error) {
      console.error('Get groups error:', error);
    }
  });

  // Admin: Suspend user
  socket.on('admin:suspend-user', (data) => {
    try {
      const user = userQueries.getById.get(data.userId);
      const newStatus = user.status === 'active' ? 'suspended' : 'active';
      
      userQueries.updateStatus.run(newStatus, data.userId);
      logQueries.create.run(socket.id, 'suspend_user', `User ${data.userId} ${newStatus}`);
      
      const allUsers = userQueries.getAll.all();
      io.emit('admin:users-list', allUsers);
      
      if (newStatus === 'suspended') {
        io.to(data.userId).emit('user-suspended');
      }
    } catch (error) {
      console.error('Suspend user error:', error);
    }
  });

  // Admin: Delete user
  socket.on('admin:delete-user', (data) => {
    try {
      userQueries.delete.run(data.userId);
      logQueries.create.run(socket.id, 'delete_user', `User ${data.userId} deleted`);
      
      const allUsers = userQueries.getAll.all();
      io.emit('admin:users-list', allUsers);
      io.to(data.userId).emit('user-deleted');
    } catch (error) {
      console.error('Delete user error:', error);
    }
  });

  // Admin: Suspend group
  socket.on('admin:suspend-group', (data) => {
    try {
      const group = groupQueries.getById.get(data.groupId);
      const newStatus = group.status === 'active' ? 'suspended' : 'active';
      
      groupQueries.updateStatus.run(newStatus, data.groupId);
      logQueries.create.run(socket.id, 'suspend_group', `Group ${data.groupId} ${newStatus}`);
      
      const allGroups = groupQueries.getAll.all();
      io.emit('admin:groups-list', allGroups);
    } catch (error) {
      console.error('Suspend group error:', error);
    }
  });

  // Admin: Delete group
  socket.on('admin:delete-group', (data) => {
    try {
      groupQueries.delete.run(data.groupId);
      logQueries.create.run(socket.id, 'delete_group', `Group ${data.groupId} deleted`);
      
      const allGroups = groupQueries.getAll.all();
      io.emit('admin:groups-list', allGroups);
    } catch (error) {
      console.error('Delete group error:', error);
    }
  });

  // Admin: Create group
  socket.on('admin:create-group', (data) => {
    try {
      const groupId = 'group-' + Date.now();
      groupQueries.create.run(groupId, data.name, socket.id);
      
      // Add members
      if (data.members && data.members.length > 0) {
        data.members.forEach(memberId => {
          groupQueries.addMember.run(groupId, memberId);
        });
      }
      
      logQueries.create.run(socket.id, 'create_group', `Group ${data.name} created`);
      
      const allGroups = groupQueries.getAll.all();
      io.emit('admin:groups-list', allGroups);
    } catch (error) {
      console.error('Create group error:', error);
    }
  });

  // Get room messages
  socket.on('get-room-messages', (data) => {
    try {
      const messages = messageQueries.getByRoom.all(data.roomId);
      socket.emit('room-messages', { roomId: data.roomId, messages });
    } catch (error) {
      console.error('Get messages error:', error);
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Local Network: http://0.0.0.0:${PORT}`);
});
