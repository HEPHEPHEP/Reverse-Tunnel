import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../tunnel.db');
const dbDir = path.dirname(dbPath);

// Ensure database directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database schema
export function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      last_login INTEGER
    );

    CREATE TABLE IF NOT EXISTS tunnels (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      local_port INTEGER NOT NULL,
      remote_port INTEGER NOT NULL,
      protocol TEXT DEFAULT 'tcp',
      status TEXT DEFAULT 'inactive',
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS api_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      expires_at INTEGER,
      last_used INTEGER,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tunnel_connections (
      id TEXT PRIMARY KEY,
      tunnel_id TEXT NOT NULL,
      client_id TEXT,
      connected_at INTEGER DEFAULT (strftime('%s', 'now')),
      disconnected_at INTEGER,
      bytes_sent INTEGER DEFAULT 0,
      bytes_received INTEGER DEFAULT 0,
      FOREIGN KEY (tunnel_id) REFERENCES tunnels(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_tunnels_user_id ON tunnels(user_id);
    CREATE INDEX IF NOT EXISTS idx_api_tokens_user_id ON api_tokens(user_id);
    CREATE INDEX IF NOT EXISTS idx_tunnel_connections_tunnel_id ON tunnel_connections(tunnel_id);
  `);

  console.log('✅ Database initialized successfully');
}

export default db;
