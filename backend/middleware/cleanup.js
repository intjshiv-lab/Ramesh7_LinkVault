import { unlink } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getDb, saveDatabase } from '../database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cleanup interval in milliseconds (default: 1 minute)
const CLEANUP_INTERVAL = parseInt(process.env.CLEANUP_INTERVAL) || 60 * 1000;

// Cleanup expired and consumed content
export function cleanupExpired() {
    try {
        const db = getDb();
        if (!db) return;

        const now = Date.now();
        let deletedCount = 0;

        // 1. Get expired file uploads to delete files from disk
        const expiredResult = db.exec(`
            SELECT id, filepath FROM uploads 
            WHERE type = 'file' AND expires_at < ?
        `, [now]);

        if (expiredResult.length && expiredResult[0].values.length) {
            for (const row of expiredResult[0].values) {
                const filepath = row[1];
                if (filepath) {
                    const filePath = join(__dirname, '../../uploads', filepath);
                    unlink(filePath).catch(() => { });
                }
            }
            deletedCount += expiredResult[0].values.length;
        }

        // 2. Get one-time viewed content
        const viewedResult = db.exec(`
            SELECT id, filepath FROM uploads 
            WHERE type = 'file' AND one_time_view = 1 AND viewed = 1
        `);

        if (viewedResult.length && viewedResult[0].values.length) {
            for (const row of viewedResult[0].values) {
                const filepath = row[1];
                if (filepath) {
                    const filePath = join(__dirname, '../../uploads', filepath);
                    unlink(filePath).catch(() => { });
                }
            }
            deletedCount += viewedResult[0].values.length;
        }

        // 3. Get max-views exceeded content
        const maxViewsResult = db.exec(`
            SELECT id, filepath FROM uploads 
            WHERE type = 'file' AND max_views > 0 AND current_views >= max_views
        `);

        if (maxViewsResult.length && maxViewsResult[0].values.length) {
            for (const row of maxViewsResult[0].values) {
                const filepath = row[1];
                if (filepath) {
                    const filePath = join(__dirname, '../../uploads', filepath);
                    unlink(filePath).catch(() => { });
                }
            }
            deletedCount += maxViewsResult[0].values.length;
        }

        // Delete all expired/consumed entries from database
        db.run('DELETE FROM uploads WHERE expires_at < ?', [now]);
        db.run('DELETE FROM uploads WHERE one_time_view = 1 AND viewed = 1');
        db.run('DELETE FROM uploads WHERE max_views > 0 AND current_views >= max_views');

        saveDatabase();

        if (deletedCount > 0) {
            console.log(`🧹 Cleanup: Removed ${deletedCount} expired/consumed items`);
        }

    } catch (error) {
        console.error('Cleanup error:', error);
    }
}

// Run cleanup job at configured interval
export function startCleanupJob() {
    // Run immediately on startup
    setTimeout(cleanupExpired, 5000);

    // Then run at configured interval
    setInterval(cleanupExpired, CLEANUP_INTERVAL);

    console.log(`🔄 Cleanup job started (runs every ${CLEANUP_INTERVAL / 1000}s)`);
}
