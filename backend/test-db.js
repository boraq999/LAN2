const { db, hashPassword, users: userQueries } = require('./database');

console.log('🔍 Testing Database...\n');

// Test 1: Check if admin exists
console.log('1️⃣ Checking admin user...');
const admin = userQueries.getByUsername.get('admin');
if (admin) {
  console.log('✅ Admin user found:');
  console.log('   - ID:', admin.id);
  console.log('   - Username:', admin.username);
  console.log('   - Role:', admin.role);
  console.log('   - Status:', admin.status);
} else {
  console.log('❌ Admin user NOT found!');
}

// Test 2: Test password hash
console.log('\n2️⃣ Testing password hash...');
const testPassword = 'admin123';
const hashedPassword = hashPassword(testPassword);
console.log('   - Original password:', testPassword);
console.log('   - Hashed password:', hashedPassword);
if (admin) {
  console.log('   - Stored password:', admin.password);
  console.log('   - Match:', admin.password === hashedPassword ? '✅ YES' : '❌ NO');
}

// Test 3: Test authentication
console.log('\n3️⃣ Testing authentication...');
const authResult = userQueries.authenticate.get('admin', hashedPassword);
if (authResult) {
  console.log('✅ Authentication successful:');
  console.log('   - ID:', authResult.id);
  console.log('   - Username:', authResult.username);
  console.log('   - Role:', authResult.role);
} else {
  console.log('❌ Authentication FAILED!');
}

// Test 4: List all users
console.log('\n4️⃣ All users in database:');
const allUsers = userQueries.getAll.all();
console.log(`   Found ${allUsers.length} user(s):`);
allUsers.forEach(user => {
  console.log(`   - ${user.username} (${user.role}) - ${user.status}`);
});

console.log('\n✅ Database test complete!');
