import { Router } from 'express';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, unlinkSync } from 'fs';
import bcrypt from 'bcryptjs';
import { getDb, saveDatabase } from '../database.js';
import { optionalAuth } from '../middleware/authMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = Router();

// Helper to get upload by ID
function getUploadById(id) {
    const db = getDb();
    const result = db.exec('SELECT * FROM uploads WHERE id = ?', [id]);

    if (!result.length || !result[0].values.length) {
        return null;
    }

    const columns = result[0].columns;
    const values = result[0].values[0];
    const upload = {};
    columns.forEach((col, i) => upload[col] = values[i]);
    return upload;
}

// Helper to delete upload and file
function deleteUpload(id) {
    const db = getDb();
    const upload = getUploadById(id);

    if (upload && upload.filepath) {
        const filePath = join(__dirname, '../../uploads', upload.filepath);
        try {
            if (existsSync(filePath)) {
                unlinkSync(filePath);
            }
        } catch (e) {
            console.error('Error deleting file:', e);
        }
    }

    db.run('DELETE FROM uploads WHERE id = ?', [id]);
    saveDatabase();
}

// GET /api/content/:id - Retrieve content metadata
router.get('/:id', optionalAuth, (req, res) => {
    try {
        const { id } = req.params;
        const db = getDb();

        // Validate ID format
        if (!id || !/^[A-Za-z0-9_-]{12,}$/.test(id)) {
            return res.status(403).json({ error: 'Invalid link' });
        }

        const upload = getUploadById(id);

        if (!upload) {
            return res.status(403).json({ error: 'Content not found or link is invalid' });
        }

        // Check expiry
        if (Date.now() > upload.expires_at) {
            return res.status(403).json({ error: 'This content has expired', expired: true });
        }

        // Check if viewed (one-time view)
        if (upload.one_time_view && upload.viewed) {
            return res.status(403).json({
                error: 'This content was a one-time view and has already been accessed',
                oneTimeViewed: true
            });
        }

        // Check max views
        if (upload.max_views > 0 && upload.current_views >= upload.max_views) {
            return res.status(403).json({
                error: 'This content has reached its maximum view limit',
                maxViewsReached: true
            });
        }

        // Check if password protected
        if (upload.password_hash) {
            return res.json({
                success: true,
                requiresPassword: true,
                type: upload.type,
                filename: upload.type === 'file' ? upload.filename : null,
                createdAt: new Date(upload.created_at).toISOString(),
                expiresAt: new Date(upload.expires_at).toISOString()
            });
        }

        // Increment view count
        db.run('UPDATE uploads SET current_views = current_views + 1 WHERE id = ?', [id]);

        // If one-time view, mark as viewed
        if (upload.one_time_view) {
            db.run('UPDATE uploads SET viewed = 1 WHERE id = ?', [id]);
        }

        saveDatabase();

        // Check if should delete after this view
        const shouldDelete = upload.one_time_view ||
            (upload.max_views > 0 && (upload.current_views + 1) >= upload.max_views);

        // Return content based on type
        if (upload.type === 'text') {
            const response = {
                success: true,
                type: 'text',
                content: upload.content,
                createdAt: new Date(upload.created_at).toISOString(),
                expiresAt: new Date(upload.expires_at).toISOString(),
                viewCount: upload.current_views + 1,
                maxViews: upload.max_views,
                oneTimeView: upload.one_time_view === 1,
                isOwner: req.user && req.user.id === upload.user_id
            };

            // Delete after sending if one-time view
            if (upload.one_time_view) {
                setTimeout(() => deleteUpload(id), 1000);
            }

            res.json(response);
        } else {
            res.json({
                success: true,
                type: 'file',
                filename: upload.filename,
                mimetype: upload.mimetype,
                fileSize: upload.file_size,
                createdAt: new Date(upload.created_at).toISOString(),
                expiresAt: new Date(upload.expires_at).toISOString(),
                viewCount: upload.current_views + 1,
                maxViews: upload.max_views,
                oneTimeView: upload.one_time_view === 1,
                isOwner: req.user && req.user.id === upload.user_id
            });
        }

    } catch (error) {
        console.error('Content retrieval error:', error);
        res.status(500).json({ error: 'Failed to retrieve content' });
    }
});

