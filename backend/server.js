const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cloudinary = require('cloudinary').v2;
const http = require('http');
const SocketServer = require('./socket/socketServer');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Cloudinary Config - Tự động đọc từ CLOUDINARY_URL trong .env
cloudinary.config();

// Middleware
app.use(cors({
origin: [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://hooksdream.vercel.app',
],

  credentials: true
}));

// Tăng giới hạn kích thước request cho upload file lớn
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Kết nối MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    // Database connected successfully
  })
  .catch(err => {
    process.exit(1);
  });

// Route kiểm tra hệ thống
app.get('/api/health', (req, res) => {
  res.json({
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    cloudinary: cloudinary.config().cloud_name ? 'configured' : 'not configured'
  });
});

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const postRoutes = require('./routes/posts');
const commentRoutes = require('./routes/comments');
const searchRoutes = require('./routes/search');
const chatRoutes = require('./routes/chat');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/chat', chatRoutes);
// Xử lý lỗi
app.use((err, req, res, next) => {
  res.status(500).json({ message: 'Something went wrong!' });
});

// Xử lý 404
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Initialize Socket.IO
const socketServer = new SocketServer(server);

// Make socket server available globally for controllers
global.socketServer = socketServer;

// Khởi động server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  });