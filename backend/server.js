import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import { initDatabase } from './database.js';
import uploadRouter from './routes/upload.js';
import contentRouter from './routes/content.js';
import authRouter from './routes/auth.js';
import dashboardRouter from './routes/dashboard.js';
import { startCleanupJob } from './middleware/cleanup.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/content', contentRouter);
app.use('/api/dashboard', dashboardRouter);

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        features: [
            'password-protection',
            'one-time-view',
            'max-views',
            'user-auth',
            'file-validation'
        ]
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Initialize database and start server
async function start() {
    await initDatabase();

    app.listen(PORT, () => {
        console.log(`🔐 LinkVault API Server v2.0 running on http://localhost:${PORT}`);
        console.log(`📦 Features: Auth, Password Protection, One-Time View, Max Views`);

        // Start cleanup job
        startCleanupJob();
    });
}

start().catch(console.error);
