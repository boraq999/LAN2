const Database = require('better-sqlite3');
const path = require('path');

// Create database file
const dbPath = path.join(__dirname, 'lan-chat.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
const initDB = () => {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      avatar TEXT,
      status TEXT DEFAULT 'active',
      role TEXT DEFAULT 'user',
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_active DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Groups table
  db.exec(`
    CREATE TABLE IF NOT EXISTS groups (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_by TEXT,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  // Group members table
  db.exec(`
    CREATE TABLE IF NOT EXISTS group_members (
      group_id TEXT,
      user_id TEXT,
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (group_id, user_id),
      FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Messages table
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id TEXT NOT NULL,
      sender_name TEXT NOT NULL,
      room_id TEXT NOT NULL,
      content TEXT,
      type TEXT DEFAULT 'text',
      file_name TEXT,
      file_size INTEGER,
      file_data TEXT,
      language TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sender_id) REFERENCES users(id)
    )
  `);

  // Activity logs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      action TEXT NOT NULL,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Settings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Insert default settings
  const insertSetting = db.prepare(`
    INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)
  `);

  insertSetting.run('allow_registration', 'true');
  insertSetting.run('file_sharing', 'true');
  insertSetting.run('code_sharing', 'true');
  insertSetting.run('max_file_size', '50');

  // Create default admin user
  const insertAdmin = db.prepare(`
    INSERT OR IGNORE INTO users (id, username, role, status) 
    VALUES ('admin', 'Administrator', 'admin', 'active')
  `);
  insertAdmin.run();

  // Create default group
  const insertGroup = db.prepare(`
    INSERT OR IGNORE INTO groups (id, name, created_by) 
    VALUES ('group-main', 'Team Apollo', 'admin')
  `);
  insertGroup.run();

  console.log('✅ Database initialized successfully');
};

// Initialize database
initDB();

// Export database instance and prepared statements
module.exports = {
  db,
  
  // User queries
  users: {
    create: db.prepare(`
      INSERT INTO users (id, username, avatar, role, status) 
      VALUES (?, ?, ?, ?, ?)
    `),
    
    getAll: db.prepare(`
      SELECT * FROM users ORDER BY joined_at DESC
    `),
    
    getById: db.prepare(`
      SELECT * FROM users WHERE id = ?
    `),
    
    updateStatus: db.prepare(`
      UPDATE users SET status = ?, last_active = CURRENT_TIMESTAMP WHERE id = ?
    `),
    
    updateLastActive: db.prepare(`
      UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE id = ?
    `),
    
    delete: db.prepare(`
      DELETE FROM users WHERE id = ?
    `),
  },

  // Group queries
  groups: {
    create: db.prepare(`
      INSERT INTO groups (id, name, created_by) VALUES (?, ?, ?)
    `),
    
    getAll: db.prepare(`
      SELECT g.*, 
        (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count
      FROM groups g 
      ORDER BY created_at DESC
    `),
    
    getById: db.prepare(`
      SELECT * FROM groups WHERE id = ?
    `),
    
    updateStatus: db.prepare(`
      UPDATE groups SET status = ? WHERE id = ?
    `),
    
    delete: db.prepare(`
      DELETE FROM groups WHERE id = ?
    `),
    
    addMember: db.prepare(`
      INSERT OR IGNORE INTO group_members (group_id, user_id) VALUES (?, ?)
    `),
    
    removeMember: db.prepare(`
      DELETE FROM group_members WHERE group_id = ? AND user_id = ?
    `),
    
    getMembers: db.prepare(`
      SELECT u.* FROM users u
      JOIN group_members gm ON u.id = gm.user_id
      WHERE gm.group_id = ?
    `),
  },

  // Message queries
  messages: {
    create: db.prepare(`
      INSERT INTO messages (sender_id, sender_name, room_id, content, type, file_name, file_size, file_data, language)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `),
    
    getByRoom: db.prepare(`
      SELECT * FROM messages 
      WHERE room_id = ? 
      ORDER BY created_at ASC 
      LIMIT 100
    `),
    
    getRecent: db.prepare(`
      SELECT * FROM messages 
      ORDER BY created_at DESC 
      LIMIT 50
    `),
    
    delete: db.prepare(`
      DELETE FROM messages WHERE id = ?
    `),
  },

  // Activity log queries
  logs: {
    create: db.prepare(`
      INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)
    `),
    
    getRecent: db.prepare(`
      SELECT al.*, u.username 
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY created_at DESC 
      LIMIT 100
    `),
  },

  // Settings queries
  settings: {
    get: db.prepare(`
      SELECT value FROM settings WHERE key = ?
    `),
    
    set: db.prepare(`
      INSERT OR REPLACE INTO settings (key, value, updated_at) 
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `),
    
    getAll: db.prepare(`
      SELECT * FROM settings
    `),
  },
};
