const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'lan-chat.db');
const db = new Database(dbPath);

console.log('🔧 Updating database schema...\n');

try {
  // Check if room_type column exists
  const tableInfo = db.prepare("PRAGMA table_info(messages)").all();
  const hasRoomType = tableInfo.some(col => col.name === 'room_type');
  
  if (hasRoomType) {
    console.log('✅ Column room_type already exists!');
  } else {
    console.log('📝 Adding room_type column to messages table...');
    
    // Add room_type column with default value 'group'
    db.exec(`
      ALTER TABLE messages 
      ADD COLUMN room_type TEXT DEFAULT 'group'
    `);
    
    console.log('✅ Column room_type added successfully!');
  }
  
  console.log('\n✅ Database update complete!');
  console.log('You can now run: npm start');
  
} catch (error) {
  console.error('❌ Error updating database:', error);
  console.log('\n💡 If the error persists, you may need to:');
  console.log('   1. Backup your data');
  console.log('   2. Delete lan-chat.db');
  console.log('   3. Run npm start to create a fresh database');
} finally {
  db.close();
}
