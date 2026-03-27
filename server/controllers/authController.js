const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../database');
const { v4: uuidv4 } = require('uuid');

const ACCESS_TOKEN_SECRET = 'super_secret_access_key_CHANGE_ME';
const REFRESH_TOKEN_SECRET = 'super_secret_refresh_key_CHANGE_ME_TOO';
const ACCESS_TOKEN_LIFE = '15m'; 
const REFRESH_TOKEN_LIFE = '7d';

const generateAccessToken = (user) => {
    return jwt.sign(
        { id: user.id, role: user.role, sessionId: user.lastSessionId }, 
        ACCESS_TOKEN_SECRET, 
        { expiresIn: ACCESS_TOKEN_LIFE }
    );
};

const generateRefreshToken = (user) => {
    return jwt.sign(
        { id: user.id, sessionId: user.lastSessionId }, 
        REFRESH_TOKEN_SECRET, 
        { expiresIn: REFRESH_TOKEN_LIFE }
    );
};

exports.register = async (req, res) => {
    try {
        const { email, password, firstName, lastName, role, gender, dateOfBirth } = req.body;
        
        if (!email || !password) return res.status(400).json({ error: 'Email i hasło są wymagane' });
        
        if (new Date(dateOfBirth) > new Date()) {
             return res.status(400).json({ error: 'Data urodzenia nie może być w przyszłości.' });
        }

        const existing = await User.findOne({ where: { email } });
        if (existing) return res.status(409).json({ error: 'Użytkownik o takim adresie email już istnieje' });

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        // Calculate Age from Date of Birth
        let age = null;
        if (dateOfBirth) {
            const birthDate = new Date(dateOfBirth);
            const today = new Date();
            age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
        }

        // Default role patient if not specified
        const userRole = role || 'patient'; 
        
        const newUser = await User.create({
            id: uuidv4(),
            email,
            password: hash,
            role: userRole,
            firstName,
            lastName,
            specialization: req.body.specialization, 
            gender,
            dateOfBirth,
            age
        });

        res.status(201).json({ message: 'User registered' });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ where: { email } });
        
        if (!user) return res.status(401).json({ error: 'Nieprawidłowy email lub hasło' });
        
        const validPass = await bcrypt.compare(password, user.password);
        if (!validPass) return res.status(401).json({ error: 'Nieprawidłowy email lub hasło' });

        //Generate neew session ID
        const newSessionId = uuidv4();
        user.lastSessionId = newSessionId;
        
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        user.refreshToken = refreshToken;
        await user.save();

        // Send Refresh Token in HttpOnly Cookie
        res.cookie('jwt', refreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: 'Strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        // Return Access Token and User Info
        res.json({
            accessToken,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                firstName: user.firstName,
                lastName: user.lastName,
                isBanned: user.isBanned,
                dateOfBirth: user.dateOfBirth
            }
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.refresh = async (req, res) => {
    const refreshToken = req.cookies.jwt;
    if (!refreshToken) return res.status(401).json({ error: 'No refresh token' });

    jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, async (err, decoded) => {
        if (err) return res.status(403).json({ error: 'Invalid refresh token' });

        try {
            const user = await User.findByPk(decoded.id);
            // Single Session Check
            if (!user || user.lastSessionId !== decoded.sessionId) {
                 return res.status(403).json({ error: 'Session expired/invalid' });
            }

            const accessToken = generateAccessToken(user);
            res.json({ accessToken });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });
};

exports.checkSession = async (req, res) => {
    const refreshToken = req.cookies.jwt;
    
    const notLoggedIn = () => res.json({ isAuthenticated: false });

    if (!refreshToken) return notLoggedIn();

    jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, async (err, decoded) => {
        if (err) return notLoggedIn();

        try {
            const user = await User.findByPk(decoded.id);
            if (!user || user.lastSessionId !== decoded.sessionId || user.isBanned) {
                 return notLoggedIn();
            }

            // Logic similar to login but using cookie
            const accessToken = generateAccessToken(user);
            
            res.json({
                isAuthenticated: true,
                accessToken,
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    isBanned: user.isBanned,
                    dateOfBirth: user.dateOfBirth
                }
            });

        } catch (e) {
            return notLoggedIn();
        }
    });
};

exports.logout = async (req, res) => {
    const refreshToken = req.cookies.jwt;
    
    res.clearCookie('jwt', { httpOnly: true, sameSite: 'Strict' });
    res.json({ message: 'Logged out' });
};

exports.ACCESS_TOKEN_SECRET = ACCESS_TOKEN_SECRET;
