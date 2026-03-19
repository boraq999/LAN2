# 🚀 LAN Chat - Local Network Messenger

A modern, real-time chat application for local networks with support for text messages, code sharing, and file transfers. Built with professional UI/UX standards inspired by Apple HIG and Material Design 3.

## ✨ Features

### Core Functionality
- 🌐 **Local Network Communication**: Automatic peer discovery on LAN
- 💬 **Real-time Messaging**: Instant message delivery using WebSocket
- 📁 **File Sharing**: Send and receive files up to 50MB
- 💻 **Code Sharing**: Syntax-highlighted code blocks with language detection
- 👥 **Group Chats**: Create and manage group conversations
- 🟢 **Online Status**: Real-time presence indicators

### UI/UX Features
- 🎨 **Glassmorphism Design**: Modern frosted glass effects
- 🌙 **Dark Theme**: Eye-friendly dark interface
- 📱 **Responsive Layout**: Mobile-first design approach
- ⚡ **Smooth Animations**: Fluid transitions and interactions
- 🎯 **Visual Hierarchy**: Clear information architecture
- ♿ **Accessibility**: WCAG compliant components

## 🛠️ Tech Stack

### Frontend
- **React 18** + **TypeScript**: Type-safe component architecture
- **Tailwind CSS**: Utility-first styling with custom design system
- **Socket.io Client**: Real-time WebSocket communication
- **Lucide React**: Modern icon library
- **React Syntax Highlighter**: Code block rendering with Prism

### Backend
- **Node.js** + **Express**: Server framework
- **Socket.io**: WebSocket server for real-time events
- **Multer**: File upload handling
- **CORS**: Cross-origin resource sharing

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm/yarn
- Network access (same LAN for all users)

### Step 1: Install Backend Dependencies
```bash
cd backend
npm install
```

### Step 2: Install Frontend Dependencies
```bash
cd frontend
npm install
```

## 🚀 Running the Application

### Start Backend Server
```bash
cd backend
npm start
```
Server will run on `http://0.0.0.0:3001`

### Start Frontend Development Server
```bash
cd frontend
npm run dev
```
Frontend will run on `http://localhost:5173`

### Access from Other Devices on LAN
1. Find your computer's local IP address:
   - Windows: `ipconfig` (look for IPv4 Address)
   - Mac/Linux: `ifconfig` or `ip addr`
2. On other devices, navigate to: `http://YOUR_IP:5173`
3. Backend should be accessible at: `http://YOUR_IP:3001`

## 🎨 Design System

### Color Palette
```css
Primary (Accent):    #5b68f5 (Blue/Purple)
Background:          #1a1d29 (Dark Navy)
Cards/Panels:        #252836 (Lighter Navy)
Success (Online):    #4ade80 (Green)
Text Primary:        #e5e7eb (Light Gray)
Text Secondary:      #9ca3af (Medium Gray)
```

### Typography
- **Font Family**: Inter, SF Pro Display, system-ui
- **Heading 1**: 24px / 600 weight
- **Body**: 14px / 400 weight
- **Code**: Fira Code, monospace

### Spacing System
- xs: 4px | sm: 8px | md: 16px | lg: 24px | xl: 32px
- Border Radius: 12px (cards), 8px (buttons), 20px (pills)

## 📱 Usage Guide

### First Time Setup
1. Open the application in your browser
2. Enter your name in the welcome modal
3. Click "Join Network" to connect

### Sending Messages
- Type in the input field at the bottom
- Press Enter or click Send button
- Shift+Enter for new line

### Sharing Code
1. Click the `{}` button to enable Code Mode
2. Paste or type your code
3. Language will be auto-detected
4. Send with syntax highlighting

### Sending Files
1. Click the paperclip icon
2. Select a file (max 50MB)
3. File will be sent with preview

### Creating Group Chats
- Groups are automatically created
- "Team Apollo" is the default group for all users

## 🔧 Configuration

### Backend Port (server.js)
```javascript
const PORT = process.env.PORT || 3001;
```

### Frontend Socket URL (App.tsx)
```typescript
const SOCKET_URL = 'http://localhost:3001';
```
Change to your server IP for LAN access: `http://YOUR_IP:3001`

### File Upload Limit (server.js)
```javascript
maxHttpBufferSize: 50e6 // 50MB
```

## 🏗️ Project Structure

```
lan-chat-app/
├── backend/
│   ├── server.js           # Socket.io server
│   ├── package.json
│   └── uploads/            # File storage
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.tsx      # Chat list
│   │   │   ├── ChatArea.tsx     # Main chat
│   │   │   ├── InfoPanel.tsx    # Group info
│   │   │   └── LoginModal.tsx   # User login
│   │   ├── App.tsx              # Main app
│   │   └── index.css            # Global styles
│   ├── package.json
│   └── tailwind.config.js
└── README.md
```

## 🎯 UX Principles Applied

1. **User Flow Optimization**: Minimal steps from login to messaging
2. **Visual Hierarchy**: Clear distinction between UI elements
3. **Feedback**: Real-time typing indicators and message status
4. **Consistency**: Unified design language across components
5. **Accessibility**: Keyboard navigation and ARIA labels
6. **Performance**: Optimized rendering and lazy loading

## 🔐 Security Notes

- This is a LOCAL NETWORK application
- No encryption by default (add TLS for production)
- Files are stored on the server temporarily
- No authentication system (add for production use)

## 🚧 Future Enhancements

- [ ] End-to-end encryption
- [ ] Voice/Video calls
- [ ] Screen sharing
- [ ] Message reactions
- [ ] Search functionality
- [ ] Message editing/deletion
- [ ] User profiles with avatars
- [ ] Custom themes
- [ ] Desktop notifications
- [ ] Electron wrapper for desktop app

## 📄 License

MIT License - Feel free to use and modify

## 🤝 Contributing

This is a demonstration project. Feel free to fork and enhance!

---

**Built with ❤️ following Apple HIG and Material Design 3 principles**
