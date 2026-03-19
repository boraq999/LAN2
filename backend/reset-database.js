const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = path.join(__dirname, 'lan-chat.db');

console.log('🔧 Resetting database...\n');

// Hash password function
const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

try {
  const db = new Database(dbPath);
  
  console.log('📝 Deleting all data...');
  
  // Delete all data from tables
  db.exec('DELETE FROM activity_logs');
  db.exec('DELETE FROM messages');
  db.exec('DELETE FROM group_members');
  db.exec('DELETE FROM groups');
  db.exec('DELETE FROM users');
  db.exec('DELETE FROM settings');
  
  console.log('✅ All data deleted\n');
  
  console.log('📝 Creating default data...');
  
  // Insert default settings
  const insertSetting = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
  insertSetting.run('allow_registration', 'false');
  insertSetting.run('file_sharing', 'true');
  insertSetting.run('code_sharing', 'true');
  insertSetting.run('max_file_size', '50');
  console.log('✅ Default settings created');
  
  // Create admin user
  const insertAdmin = db.prepare(`
    INSERT INTO users (id, username, password, role, status, created_by, joined_at, last_active) 
    VALUES ('admin', 'admin', ?, 'admin', 'active', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `);
  insertAdmin.run(hashPassword('admin123'));
  console.log('✅ Admin user created');
  
  // Create default group
  const insertGroup = db.prepare(`
    INSERT INTO groups (id, name, created_by, status, created_at) 
    VALUES ('group-main', 'General', 'admin', 'active', CURRENT_TIMESTAMP)
  `);
  insertGroup.run();
  console.log('✅ Default group created');
  
  db.close();
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ Database reset successfully!');
  console.log('='.repeat(50));
  console.log('\nDefault credentials:');
  console.log('  Username: admin');
  console.log('  Password: admin123');
  console.log('\n✅ You can now start the server!');
  
} catch (error) {
  console.error('❌ Error:', error);
}
