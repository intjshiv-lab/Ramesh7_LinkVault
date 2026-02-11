import { Router } from 'express';
import { getDb } from '../database.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

// GET /api/dashboard/uploads - Get user's uploads
router.get('/uploads', authenticateToken, (req, res) => {
    try {
        const db = getDb();
        const userId = req.user.id;

        const result = db.exec(`
            SELECT id, type, filename, mimetype, file_size, expires_at, created_at,
                   one_time_view, viewed, max_views, current_views,
                   CASE WHEN password_hash IS NOT NULL THEN 1 ELSE 0 END as has_password
            FROM uploads 
            WHERE user_id = ?
            ORDER BY created_at DESC
        `, [userId]);

        if (!result.length) {
            return res.json({ success: true, uploads: [] });
        }

        const columns = result[0].columns;
        const uploads = result[0].values.map(row => {
            const upload = {};
            columns.forEach((col, i) => upload[col] = row[i]);

            // Add computed fields
            upload.isExpired = Date.now() > upload.expires_at;
            upload.expiresAt = new Date(upload.expires_at).toISOString();
            upload.createdAt = new Date(upload.created_at).toISOString();
            upload.hasPassword = upload.has_password === 1;
            upload.isOneTimeView = upload.one_time_view === 1;
            upload.url = `/v/${upload.id}`;

            return upload;
        });

        res.json({
            success: true,
            uploads,
            total: uploads.length
        });

    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ error: 'Failed to fetch uploads' });
    }
});

// GET /api/dashboard/stats - Get user statistics
router.get('/stats', authenticateToken, (req, res) => {
    try {
        const db = getDb();
        const userId = req.user.id;
        const now = Date.now();

        // Total uploads
        const totalResult = db.exec(
            'SELECT COUNT(*) as count FROM uploads WHERE user_id = ?',
            [userId]
        );
        const totalUploads = totalResult.length ? totalResult[0].values[0][0] : 0;

        // Active uploads (not expired)
        const activeResult = db.exec(
            'SELECT COUNT(*) as count FROM uploads WHERE user_id = ? AND expires_at > ?',
            [userId, now]
        );
        const activeUploads = activeResult.length ? activeResult[0].values[0][0] : 0;

        // Total views
        const viewsResult = db.exec(
            'SELECT SUM(current_views) as total FROM uploads WHERE user_id = ?',
            [userId]
        );
        const totalViews = viewsResult.length && viewsResult[0].values[0][0]
            ? viewsResult[0].values[0][0]
            : 0;

        // Password protected count
        const protectedResult = db.exec(
            'SELECT COUNT(*) as count FROM uploads WHERE user_id = ? AND password_hash IS NOT NULL',
            [userId]
        );
        const protectedUploads = protectedResult.length ? protectedResult[0].values[0][0] : 0;

        res.json({
            success: true,
            stats: {
                totalUploads,
                activeUploads,
                expiredUploads: totalUploads - activeUploads,
                totalViews,
                protectedUploads
            }
        });

    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

export default router;
