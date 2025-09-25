const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');

class GoogleAuthService {
    constructor() {
        this.client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
        this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
        this.jwtExpiry = process.env.JWT_EXPIRY || '7d';
    }

    /**
     * Verify Google ID token and extract user info
     * @param {string} idToken - Google ID token from frontend
     * @returns {Object} User information from Google
     */
    async verifyGoogleToken(idToken) {
        try {
            const ticket = await this.client.verifyIdToken({
                idToken: idToken,
                audience: process.env.GOOGLE_CLIENT_ID,
            });

            const payload = ticket.getPayload();
            
            return {
                googleId: payload.sub,
                email: payload.email,
                name: payload.name,
                picture: payload.picture,
                emailVerified: payload.email_verified,
                givenName: payload.given_name,
                familyName: payload.family_name
            };
        } catch (error) {
            throw new Error('Invalid Google token');
        }
    }

    /**
     * Generate JWT token for authenticated user
     * @param {Object} user - User object from database
     * @returns {string} JWT token
     */
    generateJWTToken(user) {
        const payload = {
            userId: user._id,
            googleId: user.googleId,
            email: user.email,
            username: user.username
        };

        return jwt.sign(payload, this.jwtSecret, { 
            expiresIn: this.jwtExpiry,
            issuer: 'hooksdream-app'
        });
    }

    /**
     * Verify JWT token and extract user info
     * @param {string} token - JWT token
     * @returns {Object} Decoded token payload
     */
    verifyJWTToken(token) {
        try {
            return jwt.verify(token, this.jwtSecret);
        } catch (error) {
            throw new Error('Invalid or expired token');
        }
    }

    /**
     * Extract token from Authorization header
     * @param {string} authHeader - Authorization header value
     * @returns {string|null} Token or null if not found
     */
    extractTokenFromHeader(authHeader) {
        if (!authHeader) return null;
        
        if (authHeader.startsWith('Bearer ')) {
            return authHeader.substring(7);
        }
        
        return authHeader;
    }

    /**
     * Generate refresh token (optional for future use)
     * @param {Object} user - User object
     * @returns {string} Refresh token
     */
    generateRefreshToken(user) {
        const payload = {
            userId: user._id,
            type: 'refresh'
        };

        return jwt.sign(payload, this.jwtSecret, { 
            expiresIn: '30d',
            issuer: 'hooksdream-app'
        });
    }
}

module.exports = new GoogleAuthService();
