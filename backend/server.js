const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { 
  db, 
  hashPassword,
  users: userQueries, 
  groups: groupQueries, 
  messages: messageQueries, 
  logs: logQueries, 
  settings: settingQueries 
} = require('./database');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: true,
    credentials: true,
    methods: ["GET", "POST"]
  },
  maxHttpBufferSize: 50e6
});

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Store online users
const onlineUsers = new Map();
const userSockets = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // ============================================
  // AUTHENTICATION
  // ============================================
  
  socket.on('user:login', (data) => {
    console.log('📥 User login attempt:', data.username);
    try {
      const { username, password } = data;
      const hashedPassword = hashPassword(password);
      
      console.log('🔐 Login password:', password);
      console.log('🔐 Hashed login password:', hashedPassword);
      
      const user = userQueries.authenticate.get(username, hashedPassword);
      
      if (user) {
        console.log('✅ User authenticated:', user.username, '- Role:', user.role);
        userSockets.set(user.id, socket.id);
        
        onlineUsers.set(socket.id, {
          id: user.id,
          username: user.username,
          avatar: user.avatar,
          status: 'online',
          role: user.role
        });
        
        userQueries.updateLastActive.run(user.id);
        logQueries.create.run(user.id, 'login', `User ${username} logged in`);
        
        socket.emit('user:login-success', {
          id: user.id,
          username: user.username,
          avatar: user.avatar,
          role: user.role
        });
        
        io.emit('users:online', Array.from(onlineUsers.values()));
      } else {
        console.log('❌ Authentication failed for:', username);
        socket.emit('user:login-error', { message: 'Invalid username or password' });
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      socket.emit('user:login-error', { message: 'Login failed' });
    }
  });

  socket.on('admin:login', (data) => {
    console.log('📥 Admin login attempt:', data.username);
    try {
      const { username, password } = data;
      const hashedPassword = hashPassword(password);
      
      console.log('🔍 Looking for user:', username);
      const user = userQueries.authenticate.get(username, hashedPassword);
      
      if (user) {
        console.log('✅ User found:', user);
        if (user.role === 'admin') {
          console.log('✅ User is admin, logging in...');
          userSockets.set(user.id, socket.id);
          logQueries.create.run(user.id, 'admin_login', `Admin ${username} logged in`);
          
          socket.emit('admin:login-success', {
            id: user.id,
            username: user.username,
            role: user.role
          });
          console.log('✅ Admin login success emitted');
        } else {
          console.log('❌ User is not admin');
          socket.emit('admin:login-error', { message: 'Invalid admin credentials' });
        }
      } else {
        console.log('❌ User not found or wrong password');
        socket.emit('admin:login-error', { message: 'Invalid admin credentials' });
      }
    } catch (error) {
      console.error('❌ Admin login error:', error);
      socket.emit('admin:login-error', { message: 'Login failed' });
    }
  });

  // ============================================
  // ADMIN: USER MANAGEMENT
  // ============================================
  
  socket.on('admin:create-user', (data) => {
    console.log('📥 Create user request:', data.username);
    try {
      const { username, password, role } = data;
      const userId = 'user-' + Date.now();
      const hashedPassword = hashPassword(password);
      const adminUser = onlineUsers.get(socket.id);
      
      console.log('🔐 Original password:', password);
      console.log('🔐 Hashed password:', hashedPassword);
      
      const existing = userQueries.getByUsername.get(username);
      if (existing) {
        console.log('❌ Username already exists');
        socket.emit('admin:create-user-error', { message: 'Username already exists' });
        return;
      }
      
      userQueries.create.run(
        userId,
        username,
        hashedPassword,
        '',
        role || 'user',
        'active',
        adminUser?.id || 'admin'
      );
      
      console.log('✅ User created successfully');
      logQueries.create.run(adminUser?.id || 'admin', 'create_user', `Created user ${username}`);
      
      const allUsers = userQueries.getAll.all();
      io.emit('admin:users-list', allUsers);
      
      // إرسال كلمة المرور الأصلية (غير المشفرة) في رسالة النجاح
      socket.emit('admin:create-user-success', { 
        message: 'User created successfully', 
        userId, 
        username, 
        password: password // كلمة المرور الأصلية
      });
    } catch (error) {
      console.error('❌ Create user error:', error);
      socket.emit('admin:create-user-error', { message: 'Failed to create user' });
    }
  });

  socket.on('admin:get-users', () => {
    try {
      const allUsers = userQueries.getAll.all();
      socket.emit('admin:users-list', allUsers);
    } catch (error) {
      console.error('Get users error:', error);
    }
  });

  socket.on('admin:suspend-user', (data) => {
    try {
      const user = userQueries.getById.get(data.userId);
      const newStatus = user.status === 'active' ? 'suspended' : 'active';
      
      userQueries.updateStatus.run(newStatus, data.userId);
      
      const adminUser = onlineUsers.get(socket.id);
      logQueries.create.run(adminUser?.id || 'admin', 'suspend_user', `User ${data.userId} ${newStatus}`);
      
      const allUsers = userQueries.getAll.all();
      io.emit('admin:users-list', allUsers);
      
      if (newStatus === 'suspended') {
        const userSocketId = userSockets.get(data.userId);
        if (userSocketId) {
          io.to(userSocketId).emit('user-suspended');
        }
      }
    } catch (error) {
      console.error('Suspend user error:', error);
    }
  });

  socket.on('admin:delete-user', (data) => {
    try {
      userQueries.delete.run(data.userId);
      
      const adminUser = onlineUsers.get(socket.id);
      logQueries.create.run(adminUser?.id || 'admin', 'delete_user', `User ${data.userId} deleted`);
      
      const allUsers = userQueries.getAll.all();
      io.emit('admin:users-list', allUsers);
      
      const userSocketId = userSockets.get(data.userId);
      if (userSocketId) {
        io.to(userSocketId).emit('user-deleted');
      }
    } catch (error) {
      console.error('Delete user error:', error);
    }
  });

  socket.on('admin:update-password', (data) => {
    try {
      const { userId, newPassword } = data;
      const hashedPassword = hashPassword(newPassword);
      const adminUser = onlineUsers.get(socket.id);
      
      userQueries.updatePassword.run(hashedPassword, userId);
      logQueries.create.run(adminUser?.id || 'admin', 'update_password', `Updated password for user ${userId}`);
      
      socket.emit('admin:update-password-success', { message: 'Password updated successfully' });
    } catch (error) {
      console.error('Update password error:', error);
      socket.emit('admin:update-password-error', { message: 'Failed to update password' });
    }
  });

  // ============================================
  // ADMIN: GROUP MANAGEMENT
  // ============================================
  
  socket.on('admin:create-group', (data) => {
    try {
      const { name, members } = data;
      const groupId = 'group-' + Date.now();
      const adminUser = onlineUsers.get(socket.id);
      
      groupQueries.create.run(groupId, name, adminUser?.id || 'admin');
      
      if (members && members.length > 0) {
        members.forEach(memberId => {
          groupQueries.addMember.run(groupId, memberId);
        });
      }
      
      logQueries.create.run(adminUser?.id || 'admin', 'create_group', `Created group ${name}`);
      
      const allGroups = groupQueries.getAll.all();
      io.emit('admin:groups-list', allGroups);
      io.emit('groups-list', allGroups);
      
      socket.emit('admin:create-group-success', { message: 'Group created successfully' });
    } catch (error) {
      console.error('Create group error:', error);
      socket.emit('admin:create-group-error', { message: 'Failed to create group' });
    }
  });

  socket.on('admin:get-groups', () => {
    try {
      const allGroups = groupQueries.getAll.all();
      socket.emit('admin:groups-list', allGroups);
    } catch (error) {
      console.error('Get groups error:', error);
    }
  });

  socket.on('admin:suspend-group', (data) => {
    try {
      const group = groupQueries.getById.get(data.groupId);
      const newStatus = group.status === 'active' ? 'suspended' : 'active';
      
      groupQueries.updateStatus.run(newStatus, data.groupId);
      
      const adminUser = onlineUsers.get(socket.id);
      logQueries.create.run(adminUser?.id || 'admin', 'suspend_group', `Group ${data.groupId} ${newStatus}`);
      
      const allGroups = groupQueries.getAll.all();
      io.emit('admin:groups-list', allGroups);
    } catch (error) {
      console.error('Suspend group error:', error);
    }
  });

  socket.on('admin:delete-group', (data) => {
    try {
      groupQueries.delete.run(data.groupId);
      
      const adminUser = onlineUsers.get(socket.id);
      logQueries.create.run(adminUser?.id || 'admin', 'delete_group', `Group ${data.groupId} deleted`);
      
      const allGroups = groupQueries.getAll.all();
      io.emit('admin:groups-list', allGroups);
    } catch (error) {
      console.error('Delete group error:', error);
    }
  });

  socket.on('admin:add-group-member', (data) => {
    try {
      const { groupId, userId } = data;
      const adminUser = onlineUsers.get(socket.id);
      
      groupQueries.addMember.run(groupId, userId);
      logQueries.create.run(adminUser?.id || 'admin', 'add_member', `Added user ${userId} to group ${groupId}`);
      
      const members = groupQueries.getMembers.all(groupId);
      io.emit('group-members', { groupId, members });
      
      socket.emit('admin:add-member-success', { message: 'Member added successfully' });
    } catch (error) {
      console.error('Add member error:', error);
      socket.emit('admin:add-member-error', { message: 'Failed to add member' });
    }
  });

  socket.on('admin:remove-group-member', (data) => {
    try {
      const { groupId, userId } = data;
      const adminUser = onlineUsers.get(socket.id);
      
      groupQueries.removeMember.run(groupId, userId);
      logQueries.create.run(adminUser?.id || 'admin', 'remove_member', `Removed user ${userId} from group ${groupId}`);
      
      const members = groupQueries.getMembers.all(groupId);
      io.emit('group-members', { groupId, members });
      
      socket.emit('admin:remove-member-success', { message: 'Member removed successfully' });
    } catch (error) {
      console.error('Remove member error:', error);
      socket.emit('admin:remove-member-error', { message: 'Failed to remove member' });
    }
  });

  // ============================================
  // ADMIN: ACTIVITY LOGS
  // ============================================
  
  socket.on('admin:get-logs', () => {
    try {
      const logs = logQueries.getRecent.all();
      socket.emit('admin:logs-list', logs);
    } catch (error) {
      console.error('Get logs error:', error);
    }
  });

  // ============================================
  // CHAT FUNCTIONALITY
  // ============================================
  
  // Get private chats for user
  socket.on('get-private-chats', (data) => {
    try {
      const { userId } = data;
      console.log('📥 Get private chats for:', userId);
      
      const privateChats = messageQueries.getPrivateChats.all(userId, userId, userId, userId);
      
      // Get user details for each chat
      const chatsWithDetails = privateChats.map(chat => {
        const otherUser = userQueries.getById.get(chat.other_user_id);
        return {
          roomId: chat.room_id,
          userId: chat.other_user_id,
          username: otherUser?.username || 'Unknown',
          avatar: otherUser?.avatar || '',
          status: otherUser?.status || 'offline',
          lastMessageTime: chat.last_message_time
        };
      });
      
      socket.emit('private-chats-list', chatsWithDetails);
    } catch (error) {
      console.error('Get private chats error:', error);
    }
  });
  
  // Start private chat
  socket.on('start-private-chat', (data) => {
    try {
      const { userId1, userId2 } = data;
      console.log('📥 Start private chat:', userId1, '<->', userId2);
      
      // Create room ID (always sort to ensure consistency)
      const roomId = [userId1, userId2].sort().join('-');
      
      socket.emit('private-chat-started', { roomId, otherUserId: userId2 });
    } catch (error) {
      console.error('Start private chat error:', error);
    }
  });
  
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    
    try {
      const messages = messageQueries.getByRoom.all(roomId);
      socket.emit('room-messages', { roomId, messages });
    } catch (error) {
      console.error('Get room messages error:', error);
    }
  });

  socket.on('send-message', (data) => {
    console.log('📥 Send message:', data);
    try {
      const user = onlineUsers.get(socket.id);
      
      // Determine room type
      const roomType = data.roomType || (data.roomId.includes('-') ? 'private' : 'group');
      
      const result = messageQueries.create.run(
        user?.id || socket.id,
        user?.username || 'Unknown',
        data.roomId,
        roomType,
        data.content,
        data.type || 'text',
        null,
        null,
        null,
        null
      );

      const message = {
        id: result.lastInsertRowid,
        senderId: user?.id || socket.id,
        senderName: user?.username || 'Unknown',
        content: data.content,
        type: data.type || 'text',
        roomType: roomType,
        timestamp: new Date().toISOString(),
        roomId: data.roomId
      };
      
      console.log('✅ Message sent to room:', data.roomId, '- Type:', roomType);
      io.to(data.roomId).emit('receive-message', message);
      
      logQueries.create.run(user?.id || socket.id, 'send_message', `Sent message to ${data.roomId}`);
    } catch (error) {
      console.error('Send message error:', error);
    }
  });

  socket.on('send-file', (data) => {
    console.log('📥 Send file:', data.fileName);
    try {
      const user = onlineUsers.get(socket.id);
      
      // Determine room type
      const roomType = data.roomType || (data.roomId.includes('-') ? 'private' : 'group');
      
      const result = messageQueries.create.run(
        user?.id || socket.id,
        user?.username || 'Unknown',
        data.roomId,
        roomType,
        '',
        'file',
        data.fileName,
        data.fileSize,
        data.fileData,
        null
      );

      const fileMessage = {
        id: result.lastInsertRowid,
        senderId: user?.id || socket.id,
        senderName: user?.username || 'Unknown',
        type: 'file',
        fileName: data.fileName,
        fileSize: data.fileSize,
        fileData: data.fileData,
        roomType: roomType,
        timestamp: new Date().toISOString(),
        roomId: data.roomId
      };
      
      console.log('✅ File sent to room:', data.roomId, '- Type:', roomType);
      io.to(data.roomId).emit('receive-message', fileMessage);
      
      logQueries.create.run(user?.id || socket.id, 'send_file', `Sent file ${data.fileName}`);
    } catch (error) {
      console.error('Send file error:', error);
    }
  });

  socket.on('typing', (data) => {
    socket.to(data.roomId).emit('user-typing', {
      userId: socket.id,
      username: onlineUsers.get(socket.id)?.username,
      isTyping: data.isTyping
    });
  });

  socket.on('get-groups', () => {
    try {
      const groups = groupQueries.getAll.all();
      socket.emit('groups-list', groups);
    } catch (error) {
      console.error('Get groups error:', error);
    }
  });

  socket.on('get-group-members', (data) => {
    try {
      const members = groupQueries.getMembers.all(data.groupId);
      socket.emit('group-members', { groupId: data.groupId, members });
    } catch (error) {
      console.error('Get group members error:', error);
    }
  });

  socket.on('disconnect', () => {
    try {
      const user = onlineUsers.get(socket.id);
      
      if (user) {
        userQueries.updateStatus.run('offline', user.id);
        onlineUsers.delete(socket.id);
        userSockets.delete(user.id);
        
        logQueries.create.run(user.id, 'disconnect', 'User disconnected');
        io.emit('users:online', Array.from(onlineUsers.values()));
      }
      
      console.log('User disconnected:', socket.id);
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Local Network: http://0.0.0.0:${PORT}`);
  console.log(`🔐 Default Admin: username=admin, password=admin123`);
});
