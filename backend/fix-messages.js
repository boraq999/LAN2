const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'lan-chat.db');
const db = new Database(dbPath);

console.log('🔧 Fixing old messages...\n');

try {
  // Get all messages with NULL or empty sender_name
  const messagesWithoutName = db.prepare(`
    SELECT m.*, u.username 
    FROM messages m
    LEFT JOIN users u ON m.sender_id = u.id
    WHERE m.sender_name IS NULL OR m.sender_name = '' OR m.sender_name = 'Unknown'
  `).all();
  
  console.log(`Found ${messagesWithoutName.length} messages to fix\n`);
  
  if (messagesWithoutName.length === 0) {
    console.log('✅ All messages are already correct!');
    db.close();
    process.exit(0);
  }
  
  // Update each message
  const updateStmt = db.prepare(`
    UPDATE messages 
    SET sender_name = ? 
    WHERE id = ?
  `);
  
  let fixed = 0;
  let failed = 0;
  
  messagesWithoutName.forEach(msg => {
    try {
      const senderName = msg.username || 'Unknown User';
      updateStmt.run(senderName, msg.id);
      console.log(`✅ Fixed message ${msg.id}: ${msg.sender_id} → ${senderName}`);
      fixed++;
    } catch (error) {
      console.error(`❌ Failed to fix message ${msg.id}:`, error.message);
      failed++;
    }
  });
  
  console.log('\n' + '='.repeat(50));
  console.log(`✅ Fixed: ${fixed} messages`);
  if (failed > 0) {
    console.log(`❌ Failed: ${failed} messages`);
  }
  console.log('='.repeat(50));
  console.log('\n✅ Done! You can now restart the server.');
  
} catch (error) {
  console.error('❌ Error:', error);
} finally {
  db.close();
}
