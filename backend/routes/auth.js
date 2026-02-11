import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { getDb, saveDatabase } from '../database.js';
import { generateToken, authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

// POST /api/auth/register - Register new user
router.post('/register', async (req, res) => {
    try {
        const { email, username, password } = req.body;
        const db = getDb();

        // Validation
        if (!email || !username || !password) {
            return res.status(400).json({
                error: 'Email, username, and password are required'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                error: 'Password must be at least 6 characters'
            });
        }

        if (username.length < 3) {
            return res.status(400).json({
                error: 'Username must be at least 3 characters'
            });
        }

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // Check if email exists
        const emailCheck = db.exec('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
        if (emailCheck.length > 0 && emailCheck[0].values.length > 0) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        // Check if username exists
        const usernameCheck = db.exec('SELECT id FROM users WHERE username = ?', [username.toLowerCase()]);
        if (usernameCheck.length > 0 && usernameCheck[0].values.length > 0) {
            return res.status(409).json({ error: 'Username already taken' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Create user
        const userId = nanoid(16);
        const now = Date.now();

        db.run(`
            INSERT INTO users (id, email, username, password_hash, created_at)
            VALUES (?, ?, ?, ?, ?)
        `, [userId, email.toLowerCase(), username.toLowerCase(), passwordHash, now]);

        saveDatabase();

        // Generate token
        const user = { id: userId, email: email.toLowerCase(), username: username.toLowerCase() };
        const token = generateToken(user);

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            user: {
                id: userId,
                email: email.toLowerCase(),
                username: username.toLowerCase()
            },
            token
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// POST /api/auth/login - Login user
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const db = getDb();

        // Validation
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user
        const result = db.exec('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);

        if (!result.length || !result[0].values.length) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const columns = result[0].columns;
        const values = result[0].values[0];
        const user = {};
        columns.forEach((col, i) => user[col] = values[i]);

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Generate token
        const token = generateToken({
            id: user.id,
            email: user.email,
            username: user.username
        });

        res.json({
            success: true,
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                username: user.username
            },
            token
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// GET /api/auth/me - Get current user
router.get('/me', authenticateToken, (req, res) => {
    res.json({
        success: true,
        user: req.user
    });
});

// POST /api/auth/logout - Logout (client-side token removal)
router.post('/logout', (req, res) => {
    // JWT is stateless, logout is handled client-side by removing token
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});

export default router;
