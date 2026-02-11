import { Router } from 'express';
import multer from 'multer';
import { nanoid } from 'nanoid';
import bcrypt from 'bcryptjs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getDb, saveDatabase } from '../database.js';
import { optionalAuth } from '../middleware/authMiddleware.js';
import { validateFile, MAX_FILE_SIZE } from '../middleware/fileValidation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, join(__dirname, '../../uploads'));
    },
    filename: (req, file, cb) => {
        const uniqueId = nanoid(12);
        const ext = file.originalname.split('.').pop();
        cb(null, `${uniqueId}.${ext}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: MAX_FILE_SIZE }
});

// POST /api/upload - Upload text or file with options
router.post('/', optionalAuth, upload.single('file'), async (req, res) => {
    try {
        const { text, expiresAt, password, oneTimeView, maxViews } = req.body;
        const file = req.file;
        const db = getDb();

        // Validation: must have either text or file
        if (!text && !file) {
            return res.status(400).json({
                error: 'Please provide either text or a file to upload'
            });
        }

        // Validate file if present
        if (file) {
            const validation = validateFile(file);
            if (!validation.valid) {
                return res.status(400).json({
                    error: validation.errors.join('. ')
                });
            }
        }

        // Generate unique ID
        const id = nanoid(12);

        // Generate delete token for anonymous deletion
        const deleteToken = nanoid(24);

        // Calculate expiry (default: 10 minutes from now)
        const now = Date.now();
        let expiresAtTimestamp;

        if (expiresAt) {
            expiresAtTimestamp = new Date(expiresAt).getTime();
            // Validate expiry is in the future
            if (expiresAtTimestamp <= now) {
                return res.status(400).json({
                    error: 'Expiry time must be in the future'
                });
            }
        } else {
            expiresAtTimestamp = now + (10 * 60 * 1000); // 10 minutes default
        }

        // Hash password if provided
        let passwordHash = null;
        if (password && password.trim()) {
            const salt = await bcrypt.genSalt(10);
            passwordHash = await bcrypt.hash(password, salt);
        }

        // Parse one-time view flag
        const isOneTimeView = oneTimeView === 'true' || oneTimeView === true ? 1 : 0;

        // Parse max views (-1 means unlimited)
        let maxViewsInt = -1;
        if (maxViews && parseInt(maxViews) > 0) {
            maxViewsInt = parseInt(maxViews);
        }

        // Get user ID if authenticated
        const userId = req.user ? req.user.id : null;

        // Insert into database
        db.run(`
      INSERT INTO uploads (
        id, type, content, filename, filepath, mimetype, 
        expires_at, created_at, password_hash, one_time_view, 
        viewed, max_views, current_views, delete_token, user_id, file_size
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
            id,
            file ? 'file' : 'text',
            text || null,
            file ? file.originalname : null,
            file ? file.filename : null,
            file ? file.mimetype : null,
            expiresAtTimestamp,
            now,
            passwordHash,
            isOneTimeView,
            0,
            maxViewsInt,
            0,
            deleteToken,
            userId,
            file ? file.size : (text ? text.length : 0)
        ]);

        saveDatabase();

        // Return success response
        res.status(201).json({
            success: true,
            id,
            url: `/v/${id}`,
            expiresAt: new Date(expiresAtTimestamp).toISOString(),
            type: file ? 'file' : 'text',
            deleteToken,
            hasPassword: !!passwordHash,
            oneTimeView: isOneTimeView === 1,
            maxViews: maxViewsInt
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to process upload' });
    }
});

export default router;
