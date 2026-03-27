const jwt = require('jsonwebtoken');
const { ACCESS_TOKEN_SECRET } = require('../controllers/authController');
const { User } = require('../database');

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; 

    if (!token) return res.status(401).json({ error: 'Unauthorized: No token provided' });

    jwt.verify(token, ACCESS_TOKEN_SECRET, async (err, decoded) => {
        if (err) return res.status(403).json({ error: 'Forbidden: Invalid token' });

        try {
            const user = await User.findByPk(decoded.id);
            if (!user) return res.status(403).json({ error: 'User not found' });
            
            if (user.lastSessionId !== decoded.sessionId) {
                return res.status(403).json({ error: 'Session invalid (Logged in elsewhere)' });
            }

            req.user = user;
            next();
        } catch (dbErr) {
            return res.status(500).json({ error: 'Auth DB Error' });
        }
    });
};

const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
        }
        next();
    };
};

module.exports = { authenticateToken, authorizeRoles };
