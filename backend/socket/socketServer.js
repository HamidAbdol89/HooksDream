// socket/socketServer.js - Real-time Socket.IO Server
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

class SocketServer {
    constructor(server) {
        this.io = new Server(server, {
            cors: {
                origin: process.env.FRONTEND_URL || "http://localhost:5173",
                methods: ["GET", "POST"],
                credentials: true
            },
            transports: ['websocket', 'polling'],
            // Fly.io optimizations
            pingTimeout: 60000,
            pingInterval: 25000,
            upgradeTimeout: 30000,
            maxHttpBufferSize: 1e6, // 1MB
            allowEIO3: true,
            // Connection state recovery for better reliability
            connectionStateRecovery: {
                maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
                skipMiddlewares: true,
            }
        });

        this.connectedUsers = new Map(); // userId -> socketId
        this.userRooms = new Map(); // userId -> Set of rooms
        
        this.setupMiddleware();
        this.setupEventHandlers();
        
        }

    setupMiddleware() {
        // Authentication middleware
        this.io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
                
                if (!token) {
                    return next(new Error('Authentication error: No token provided'));
                }

                // Verify JWT token
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
                socket.userId = decoded.userId;
                socket.user = decoded;
                
                next();
            } catch (error) {
                next(new Error('Authentication error: Invalid token'));
            }
        });
    }

    setupEventHandlers() {
        this.io.on('connection', (socket) => {
            // Store user connection
            this.connectedUsers.set(socket.userId, socket.id);
            this.userRooms.set(socket.userId, new Set());

            // Join user to their personal room
            socket.join(`user:${socket.userId}`);
            
            // Update user online status in database
            this.updateUserOnlineStatus(socket.userId, true);
            
            // Broadcast user online status to all conversations
            this.broadcastUserStatus(socket.userId, 'online');
            
            // Handle joining post rooms for real-time updates
            socket.on('join:post', (postId) => {
                const roomName = `post:${postId}`;
                socket.join(roomName);
                this.userRooms.get(socket.userId).add(roomName);
                });

            // Handle leaving post rooms
            socket.on('leave:post', (postId) => {
                const roomName = `post:${postId}`;
                socket.leave(roomName);
                this.userRooms.get(socket.userId).delete(roomName);
                });

            // Handle joining feed room for real-time feed updates
            socket.on('join:feed', () => {
                socket.join('feed:global');
                this.userRooms.get(socket.userId).add('feed:global');
                });

            // Handle leaving feed room
            socket.on('leave:feed', () => {
                socket.leave('feed:global');
                this.userRooms.get(socket.userId).delete('feed:global');
                });

            // Handle user following for personalized feed
            socket.on('join:user:feed', (followedUserId) => {
                const roomName = `user:${followedUserId}:posts`;
                socket.join(roomName);
                this.userRooms.get(socket.userId).add(roomName);
                });

            // Handle comment like events
            socket.on('comment:like', (data) => {
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
                socket.to(`post:${data.postId}`).emit('comment:created', {
                    comment: data.comment,
                    postId: data.postId,
                    userId: socket.userId,
                    timestamp: new Date().toISOString()
                });
            });

            // Handle comment delete events
            socket.on('comment:delete', (data) => {
                socket.to(`post:${data.postId}`).emit('comment:deleted', {
                    commentId: data.commentId,
                    postId: data.postId,
                    userId: socket.userId,
                    timestamp: new Date().toISOString()
                });
            });

            // Handle comment edit events
            socket.on('comment:edit', (data) => {
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
                // Broadcast user activity to followers
                socket.to(`user:${socket.userId}:activity`).emit('user:activity:update', {
                    userId: socket.userId,
                    activity: data.activity, // 'online', 'typing', 'viewing', etc.
                    timestamp: new Date().toISOString()
                });
            });

            // Handle follow/unfollow events
            socket.on('user:follow', (data) => {
                // ✅ Broadcast to ALL users, not just target user
                const followData = {
                    followerId: socket.userId,
                    targetUserId: data.targetUserId,
                    followingId: data.targetUserId, // ✅ Add for compatibility
                    isFollowing: data.isFollowing,
                    followerCount: data.followerCount,
                    type: data.isFollowing ? 'follow' : 'unfollow',
                    timestamp: new Date().toISOString()
                };

                // Broadcast to target user
                socket.to(`user:${data.targetUserId}`).emit('user:follow:update', followData);
                
                // ✅ Broadcast to ALL connected users for real-time updates
                socket.broadcast.emit('user:follow:update', followData);
                
                // ✅ Also emit to current user for consistency
                socket.emit('user:follow:update', followData);
            });

            // Handle typing indicators for comments
            socket.on('comment:typing', (data) => {
                socket.to(`post:${data.postId}`).emit('comment:typing:update', {
                    postId: data.postId,
                    userId: socket.userId,
                    isTyping: data.isTyping,
                    timestamp: new Date().toISOString()
                });
            });

            // ===== CHAT EVENTS =====
            
            // Join conversation room
            socket.on('chat:join', (conversationId) => {
                const roomName = `conversation:${conversationId}`;
                socket.join(roomName);
                this.userRooms.get(socket.userId).add(roomName);
                
                // Notify others in conversation that user joined
                socket.to(roomName).emit('chat:user:joined', {
                    userId: socket.userId,
                    conversationId,
                    timestamp: new Date().toISOString()
                });
            });

            // Leave conversation room
            socket.on('chat:leave', (conversationId) => {
                const roomName = `conversation:${conversationId}`;
                socket.leave(roomName);
                this.userRooms.get(socket.userId).delete(roomName);
                
                // Notify others in conversation that user left
                socket.to(roomName).emit('chat:user:left', {
                    userId: socket.userId,
                    conversationId,
                    timestamp: new Date().toISOString()
                });
            });

            // Handle typing indicators for chat
            socket.on('chat:typing', (data) => {
                socket.to(`conversation:${data.conversationId}`).emit('chat:typing:update', {
                    conversationId: data.conversationId,
                    userId: socket.userId,
                    isTyping: data.isTyping,
                    timestamp: new Date().toISOString()
                });
            });

            // Handle message delivery confirmation
            socket.on('chat:message:delivered', (data) => {
                socket.to(`conversation:${data.conversationId}`).emit('chat:message:status', {
                    messageId: data.messageId,
                    conversationId: data.conversationId,
                    status: 'delivered',
                    userId: socket.userId,
                    timestamp: new Date().toISOString()
                });
            });

            // Handle message read confirmation
            socket.on('chat:message:read', (data) => {
                socket.to(`conversation:${data.conversationId}`).emit('chat:message:status', {
                    messageId: data.messageId,
                    conversationId: data.conversationId,
                    status: 'read',
                    userId: socket.userId,
                    timestamp: new Date().toISOString()
                });
            });

            // Handle user online status for chat
            socket.on('chat:status:online', () => {
                // Broadcast online status to all conversations user is part of
                const userRooms = this.userRooms.get(socket.userId) || new Set();
                userRooms.forEach(room => {
                    if (room.startsWith('conversation:')) {
                        socket.to(room).emit('chat:user:status', {
                            userId: socket.userId,
                            status: 'online',
                            timestamp: new Date().toISOString()
                        });
                    }
                });
            });

            // Handle disconnect
            socket.on('disconnect', (reason) => {
                // Update user offline status in database
                this.updateUserOnlineStatus(socket.userId, false);
                
                // Broadcast user offline status before cleanup
                this.broadcastUserStatus(socket.userId, 'offline');
                
                // Clean up user data
                this.connectedUsers.delete(socket.userId);
                this.userRooms.delete(socket.userId);
            });

            // Handle connection errors
            socket.on('error', (error) => {
                // Handle socket errors silently
                });
        });
    }

    // Utility methods for emitting events from controllers
    emitToPost(postId, event, data) {
        this.io.to(`post:${postId}`).emit(event, data);
        }

    emitToUser(userId, event, data) {
        this.io.to(`user:${userId}`).emit(event, data);
        }

    emitToAll(event, data) {
        this.io.emit(event, data);
        }

    // Get connected users count
    getConnectedUsersCount() {
        return this.connectedUsers.size;
    }

    // Check if user is online
    isUserOnline(userId) {
        return this.connectedUsers.has(userId);
    }

    // Chat-specific utility methods
    emitToConversation(conversationId, event, data) {
        this.io.to(`conversation:${conversationId}`).emit(event, data);
    }

    // Get users in conversation
    getUsersInConversation(conversationId) {
        const room = this.io.sockets.adapter.rooms.get(`conversation:${conversationId}`);
        return room ? Array.from(room) : [];
    }

    // Update user online status in database
    async updateUserOnlineStatus(userId, isOnline) {
        try {
            const updateData = {
                isOnline,
                lastSeen: isOnline ? undefined : new Date()
            };
            
            await User.findByIdAndUpdate(userId, updateData);
        } catch (error) {
            console.error('Error updating user online status:', error);
        }
    }
    
    // Broadcast user status to conversations
    broadcastUserStatus(userId, status) {
        const userRooms = this.userRooms.get(userId) || new Set();
        
        // Broadcast to all connected users
        this.io.emit('chat:user:status', {
            userId,
            status,
            timestamp: new Date().toISOString()
        });
        
        // Also broadcast to specific conversation rooms
        userRooms.forEach(room => {
            if (room.startsWith('conversation:')) {
                this.io.to(room).emit('chat:user:status', {
                    userId,
                    status,
                    timestamp: new Date().toISOString()
                });
            }
        });
    }
}

module.exports = SocketServer;
