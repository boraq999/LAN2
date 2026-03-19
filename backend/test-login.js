const { db, hashPassword, users: userQueries } = require('./database');

console.log('🔍 Testing User Login...\n');

// Get username and password from command line
const args = process.argv.slice(2);
if (args.length < 2) {
  console.log('Usage: node test-login.js <username> <password>');
  console.log('Example: node test-login.js test test123');
  process.exit(1);
}

const username = args[0];
const password = args[1];

console.log('Testing login for:');
console.log('  Username:', username);
console.log('  Password:', password);
console.log('');

// Step 1: Check if user exists
console.log('1️⃣ Checking if user exists...');
const user = userQueries.getByUsername.get(username);
if (user) {
  console.log('✅ User found:');
  console.log('   - ID:', user.id);
  console.log('   - Username:', user.username);
  console.log('   - Role:', user.role);
  console.log('   - Status:', user.status);
  console.log('   - Stored password hash:', user.password);
} else {
  console.log('❌ User NOT found!');
  console.log('');
  console.log('Available users:');
  const allUsers = userQueries.getAll.all();
  allUsers.forEach(u => {
    console.log(`   - ${u.username} (${u.role})`);
  });
  process.exit(1);
}

// Step 2: Hash the password
console.log('');
console.log('2️⃣ Hashing password...');
const hashedPassword = hashPassword(password);
console.log('   - Original password:', password);
console.log('   - Hashed password:', hashedPassword);

// Step 3: Compare hashes
console.log('');
console.log('3️⃣ Comparing hashes...');
if (user.password === hashedPassword) {
  console.log('✅ Password hashes MATCH!');
} else {
  console.log('❌ Password hashes DO NOT MATCH!');
  console.log('   - Expected:', user.password);
  console.log('   - Got:', hashedPassword);
}

// Step 4: Test authentication
console.log('');
console.log('4️⃣ Testing authentication...');
const authResult = userQueries.authenticate.get(username, hashedPassword);
if (authResult) {
  console.log('✅ Authentication SUCCESSFUL!');
  console.log('   - User can login');
  console.log('   - ID:', authResult.id);
  console.log('   - Username:', authResult.username);
  console.log('   - Role:', authResult.role);
} else {
  console.log('❌ Authentication FAILED!');
  console.log('   - User cannot login');
  console.log('   - Check if user status is "active"');
  console.log('   - Current status:', user.status);
}

console.log('');
console.log('✅ Test complete!');
