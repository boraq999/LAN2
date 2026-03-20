const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

// Hash password function
const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

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
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      avatar TEXT,
      status TEXT DEFAULT 'active',
      role TEXT DEFAULT 'user',
      created_by TEXT,
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
      room_type TEXT DEFAULT 'group',
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
    INSERT OR IGNORE INTO users (id, username, password, role, status) 
    VALUES ('admin', 'admin', ?, 'admin', 'active')
  `);
  insertAdmin.run(hashPassword('admin123'));

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
  hashPassword,
  
  // User queries
  users: {
    create: db.prepare(`
      INSERT INTO users (id, username, password, avatar, role, status, created_by) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `),
    
    getAll: db.prepare(`
      SELECT id, username, avatar, status, role, created_by, joined_at, last_active 
      FROM users 
      ORDER BY joined_at DESC
    `),
    
    getById: db.prepare(`
      SELECT id, username, avatar, status, role, created_by, joined_at, last_active 
      FROM users 
      WHERE id = ?
    `),
    
    getByUsername: db.prepare(`
      SELECT * FROM users WHERE username = ?
    `),
    
    authenticate: db.prepare(`
      SELECT id, username, avatar, status, role 
      FROM users 
      WHERE username = ? AND password = ? AND status = 'active'
    `),
    
    updateStatus: db.prepare(`
      UPDATE users SET status = ?, last_active = CURRENT_TIMESTAMP WHERE id = ?
    `),
    
    updateLastActive: db.prepare(`
      UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE id = ?
    `),
    
    updatePassword: db.prepare(`
      UPDATE users SET password = ? WHERE id = ?
    `),
    
    delete: db.prepare(`
      DELETE FROM users WHERE id = ?
    `),
  },

  // Group queries
  groups: {
    create: db.prepare(`
      INSERT INTO groups (id, name, created_by, status) VALUES (?, ?, ?, 'active')
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
      INSERT INTO messages (sender_id, sender_name, room_id, room_type, content, type, file_name, file_size, file_data, language)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      UPDATE messages SET content = '', type = 'text', file_name = NULL, file_size = NULL, file_data = NULL, language = NULL WHERE id = ?
    `),
    
    getPrivateChats: db.prepare(`
      SELECT DISTINCT 
        CASE 
          WHEN sender_id = ? THEN 
            SUBSTR(room_id, INSTR(room_id, '-') + 1)
          ELSE 
            SUBSTR(room_id, 1, INSTR(room_id, '-') - 1)
        END as other_user_id,
        room_id,
        MAX(created_at) as last_message_time
      FROM messages
      WHERE room_type = 'private' 
        AND (sender_id = ? OR room_id LIKE ? || '-%' OR room_id LIKE '%-' || ?)
      GROUP BY room_id
      ORDER BY last_message_time DESC
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
