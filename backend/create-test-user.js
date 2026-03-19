const { db, hashPassword, users: userQueries } = require('./database');

console.log('🔧 Creating Test User...\n');

const username = 'test';
const password = 'test123';
const role = 'user';

console.log('Creating user:');
console.log('  Username:', username);
console.log('  Password:', password);
console.log('  Role:', role);
console.log('');

// Check if user already exists
const existing = userQueries.getByUsername.get(username);
if (existing) {
  console.log('⚠️  User already exists!');
  console.log('   Deleting old user...');
  userQueries.delete.run(existing.id);
  console.log('   ✅ Old user deleted');
}

// Create new user
const userId = 'user-' + Date.now();
const hashedPassword = hashPassword(password);

console.log('');
console.log('Creating new user...');
console.log('  User ID:', userId);
console.log('  Hashed password:', hashedPassword);

try {
  userQueries.create.run(
    userId,
    username,
    hashedPassword,
    '',
    role,
    'active',
    'admin'
  );
  
  console.log('');
  console.log('✅ User created successfully!');
  console.log('');
  console.log('Login credentials:');
  console.log('  Username: ' + username);
  console.log('  Password: ' + password);
  console.log('');
  console.log('You can now login at: http://localhost:5173');
  
  // Verify
  console.log('');
  console.log('Verifying...');
  const authResult = userQueries.authenticate.get(username, hashedPassword);
  if (authResult) {
    console.log('✅ Authentication test PASSED!');
  } else {
    console.log('❌ Authentication test FAILED!');
  }
  
} catch (error) {
  console.error('❌ Error creating user:', error);
}
