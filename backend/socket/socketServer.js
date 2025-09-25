// socket/socketServer.js - Real-time Socket.IO Server
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

class SocketServer {
    constructor(server) {
        this.io = new Server(server, {
            cors: {
                origin: process.env.FRONTEND_URL || "http://localhost:5173",
                methods: ["GET", "POST"],
                credentials: true
            },
            transports: ['websocket', 'polling']
        });

        this.connectedUsers = new Map(); // userId -> socketId
        this.userRooms = new Map(); // userId -> Set of rooms
        
        this.setupMiddleware();
        this.setupEventHandlers();
        
        console.log('🔌 Socket.IO Server initialized');
    }

    setupMiddleware() {
        // Authentication middleware
        this.io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
                
                if (!token) {
                    console.log('❌ Socket connection rejected: No token');
                    return next(new Error('Authentication error: No token provided'));
                }

                // Verify JWT token
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
                socket.userId = decoded.userId;
                socket.user = decoded;
                
                console.log('✅ Socket authenticated:', { userId: socket.userId, socketId: socket.id });
                next();
            } catch (error) {
                console.log('❌ Socket authentication failed:', error.message);
                next(new Error('Authentication error: Invalid token'));
            }
        });
    }

    setupEventHandlers() {
        this.io.on('connection', (socket) => {
            console.log(`🔗 User connected: ${socket.userId} (${socket.id})`);
            
            // Store user connection
            this.connectedUsers.set(socket.userId, socket.id);
            this.userRooms.set(socket.userId, new Set());

            // Join user to their personal room
            socket.join(`user:${socket.userId}`);
            
            // Handle joining post rooms for real-time updates
            socket.on('join:post', (postId) => {
                const roomName = `post:${postId}`;
                socket.join(roomName);
                this.userRooms.get(socket.userId).add(roomName);
                console.log(`📍 User ${socket.userId} joined post room: ${postId}`);
            });

            // Handle leaving post rooms
            socket.on('leave:post', (postId) => {
                const roomName = `post:${postId}`;
                socket.leave(roomName);
                this.userRooms.get(socket.userId).delete(roomName);
                console.log(`🚪 User ${socket.userId} left post room: ${postId}`);
            });

            // Handle joining feed room for real-time feed updates
            socket.on('join:feed', () => {
                socket.join('feed:global');
                this.userRooms.get(socket.userId).add('feed:global');
                console.log(`📰 User ${socket.userId} joined global feed`);
            });

            // Handle leaving feed room
            socket.on('leave:feed', () => {
                socket.leave('feed:global');
                this.userRooms.get(socket.userId).delete('feed:global');
                console.log(`📰 User ${socket.userId} left global feed`);
            });

            // Handle user following for personalized feed
            socket.on('join:user:feed', (followedUserId) => {
                const roomName = `user:${followedUserId}:posts`;
                socket.join(roomName);
                this.userRooms.get(socket.userId).add(roomName);
                console.log(`👥 User ${socket.userId} joined ${followedUserId}'s posts room`);
            });

            // Handle comment like events
            socket.on('comment:like', (data) => {
                console.log('💖 Comment like event:', data);
                // Broadcast to all users in the post room
                socket.to(`post:${data.postId}`).emit('comment:liked', {
                    commentId: data.commentId,
                    postId: data.postId,
                    userId: socket.userId,
                    isLiked: data.isLiked,
                    likeCount: data.likeCount,
                    timestamp: new Date().toISOString()
                });
            });

            // Handle new comment events
            socket.on('comment:create', (data) => {
                console.log('💬 New comment event:', data);
                socket.to(`post:${data.postId}`).emit('comment:created', {
                    comment: data.comment,
                    postId: data.postId,
                    userId: socket.userId,
                    timestamp: new Date().toISOString()
                });
            });

            // Handle comment delete events
            socket.on('comment:delete', (data) => {
                console.log('🗑️ Comment delete event:', data);
                socket.to(`post:${data.postId}`).emit('comment:deleted', {
                    commentId: data.commentId,
                    postId: data.postId,
                    userId: socket.userId,
                    timestamp: new Date().toISOString()
                });
            });

            // Handle comment edit events
            socket.on('comment:edit', (data) => {
                console.log('✏️ Comment edit event:', data);
                socket.to(`post:${data.postId}`).emit('comment:edited', {
                    commentId: data.commentId,
                    postId: data.postId,
                    content: data.content,
                    userId: socket.userId,
                    timestamp: new Date().toISOString()
                });
            });

            // Handle reply events
            socket.on('reply:create', (data) => {
                console.log('💬 New reply event:', data);
                socket.to(`post:${data.postId}`).emit('reply:created', {
                    reply: data.reply,
                    parentCommentId: data.parentCommentId,
                    postId: data.postId,
                    userId: socket.userId,
                    timestamp: new Date().toISOString()
                });
            });

            // Handle post like events
            socket.on('post:like', (data) => {
                console.log('❤️ Post like event:', data);
                // Broadcast to all users in the post room and feed
                const likeData = {
                    postId: data.postId,
                    userId: socket.userId,
                    isLiked: data.isLiked,
                    likeCount: data.likeCount,
                    timestamp: new Date().toISOString()
                };
                socket.to(`post:${data.postId}`).emit('post:liked', likeData);
                socket.to('feed:global').emit('post:liked', likeData);
            });

            // Handle new post events
            socket.on('post:create', (data) => {
                console.log('📝 New post event:', data);
                // Broadcast to global feed and user's followers
                const postData = {
                    post: data.post,
                    userId: socket.userId,
                    timestamp: new Date().toISOString()
                };
                socket.to('feed:global').emit('post:created', postData);
                socket.to(`user:${socket.userId}:posts`).emit('post:created', postData);
            });

            // Handle post delete events
            socket.on('post:delete', (data) => {
                console.log('🗑️ Post delete event:', data);
                const deleteData = {
                    postId: data.postId,
                    userId: socket.userId,
                    timestamp: new Date().toISOString()
                };
                socket.to(`post:${data.postId}`).emit('post:deleted', deleteData);
                socket.to('feed:global').emit('post:deleted', deleteData);
                socket.to(`user:${socket.userId}:posts`).emit('post:deleted', deleteData);
            });

            // Handle post share events
            socket.on('post:share', (data) => {
                console.log('🔄 Post share event:', data);
                const shareData = {
                    postId: data.postId,
                    userId: socket.userId,
                    shareCount: data.shareCount,
                    timestamp: new Date().toISOString()
                };
                socket.to(`post:${data.postId}`).emit('post:shared', shareData);
                socket.to('feed:global').emit('post:shared', shareData);
            });

            // Handle user activity status
            socket.on('user:activity', (data) => {
                console.log('👤 User activity:', data);
                // Broadcast user activity to followers
                socket.to(`user:${socket.userId}:activity`).emit('user:activity:update', {
                    userId: socket.userId,
                    activity: data.activity, // 'online', 'typing', 'viewing', etc.
                    timestamp: new Date().toISOString()
                });
            });

            // Handle follow/unfollow events
            socket.on('user:follow', (data) => {
                console.log('👥 Follow event:', data);
                // Broadcast follow event to target user and followers
                socket.to(`user:${data.targetUserId}`).emit('user:follow:update', {
                    followerId: socket.userId,
                    targetUserId: data.targetUserId,
                    isFollowing: data.isFollowing,
                    followerCount: data.followerCount,
                    timestamp: new Date().toISOString()
                });
            });

            // Handle typing indicators for comments
            socket.on('comment:typing', (data) => {
                console.log('⌨️ User typing in comments:', data);
                socket.to(`post:${data.postId}`).emit('comment:typing:update', {
                    postId: data.postId,
                    userId: socket.userId,
                    isTyping: data.isTyping,
                    timestamp: new Date().toISOString()
                });
            });

            // Handle disconnect
            socket.on('disconnect', (reason) => {
                console.log(`🔌 User disconnected: ${socket.userId} (${socket.id}) - Reason: ${reason}`);
                
                // Clean up user data
                this.connectedUsers.delete(socket.userId);
                this.userRooms.delete(socket.userId);
            });

            // Handle connection errors
            socket.on('error', (error) => {
                console.error('❌ Socket error:', error);
            });
        });
    }

    // Utility methods for emitting events from controllers
    emitToPost(postId, event, data) {
        this.io.to(`post:${postId}`).emit(event, data);
        console.log(`📡 Emitted ${event} to post:${postId}`, data);
    }

    emitToUser(userId, event, data) {
        this.io.to(`user:${userId}`).emit(event, data);
        console.log(`📡 Emitted ${event} to user:${userId}`, data);
    }

    emitToAll(event, data) {
        this.io.emit(event, data);
        console.log(`📡 Emitted ${event} to all users`, data);
    }

    // Get connected users count
    getConnectedUsersCount() {
        return this.connectedUsers.size;
    }

    // Check if user is online
    isUserOnline(userId) {
        return this.connectedUsers.has(userId);
    }
}

module.exports = SocketServer;
