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

// Store connected users
const users = new Map();
const rooms = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // User registration
  socket.on('register', (userData) => {
    users.set(socket.id, {
      id: socket.id,
      username: userData.username,
      avatar: userData.avatar,
      status: 'online'
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
    users.delete(socket.id);
    io.emit('users-update', Array.from(users.values()));
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Local Network: http://0.0.0.0:${PORT}`);
});
