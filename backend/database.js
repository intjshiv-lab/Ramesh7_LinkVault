import initSqlJs from 'sql.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, 'linkvault.db');

let db = null;

// Initialize database
export async function initDatabase() {
    const SQL = await initSqlJs();

    // Load existing database or create new
    if (existsSync(dbPath)) {
        const buffer = readFileSync(dbPath);
        db = new SQL.Database(buffer);
    } else {
        db = new SQL.Database();
    }

    // Create uploads table
    db.run(`
    CREATE TABLE IF NOT EXISTS uploads (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      content TEXT,
      filename TEXT,
      filepath TEXT,
      mimetype TEXT,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      password_hash TEXT,
      one_time_view INTEGER DEFAULT 0,
      viewed INTEGER DEFAULT 0,
      max_views INTEGER DEFAULT -1,
      current_views INTEGER DEFAULT 0,
      delete_token TEXT,
      user_id TEXT,
      file_size INTEGER
    )
  `);

    // Create users table
    db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )
  `);

    // Migration: Add new columns to existing uploads table if they don't exist
    const columnsToAdd = [
        { name: 'password_hash', type: 'TEXT' },
        { name: 'one_time_view', type: 'INTEGER DEFAULT 0' },
        { name: 'viewed', type: 'INTEGER DEFAULT 0' },
        { name: 'max_views', type: 'INTEGER DEFAULT -1' },
        { name: 'current_views', type: 'INTEGER DEFAULT 0' },
        { name: 'delete_token', type: 'TEXT' },
        { name: 'user_id', type: 'TEXT' },
        { name: 'file_size', type: 'INTEGER' }
    ];

    // Check existing columns
    const tableInfo = db.exec("PRAGMA table_info(uploads)");
    const existingColumns = tableInfo.length > 0 
        ? tableInfo[0].values.map(row => row[1]) 
        : [];

    // Add missing columns
    for (const col of columnsToAdd) {
        if (!existingColumns.includes(col.name)) {
            try {
                db.run(`ALTER TABLE uploads ADD COLUMN ${col.name} ${col.type}`);
                console.log(`Added column: ${col.name}`);
            } catch (e) {
                // Column might already exist
            }
        }
    }

    saveDatabase();
    return db;
}

// Save database to file
export function saveDatabase() {
    if (db) {
        const data = db.export();
        const buffer = Buffer.from(data);
        writeFileSync(dbPath, buffer);
    }
}

// Get database instance
export function getDb() {
    return db;
}

export default { initDatabase, getDb, saveDatabase };
