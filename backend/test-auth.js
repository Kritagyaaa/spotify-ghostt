const assert = require('node:assert');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createDatabase } = require('./db');
const { JWT_SECRET } = require('./authMiddleware');

const database = createDatabase();

// Clean up old test data if exists
function cleanup() {
  database.prepare("DELETE FROM users WHERE email = 'testuser@example.com'").run();
  database.prepare("DELETE FROM users WHERE email = 'resetuser@example.com'").run();
}

function runTests() {
  console.log('Starting Authentication Module Tests...\n');
  cleanup();

  // Test 1: User Registration Hashing
  console.log('Test 1: User Registration Hashing');
  const password = 'mySecretPassword123';
  const hashedPassword = bcrypt.hashSync(password, 10);
  assert.ok(bcrypt.compareSync(password, hashedPassword), 'Password hashing compare should match original password');
  assert.notEqual(password, hashedPassword, 'Stored password should not be plain text');
  console.log('  -> PASS');

  // Test 2: Database Insertion for Registration
  console.log('Test 2: Database User Insertion');
  const regResult = database.prepare(
    "INSERT INTO users (name, email, phone_number, password, is_verified) VALUES (?, ?, ?, ?, 1)"
  ).run('Test User', 'testuser@example.com', '+1234567890', hashedPassword);
  
  const userId = regResult.lastInsertRowid;
  assert.ok(userId > 0, 'User ID should be auto-incremented positive integer');

  const userRecord = database.prepare("SELECT * FROM users WHERE id = ?").get(userId);
  assert.equal(userRecord.name, 'Test User', 'Name should match inserted name');
  assert.equal(userRecord.email, 'testuser@example.com', 'Email should match inserted email');
  assert.equal(userRecord.phone_number, '+1234567890', 'Phone number should match inserted phone number');
  assert.equal(userRecord.role, 'user', 'Default role should be user');
  console.log('  -> PASS');

  // Test 3: JWT Token Creation
  console.log('Test 3: JWT Token Creation and Verification');
  const token = jwt.sign({ id: userRecord.id, email: userRecord.email, role: userRecord.role }, JWT_SECRET, { expiresIn: '1h' });
  const decoded = jwt.verify(token, JWT_SECRET);
  assert.equal(decoded.id, userId, 'Decoded user ID should match');
  assert.equal(decoded.email, 'testuser@example.com', 'Decoded email should match');
  console.log('  -> PASS');

  // Test 4: Session Creation and Revocation
  console.log('Test 4: Session Creation and Revocation');
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes expiry
  const sessionResult = database.prepare(
    "INSERT INTO sessions (user_id, token, device_info, ip_address, expires_at) VALUES (?, ?, ?, ?, ?)"
  ).run(userId, token, 'Mozilla/Chrome', '127.0.0.1', expiresAt);

  const sessionId = sessionResult.lastInsertRowid;
  assert.ok(sessionId > 0, 'Session ID should be generated');

  // Check active session lookup
  const now = new Date().toISOString();
  const sessionRecord = database.prepare(
    "SELECT * FROM sessions WHERE token = ? AND is_active = 1 AND expires_at > ?"
  ).get(token, now);
  assert.ok(sessionRecord, 'Session should be active and valid');

  // Revoke session
  database.prepare("UPDATE sessions SET is_active = 0 WHERE id = ?").run(sessionId);
  const inactiveSession = database.prepare(
    "SELECT * FROM sessions WHERE token = ? AND is_active = 1 AND expires_at > ?"
  ).get(token, now);
  assert.ok(!inactiveSession, 'Session should be inactive after revocation');
  console.log('  -> PASS');

  // Test 5: Dummy OTP verification
  console.log('Test 5: Dummy OTP verification flow');
  const dummyOtp = '123456';
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  
  const otpResult = database.prepare(
    "INSERT INTO otp_verifications (user_id, otp_code, purpose, expires_at) VALUES (?, ?, 'login', ?)"
  ).run(userId, dummyOtp, otpExpires);

  const otpId = otpResult.lastInsertRowid;
  assert.ok(otpId > 0, 'OTP ID should be generated');

  // Verify unused OTP
  const validOtp = database.prepare(
    "SELECT * FROM otp_verifications WHERE user_id = ? AND otp_code = ? AND purpose = 'login' AND is_used = 0 AND expires_at > ?"
  ).get(userId, dummyOtp, now);
  assert.ok(validOtp, 'OTP should be valid');

  // Mark used
  database.prepare("UPDATE otp_verifications SET is_used = 1 WHERE id = ?").run(otpId);
  const usedOtp = database.prepare(
    "SELECT * FROM otp_verifications WHERE user_id = ? AND otp_code = ? AND purpose = 'login' AND is_used = 0 AND expires_at > ?"
  ).get(userId, dummyOtp, now);
  assert.ok(!usedOtp, 'OTP should be invalid after usage');
  console.log('  -> PASS');

  // Test 6: Consolidated Password Reset via Dummy OTP
  console.log('Test 6: Consolidated Password Reset via Dummy OTP');
  // Re-create user and reset OTP
  const hashedTempPassword = bcrypt.hashSync('tempPassword123', 10);
  const userSetup = database.prepare(
    "INSERT INTO users (name, email, phone_number, password, is_verified) VALUES (?, ?, ?, ?, 1)"
  ).run('Reset User', 'resetuser@example.com', '+1234567890', hashedTempPassword);
  const tempUserId = userSetup.lastInsertRowid;
  
  const resetOtp = '123456';
  const resetOtpExpires = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  database.prepare(
    "INSERT INTO otp_verifications (user_id, otp_code, purpose, expires_at) VALUES (?, ?, 'reset', ?)"
  ).run(tempUserId, resetOtp, resetOtpExpires);

  // Validate OTP in reset password table query
  const testNow = new Date().toISOString();
  const resetOtpRecord = database.prepare(
    "SELECT * FROM otp_verifications WHERE user_id = ? AND otp_code = ? AND purpose = 'reset' AND is_used = 0 AND expires_at > ?"
  ).get(tempUserId, resetOtp, testNow);
  assert.ok(resetOtpRecord, 'Reset OTP should be valid before reset');

  // Perform reset simulation
  const newPassword = 'newSecretPassword123';
  const newPasswordHash = bcrypt.hashSync(newPassword, 10);
  database.prepare("UPDATE otp_verifications SET is_used = 1 WHERE id = ?").run(resetOtpRecord.id);
  database.prepare("UPDATE users SET password = ?, updated_at = ? WHERE id = ?")
    .run(newPasswordHash, new Date().toISOString(), tempUserId);

  // Verify
  const updatedUserRecord = database.prepare("SELECT password FROM users WHERE id = ?").get(tempUserId);
  assert.ok(bcrypt.compareSync(newPassword, updatedUserRecord.password), 'New password should be correctly hashed and stored');
  console.log('  -> PASS');

  // Cleanup
  cleanup();
  console.log('\nAll tests completed successfully!');
}

try {
  runTests();
} catch (error) {
  console.error('\nTest failed with error:', error);
  process.exit(1);
}