// POST /api/content/:id/verify - Verify password and get content
router.post('/:id/verify', async (req, res) => {
    try {
        const { id } = req.params;
        const { password } = req.body;
        const db = getDb();

        if (!password) {
            return res.status(400).json({ error: 'Password is required' });
        }

        const upload = getUploadById(id);

        if (!upload) {
            return res.status(403).json({ error: 'Content not found' });
        }

        if (Date.now() > upload.expires_at) {
            return res.status(403).json({ error: 'This content has expired', expired: true });
        }

        if (!upload.password_hash) {
            return res.status(400).json({ error: 'This content is not password protected' });
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, upload.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Incorrect password' });
        }

        // Check one-time view
        if (upload.one_time_view && upload.viewed) {
            return res.status(403).json({
                error: 'This content was a one-time view and has already been accessed'
            });
        }

        // Check max views
        if (upload.max_views > 0 && upload.current_views >= upload.max_views) {
            return res.status(403).json({ error: 'Maximum view limit reached' });
        }

        // Increment view count and mark viewed if one-time
        db.run('UPDATE uploads SET current_views = current_views + 1 WHERE id = ?', [id]);
        if (upload.one_time_view) {
            db.run('UPDATE uploads SET viewed = 1 WHERE id = ?', [id]);
        }
        saveDatabase();

        // Return content
        if (upload.type === 'text') {
            const response = {
                success: true,
                type: 'text',
                content: upload.content,
                createdAt: new Date(upload.created_at).toISOString(),
                expiresAt: new Date(upload.expires_at).toISOString(),
                viewCount: upload.current_views + 1,
                maxViews: upload.max_views,
                oneTimeView: upload.one_time_view === 1
            };

            if (upload.one_time_view) {
                setTimeout(() => deleteUpload(id), 1000);
            }

            res.json(response);
        } else {
            res.json({
                success: true,
                type: 'file',
                filename: upload.filename,
                mimetype: upload.mimetype,
                fileSize: upload.file_size,
                createdAt: new Date(upload.created_at).toISOString(),
                expiresAt: new Date(upload.expires_at).toISOString(),
                viewCount: upload.current_views + 1,
                maxViews: upload.max_views,
                oneTimeView: upload.one_time_view === 1,
                canDownload: true
            });
        }

    } catch (error) {
        console.error('Password verification error:', error);
        res.status(500).json({ error: 'Verification failed' });
    }
});

// GET /api/content/:id/download - Download file
router.get('/:id/download', async (req, res) => {
    try {
        const { id } = req.params;
        const { token } = req.query; // Password verification token or access after verify
        const db = getDb();

        if (!id || !/^[A-Za-z0-9_-]{12,}$/.test(id)) {
            return res.status(403).json({ error: 'Invalid link' });
        }

        const upload = getUploadById(id);

        if (!upload) {
            return res.status(403).json({ error: 'Content not found' });
        }

        if (Date.now() > upload.expires_at) {
            return res.status(403).json({ error: 'This content has expired' });
        }

        if (upload.type !== 'file') {
            return res.status(400).json({ error: 'This is not a file upload' });
        }

        // For one-time view files that were already viewed
        if (upload.one_time_view && upload.viewed) {
            return res.status(403).json({ error: 'This file was a one-time download' });
        }

        const filePath = join(__dirname, '../../uploads', upload.filepath);

        if (!existsSync(filePath)) {
            return res.status(404).json({ error: 'File not found on server' });
        }

        // Mark as viewed for one-time downloads
        if (upload.one_time_view) {
            db.run('UPDATE uploads SET viewed = 1 WHERE id = ?', [id]);
            saveDatabase();

            // Schedule deletion after download
            res.on('finish', () => {
                setTimeout(() => deleteUpload(id), 5000);
            });
        }

        res.download(filePath, upload.filename);

    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ error: 'Failed to download file' });
    }
});

// DELETE /api/content/:id - Delete content
router.delete('/:id', optionalAuth, (req, res) => {
    try {
        const { id } = req.params;
        const { deleteToken } = req.body;
        const db = getDb();

        const upload = getUploadById(id);

        if (!upload) {
            return res.status(404).json({ error: 'Content not found' });
        }

        // Check authorization: either owner or has delete token
        const isOwner = req.user && req.user.id === upload.user_id;
        const hasValidToken = deleteToken && upload.delete_token === deleteToken;

        if (!isOwner && !hasValidToken) {
            return res.status(403).json({
                error: 'Unauthorized. Provide valid delete token or login as owner.'
            });
        }

        deleteUpload(id);

        res.json({ success: true, message: 'Content deleted successfully' });

    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ error: 'Failed to delete content' });
    }
});

export default router;
