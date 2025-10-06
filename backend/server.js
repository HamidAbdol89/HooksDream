const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cloudinary = require('cloudinary').v2;
const http = require('http');
const SocketServer = require('./socket/socketServer');
require('dotenv').config();

// Validate critical environment variables
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingEnvVars.forEach(envVar => {
    console.error(`   - ${envVar}`);
  });
  console.error('🔧 Please set these variables in Railway environment settings');
  process.exit(1);
}

const app = express();
const server = http.createServer(app);

// Trust proxy for Railway deployment (fixes rate limiting issues)
app.set('trust proxy', 1);

// Cloudinary Config - Tự động đọc từ CLOUDINARY_URL trong .env
cloudinary.config();

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://hooksdream.vercel.app',
      'https://hooksdream.netlify.app',
      'https://just-solace-production.up.railway.app',
      'https://bot-hooksdream-production.up.railway.app'
    ];
    
    const allowedPatterns = [
      /^https:\/\/.*\.vercel\.app$/,
      /^https:\/\/.*\.netlify\.app$/,
      /^https:\/\/.*\.fly\.dev$/,
      /^https:\/\/.*\.railway\.app$/
    ];
    
    // Check exact matches
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Check pattern matches
    if (allowedPatterns.some(pattern => pattern.test(origin))) {
      return callback(null, true);
    }
    
    console.log('❌ CORS blocked origin:', origin);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Tăng giới hạn kích thước request cho upload file lớn
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Kết nối MongoDB với better error handling
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is not set!');
  console.error('🔧 Please set MONGODB_URI in Railway environment variables');
  process.exit(1);
}

console.log('🔗 Connecting to MongoDB...');
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    
    // ⚡ Start server ONLY after DB connection
    startServer();
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    console.error('🔧 Check your MONGODB_URI in Railway environment variables');
    process.exit(1);
  });

// CORS test endpoint
app.get('/api/cors-test', (req, res) => {
  res.json({
    success: true,
    message: 'CORS is working!',
    origin: req.headers.origin,
    timestamp: new Date().toISOString()
  });
});

// JWT debug endpoint
app.get('/api/jwt-debug', (req, res) => {
  const authHeader = req.header('Authorization');
  const hasJwtSecret = !!process.env.JWT_SECRET;
  const jwtSecretLength = process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0;
  
  res.json({
    success: true,
    hasAuthHeader: !!authHeader,
    authHeaderPreview: authHeader ? authHeader.substring(0, 20) + '...' : null,
    hasJwtSecret,
    jwtSecretLength,
    timestamp: new Date().toISOString()
  });
});

// Enhanced health check for Railway
app.get('/api/health', (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    cloudinary: cloudinary.config().cloud_name ? 'configured' : 'not configured',
    socketConnections: global.socketServer ? global.socketServer.getConnectedUsersCount() : 0,
    platform: 'railway',
    region: process.env.RAILWAY_REGION || process.env.FLY_REGION || 'unknown'
  };
  
  // Return 503 if critical services are down
  if (health.db !== 'connected') {
  }
  
  res.json(health);
});

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const postRoutes = require('./routes/posts');
const commentRoutes = require('./routes/comments');
const followRoutes = require('./routes/follow');
const notificationRoutes = require('./routes/notifications');
const chatRoutes = require('./routes/chat');
const searchRoutes = require('./routes/search');
const storyRoutes = require('./routes/storyRoutes');
const friendDiscoveryRoutes = require('./routes/friendDiscovery');
const botRoutes = require('./routes/botRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/follow', followRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/discovery', friendDiscoveryRoutes);
app.use('/api/bot', botRoutes);
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

// Initialize notification system in controllers
const likeController = require('./controllers/likeController');
const followController = require('./controllers/followController');
const commentController = require('./controllers/commentController');
const postController = require('./controllers/postController');
const notificationController = require('./controllers/notificationController');
const storyController = require('./controllers/storyController');
const botController = require('./controllers/botController');

likeController.setSocketServer(socketServer);
followController.setSocketServer(socketServer);
commentController.setSocketServer(socketServer);
postController.setSocketServer(socketServer);
notificationController.setSocketServer(socketServer);
storyController.setSocketServer(socketServer);
botController.setSocketServer(socketServer);

// Khởi động server
const PORT = process.env.PORT || (process.env.NODE_ENV === 'development' ? 5000 : 8080);
const HOST = process.env.HOST || '0.0.0.0';

// ⚡ Start server function - called after DB connection
function startServer() {
  server.listen(PORT, HOST, () => {
    console.log(`🚀 Server running on ${HOST}:${PORT}`);
    console.log(`📡 Socket.IO ready for connections`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🗄️  Database: Connected ✅`); // ⚡ Always connected when this runs
    
    // Start story archive service
    const storyArchiveService = require('./services/storyArchiveService');
    storyArchiveService.start();
  });
}

// Error handling
server.on('error', (error) => {
  console.error('❌ Server error:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    mongoose.connection.close().then(() => {
      console.log('✅ Database connection closed');
      process.exit(0);
    }).catch((err) => {
      console.error('❌ Error closing database:', err);
      process.exit(1);
    });
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    mongoose.connection.close().then(() => {
      console.log('✅ Database connection closed');
      process.exit(0);
    }).catch((err) => {
      console.error('❌ Error closing database:', err);
      process.exit(1);
    });
  });
});