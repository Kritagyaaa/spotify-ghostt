const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const database = require('./db');
const { JWT_SECRET } = require('./authMiddleware');
const crypto = require('crypto');
const emailService = require('./services/emailService');

// Helper to read JSON request body
function readBody(request) {
  if (request.body !== undefined) {
    return Promise.resolve(request.body);
  }
  return new Promise((resolve, reject) => {
    const chunks = [];
    request.on('data', (chunk) => chunks.push(chunk));
    request.on('end', () => {
      if (!chunks.length) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch (error) {
        reject(error);
      }
    });
    request.on('error', reject);
  });
}

// Utility to send JSON responses
function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  });
  response.end(JSON.stringify(payload));
}

// Extract client IP and Device Info from request headers/socket
function getClientMeta(request) {
  const ip = request.headers['x-forwarded-for'] || request.socket.remoteAddress || '127.0.0.1';
  const device = request.headers['user-agent'] || 'Unknown Device';
  return { ip, device };
}

/**
 * POST /api/auth/register
 */
async function handleRegister(request, response) {
  try {
    const body = await readBody(request);
    const { name, email, phone_number, password, role } = body;
    const userRole = role || 'user';

    if (userRole === 'admin') {
      return sendJson(response, 400, { error: 'Admin registration is not allowed.' });
    }
    if (userRole !== 'user' && userRole !== 'creator') {
      return sendJson(response, 400, { error: 'Invalid registration role.' });
    }

    if (!name || !email || !password) {
      return sendJson(response, 400, { error: 'Name, email, and password are required.' });
    }

    // Check if email already registered
    const [existingUsers] = await database.query('SELECT id FROM users WHERE email = ?', [email]);
    const existing = existingUsers[0];
    if (existing) {
      return sendJson(response, 409, { error: 'Email already registered.' });
    }

    // Hash the password
    const passwordHash = bcrypt.hashSync(password, 10);

    // Save user - default is_verified to 0 since we now send an OTP for verification
    const [result] = await database.query(
      'INSERT INTO users (name, email, phone_number, password, role, is_verified) VALUES (?, ?, ?, ?, ?, 0)',
      [name, email, phone_number || null, passwordHash, userRole]
    );

    const userId = result.insertId;

    // Generate 6-digit OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    // Save OTP to DB
    await database.query(
      'INSERT INTO otp_verifications (user_id, otp_code, purpose, expires_at) VALUES (?, ?, \'verify\', ?)',
      [userId, otpCode, expiresAt]
    );

    // Send the OTP via emailService
    await emailService.sendVerificationOtp(email, otpCode);

    sendJson(response, 201, {
      message: 'User registered successfully. Please verify your email with the OTP sent.',
      user: { id: userId, name, email, phone_number },
      otp: otpCode
    });
  } catch (error) {
    sendJson(response, 500, { error: error.message });
  }
}

/**
 * POST /api/auth/login
 */
async function handleLogin(request, response) {
  let userIdForLog = null;
  const { ip, device } = getClientMeta(request);

  try {
    const body = await readBody(request);
    const { email, password } = body;

    if (!email || !password) {
      return sendJson(response, 400, { error: 'Email and password are required.' });
    }

    // Lookup user
    const [users] = await database.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = users[0];
    if (!user) {
      // Record failed activity
      await database.query(
        'INSERT INTO login_activity (user_id, ip_address, device_info, status) VALUES (NULL, ?, ?, ?)',
        [ip, device, 'failed']
      );
      return sendJson(response, 401, { error: 'Invalid email or password.' });
    }

    userIdForLog = user.id;

    // Verify password
    const match = bcrypt.compareSync(password, user.password);
    if (!match) {
      await database.query(
        'INSERT INTO login_activity (user_id, ip_address, device_info, status) VALUES (?, ?, ?, ?)',
        [userIdForLog, ip, device, 'failed']
      );
      return sendJson(response, 401, { error: 'Invalid email or password.' });
    }

    // Check if account is verified
    if (user.is_verified === 0) {
      // Generate new OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      // Invalidate old verifications of purpose 'verify'
      await database.query('UPDATE otp_verifications SET is_used = 1 WHERE user_id = ? AND purpose = \'verify\'', [user.id]);

      // Save OTP to DB
      await database.query(
        'INSERT INTO otp_verifications (user_id, otp_code, purpose, expires_at) VALUES (?, ?, \'verify\', ?)',
        [user.id, otpCode, expiresAt]
      );

      // Resend OTP email
      await emailService.sendVerificationOtp(user.email, otpCode);

      return sendJson(response, 403, {
        error: 'Account not verified. Please verify your email.',
        code: 'UNVERIFIED_ACCOUNT',
        email: user.email,
        otp: otpCode
      });
    }

    // Success - Create JWT & Session
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Store session in DB
    await database.query(
      'INSERT INTO sessions (user_id, token, device_info, ip_address, expires_at) VALUES (?, ?, ?, ?, ?)',
      [user.id, token, device, ip, expiresAt]
    );

    // Record login activity
    await database.query(
      'INSERT INTO login_activity (user_id, ip_address, device_info, status) VALUES (?, ?, ?, ?)',
      [user.id, ip, device, 'success']
    );

    // Update last login timestamp
    await database.query('UPDATE users SET last_login = ? WHERE id = ?', [new Date(), user.id]);

    sendJson(response, 200, {
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone_number: user.phone_number,
        role: user.role,
        profile_picture: user.profile_picture
      }
    });
  } catch (error) {
    if (userIdForLog) {
      await database.query(
        'INSERT INTO login_activity (user_id, ip_address, device_info, status) VALUES (?, ?, ?, ?)',
        [userIdForLog, ip, device, 'failed']
      );
    }
    sendJson(response, 500, { error: error.message });
  }
}

/**
 * POST /api/auth/logout
 */
async function handleLogout(request, response) {
  try {
    if (!request.sessionToken) {
      return sendJson(response, 401, { error: 'Unauthorized.' });
    }

    // Set active session in DB to inactive
    await database.query('UPDATE sessions SET is_active = 0 WHERE token = ?', [request.sessionToken]);

    sendJson(response, 200, { message: 'Logged out successfully.' });
  } catch (error) {
    sendJson(response, 500, { error: error.message });
  }
}

/**
 * POST /api/auth/send-otp
 * Generates a dummy 6-digit OTP (for testing) and returns it in the response.
 */
async function handleSendOtp(request, response) {
  try {
    const body = await readBody(request);
    const { email, phone_number, purpose } = body;
    const otpPurpose = purpose || 'verify';

    if (!email && !phone_number) {
      return sendJson(response, 400, { error: 'Email or phone number is required.' });
    }

    // Locate the user
    let user;
    if (email) {
      const [users] = await database.query('SELECT id FROM users WHERE email = ?', [email]);
      user = users[0];
    } else {
      const [users] = await database.query('SELECT id FROM users WHERE phone_number = ?', [phone_number]);
      user = users[0];
    }

    if (!user) {
      return sendJson(response, 404, { error: 'User not found.' });
    }

    // Generate cryptographically secure random 6-digit OTP
    const realOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    // Mark previous OTPs of this purpose for this user as used
    await database.query('UPDATE otp_verifications SET is_used = 1 WHERE user_id = ? AND purpose = ?', [user.id, otpPurpose]);

    // Save in DB
    await database.query(
      'INSERT INTO otp_verifications (user_id, otp_code, purpose, expires_at) VALUES (?, ?, ?, ?)',
      [user.id, realOtp, otpPurpose, expiresAt]
    );

    // Send via emailService if email is provided
    if (email) {
      if (otpPurpose === 'verify') {
        await emailService.sendVerificationOtp(email, realOtp);
      } else if (otpPurpose === 'reset') {
        await emailService.sendResetOtp(email, realOtp);
      }
    }

    // Return the OTP in the response for debugging/UI test box
    sendJson(response, 200, {
      message: 'OTP generated successfully.',
      otp: realOtp,
      expires_at: expiresAt
    });
  } catch (error) {
    sendJson(response, 500, { error: error.message });
  }
}

/**
 * POST /api/auth/verify-otp
 */
async function handleVerifyOtp(request, response) {
  try {
    const body = await readBody(request);
    const { email, phone_number, otp_code, purpose } = body;
    const otpPurpose = purpose || 'verify';

    if (!otp_code || (!email && !phone_number)) {
      return sendJson(response, 400, { error: 'otp_code and email/phone_number are required.' });
    }

    // Find the user
    let user;
    if (email) {
      const [users] = await database.query('SELECT id FROM users WHERE email = ?', [email]);
      user = users[0];
    } else {
      const [users] = await database.query('SELECT id FROM users WHERE phone_number = ?', [phone_number]);
      user = users[0];
    }

    if (!user) {
      return sendJson(response, 404, { error: 'User not found.' });
    }

    const now = new Date();
    // Retrieve latest unused, non-expired OTP for this user
    const [otps] = await database.query(
      'SELECT * FROM otp_verifications WHERE user_id = ? AND otp_code = ? AND purpose = ? AND is_used = 0 AND expires_at > ?',
      [user.id, otp_code, otpPurpose, now]
    );
    const otpRecord = otps[0];

    if (!otpRecord) {
      return sendJson(response, 400, { error: 'Invalid or expired OTP.' });
    }

    // Mark OTP as used
    await database.query('UPDATE otp_verifications SET is_used = 1 WHERE id = ?', [otpRecord.id]);

    // If verification is for signup/general email verification, mark user as verified
    if (otpPurpose === 'verify') {
      await database.query('UPDATE users SET is_verified = 1 WHERE id = ?', [user.id]);
      
      // If the user has a creator role, automatically insert them into the creators table
      const [fullUserRecords] = await database.query('SELECT name, email, role FROM users WHERE id = ?', [user.id]);
      const fullUser = fullUserRecords[0];
      if (fullUser && fullUser.role === 'creator') {
        await database.query(
          'INSERT INTO creators (name, email) VALUES (?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name)',
          [fullUser.name, fullUser.email]
        );
      }
    }

    // If verification is for login, generate JWT and create session
    if (otpPurpose === 'login') {
      const [users] = await database.query('SELECT * FROM users WHERE id = ?', [user.id]);
      const fullUser = users[0];
      const { ip, device } = getClientMeta(request);
      
      const token = jwt.sign({ id: fullUser.id, email: fullUser.email, role: fullUser.role }, JWT_SECRET, { expiresIn: '24h' });
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await database.query(
        'INSERT INTO sessions (user_id, token, device_info, ip_address, expires_at) VALUES (?, ?, ?, ?, ?)',
        [fullUser.id, token, device, ip, expiresAt]
      );

      await database.query(
        'INSERT INTO login_activity (user_id, ip_address, device_info, status) VALUES (?, ?, ?, ?)',
        [fullUser.id, ip, device, 'success']
      );

      await database.query('UPDATE users SET last_login = ? WHERE id = ?', [new Date(), fullUser.id]);

      return sendJson(response, 200, {
        message: 'OTP verified. Login successful.',
        token,
        user: {
          id: fullUser.id,
          name: fullUser.name,
          email: fullUser.email,
          phone_number: fullUser.phone_number,
          role: fullUser.role,
          profile_picture: fullUser.profile_picture
        }
      });
    }

    sendJson(response, 200, { message: 'OTP verified successfully.' });
  } catch (error) {
    sendJson(response, 500, { error: error.message });
  }
}

/**
 * POST /api/auth/refresh-token
 */
async function handleRefreshToken(request, response) {
  try {
    if (!request.sessionToken || !request.user) {
      return sendJson(response, 401, { error: 'Unauthorized.' });
    }

    const now = new Date();
    const token = jwt.sign({ id: request.user.id, email: request.user.email, role: request.user.role }, JWT_SECRET, { expiresIn: '24h' });
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Update session table with the new token and new expiry
    await database.query(
      'UPDATE sessions SET token = ?, expires_at = ? WHERE id = ?',
      [token, expiresAt, request.sessionId]
    );

    sendJson(response, 200, {
      message: 'Token refreshed.',
      token
    });
  } catch (error) {
    sendJson(response, 500, { error: error.message });
  }
}

/**
 * GET /api/user/profile
 */
async function handleGetProfile(request, response) {
  if (!request.user) {
    return sendJson(response, 401, { error: 'Unauthorized.' });
  }
  sendJson(response, 200, { user: request.user });
}

/**
 * PUT /api/user/profile
 */
async function handleUpdateProfile(request, response) {
  try {
    if (!request.user) {
      return sendJson(response, 401, { error: 'Unauthorized.' });
    }

    const body = await readBody(request);
    const { name, email, phone_number, profile_picture } = body;

    if (!name || !email) {
      return sendJson(response, 400, { error: 'Name and email are required.' });
    }

    // Check if new email conflicts with another user
    const [conflicts] = await database.query('SELECT id FROM users WHERE email = ? AND id != ?', [email, request.user.id]);
    const conflict = conflicts[0];
    if (conflict) {
      return sendJson(response, 409, { error: 'Email is already taken by another user.' });
    }

    await database.query(
      'UPDATE users SET name = ?, email = ?, phone_number = ?, profile_picture = ?, updated_at = ? WHERE id = ?',
      [name, email, phone_number || null, profile_picture || null, new Date(), request.user.id]
    );

    sendJson(response, 200, {
      message: 'Profile updated successfully.',
      user: { id: request.user.id, name, email, phone_number, profile_picture, role: request.user.role }
    });
  } catch (error) {
    sendJson(response, 500, { error: error.message });
  }
}

/**
 * PUT /api/user/change-password
 */
async function handleChangePassword(request, response) {
  try {
    if (!request.user) {
      return sendJson(response, 401, { error: 'Unauthorized.' });
    }

    const body = await readBody(request);
    const { current_password, new_password } = body;

    if (!current_password || !new_password) {
      return sendJson(response, 400, { error: 'current_password and new_password are required.' });
    }

    // Fetch user password hash
    const [users] = await database.query('SELECT password FROM users WHERE id = ?', [request.user.id]);
    const user = users[0];

    const match = bcrypt.compareSync(current_password, user.password);
    if (!match) {
      return sendJson(response, 400, { error: 'Incorrect current password.' });
    }

    const newHash = bcrypt.hashSync(new_password, 10);
    await database.query('UPDATE users SET password = ?, updated_at = ? WHERE id = ?', [newHash, new Date(), request.user.id]);

    sendJson(response, 200, { message: 'Password updated successfully.' });
  } catch (error) {
    sendJson(response, 500, { error: error.message });
  }
}

/**
 * GET /api/user/dashboard
 */
async function handleGetDashboard(request, response) {
  try {
    if (!request.user) {
      return sendJson(response, 401, { error: 'Unauthorized.' });
    }

    // Retrieve recent login activity
    const [activity] = await database.query(
      'SELECT id, ip_address, device_info, status, created_at FROM login_activity WHERE user_id = ? ORDER BY id DESC LIMIT 10',
      [request.user.id]
    );

    sendJson(response, 200, {
      user: request.user,
      recent_activity: activity
    });
  } catch (error) {
    sendJson(response, 500, { error: error.message });
  }
}

/**
 * GET /api/user/sessions
 */
async function handleGetSessions(request, response) {
  try {
    if (!request.user) {
      return sendJson(response, 401, { error: 'Unauthorized.' });
    }

    const [sessions] = await database.query(
      'SELECT id, device_info, ip_address, is_active, expires_at, created_at FROM sessions WHERE user_id = ? AND is_active = 1 ORDER BY id DESC',
      [request.user.id]
    );

    sendJson(response, 200, { sessions });
  } catch (error) {
    sendJson(response, 500, { error: error.message });
  }
}

/**
 * DELETE /api/user/sessions/:id
 */
async function handleRevokeSession(request, response, sessionId) {
  try {
    if (!request.user) {
      return sendJson(response, 401, { error: 'Unauthorized.' });
    }

    const sId = Number(sessionId);
    if (isNaN(sId)) {
      return sendJson(response, 400, { error: 'Invalid session ID.' });
    }

    // Invalidate the session (make sure it belongs to the user)
    const [result] = await database.query(
      'UPDATE sessions SET is_active = 0 WHERE id = ? AND user_id = ?',
      [sId, request.user.id]
    );

    if (result.affectedRows === 0) {
      return sendJson(response, 404, { error: 'Session not found or already inactive.' });
    }

    sendJson(response, 200, { message: 'Session revoked successfully.' });
  } catch (error) {
    sendJson(response, 500, { error: error.message });
  }
}

/**
 * GET /api/admin/users
 */
async function handleAdminListUsers(request, response) {
  try {
    if (!request.user || request.user.role !== 'admin') {
      return sendJson(response, 403, { error: 'Forbidden. Admin privileges required.' });
    }

    const [users] = await database.query(
      'SELECT id, name, email, phone_number, role, is_verified, last_login, created_at FROM users ORDER BY id DESC'
    );

    sendJson(response, 200, { users });
  } catch (error) {
    sendJson(response, 500, { error: error.message });
  }
}

/**
 * DELETE /api/admin/users/:id
 */
async function handleAdminDeleteUser(request, response, userId) {
  try {
    if (!request.user || request.user.role !== 'admin') {
      return sendJson(response, 403, { error: 'Forbidden. Admin privileges required.' });
    }

    const targetUserId = Number(userId);
    if (isNaN(targetUserId)) {
      return sendJson(response, 400, { error: 'Invalid user ID.' });
    }

    const [result] = await database.query('DELETE FROM users WHERE id = ?', [targetUserId]);
    if (result.affectedRows === 0) {
      return sendJson(response, 404, { error: 'User not found.' });
    }

    sendJson(response, 200, { message: 'User account deleted successfully.' });
  } catch (error) {
    sendJson(response, 500, { error: error.message });
  }
}

/**
 * PUT /api/admin/users/:id/role
 */
async function handleAdminChangeRole(request, response, userId) {
  try {
    if (!request.user || request.user.role !== 'admin') {
      return sendJson(response, 403, { error: 'Forbidden. Admin privileges required.' });
    }

    const targetUserId = Number(userId);
    if (isNaN(targetUserId)) {
      return sendJson(response, 400, { error: 'Invalid user ID.' });
    }

    const body = await readBody(request);
    const { role } = body;

    if (!role || (role !== 'user' && role !== 'admin')) {
      return sendJson(response, 400, { error: "Role must be either 'user' or 'admin'." });
    }

    const [result] = await database.query('UPDATE users SET role = ?, updated_at = ? WHERE id = ?', [role, new Date(), targetUserId]);

    if (result.affectedRows === 0) {
      return sendJson(response, 404, { error: 'User not found.' });
    }

    sendJson(response, 200, { message: `User role changed to ${role} successfully.` });
  } catch (error) {
    sendJson(response, 500, { error: error.message });
  }
}

async function handleResetPassword(request, response) {
  try {
    const body = await readBody(request);
    const { email, otp_code, new_password } = body;

    if (!email || !otp_code || !new_password) {
      return sendJson(response, 400, { error: 'email, otp_code, and new_password are required.' });
    }

    // Find user
    const [users] = await database.query('SELECT id FROM users WHERE email = ?', [email]);
    const user = users[0];
    if (!user) {
      return sendJson(response, 404, { error: 'User not found.' });
    }

    const now = new Date();
    // Retrieve latest unused, non-expired OTP for this user for purpose 'reset'
    const [otps] = await database.query(
      "SELECT * FROM otp_verifications WHERE user_id = ? AND otp_code = ? AND purpose = 'reset' AND is_used = 0 AND expires_at > ?",
      [user.id, otp_code, now]
    );
    const otpRecord = otps[0];

    if (!otpRecord) {
      return sendJson(response, 400, { error: 'Invalid or expired reset OTP.' });
    }

    // Hash and update password, then mark OTP as used
    const newHash = bcrypt.hashSync(new_password, 10);
    await database.query('UPDATE otp_verifications SET is_used = 1 WHERE id = ?', [otpRecord.id]);
    await database.query('UPDATE users SET password = ?, updated_at = ? WHERE id = ?', [newHash, new Date(), user.id]);

    sendJson(response, 200, { message: 'Password reset successfully. You can now log in with your new password.' });
  } catch (error) {
    sendJson(response, 500, { error: error.message });
  }
}

/**
 * POST /api/auth/social-login
 */
async function handleSocialLogin(request, response) {
  let userIdForLog = null;
  const { ip, device } = getClientMeta(request);

  try {
    const body = await readBody(request);
    const { email, name, google_id, profile_picture } = body;

    if (!email || !google_id) {
      return sendJson(response, 400, { error: 'Email and google_id are required.' });
    }

    // Check if user already exists
    let [users] = await database.query('SELECT * FROM users WHERE google_id = ? OR email = ?', [google_id, email]);
    let user = users[0];

    if (!user) {
      // Create user
      const [result] = await database.query(
        'INSERT INTO users (name, email, is_google_user, google_id, profile_picture, is_verified) VALUES (?, ?, 1, ?, ?, 1)',
        [name || 'Google User', email, google_id, profile_picture || null]
      );
      const userId = result.insertId;
      const [newUsers] = await database.query('SELECT * FROM users WHERE id = ?', [userId]);
      user = newUsers[0];
    } else {
      // User exists, but make sure the google_id is linked if it wasn't
      if (!user.google_id) {
        await database.query('UPDATE users SET is_google_user = 1, google_id = ?, profile_picture = COALESCE(profile_picture, ?) WHERE id = ?', [google_id, profile_picture || null, user.id]);
        user.is_google_user = 1;
        user.google_id = google_id;
        if (profile_picture && !user.profile_picture) user.profile_picture = profile_picture;
      }
    }

    userIdForLog = user.id;

    // Success - Create JWT & Session
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Store session in DB
    await database.query(
      'INSERT INTO sessions (user_id, token, device_info, ip_address, expires_at) VALUES (?, ?, ?, ?, ?)',
      [user.id, token, device, ip, expiresAt]
    );

    // Record login activity
    await database.query(
      'INSERT INTO login_activity (user_id, ip_address, device_info, status) VALUES (?, ?, ?, ?)',
      [user.id, ip, device, 'success']
    );

    // Update last login timestamp
    await database.query('UPDATE users SET last_login = ? WHERE id = ?', [new Date(), user.id]);

    sendJson(response, 200, {
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone_number: user.phone_number,
        role: user.role,
        profile_picture: user.profile_picture
      }
    });
  } catch (error) {
    if (userIdForLog) {
      await database.query(
        'INSERT INTO login_activity (user_id, ip_address, device_info, status) VALUES (?, ?, ?, ?)',
        [userIdForLog, ip, device, 'failed']
      );
    }
    sendJson(response, 500, { error: error.message });
  }
}

module.exports = {
  sendJson,
  handleRegister,
  handleLogin,
  handleLogout,
  handleSendOtp,
  handleVerifyOtp,
  handleResetPassword,
  handleRefreshToken,
  handleGetProfile,
  handleUpdateProfile,
  handleChangePassword,
  handleGetDashboard,
  handleGetSessions,
  handleRevokeSession,
  handleAdminListUsers,
  handleAdminDeleteUser,
  handleAdminChangeRole,
  handleSocialLogin
};

/**
 * POST /api/auth/forgot-password
 * Requests a secure password reset link
 */
async function handleForgotPasswordLink(request, response) {
  try {
    const body = await readBody(request);
    const { email } = body;

    if (!email) {
      return sendJson(response, 400, { error: 'Email is required.' });
    }

    // Verify user exists
    const [users] = await database.query('SELECT id FROM users WHERE email = ?', [email]);
    const user = users[0];
    if (!user) {
      return sendJson(response, 404, { error: 'User with this email not found.' });
    }

    // Generate secure 32-byte hexadecimal token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry

    // Delete any existing reset tokens for this user
    await database.query('DELETE FROM password_reset_tokens WHERE user_id = ?', [user.id]);

    // Save in DB
    await database.query(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
      [user.id, token, expiresAt]
    );

    // Construct frontend reset link
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${baseUrl}/reset-password?token=${token}`;

    // Send email
    await emailService.sendResetLink(email, resetLink);

    sendJson(response, 200, {
      message: 'Password reset link sent to your email.',
      token: token // also return token for local debugging/testing box
    });
  } catch (error) {
    sendJson(response, 500, { error: error.message });
  }
}

/**
 * GET /api/auth/verify-reset-token
 */
async function handleVerifyResetToken(request, response) {
  try {
    // Parse query params from request URL
    const url = new URL(request.url, `http://${request.headers.host}`);
    const token = url.searchParams.get('token');

    if (!token) {
      return sendJson(response, 400, { error: 'Token is required.' });
    }

    const now = new Date();
    // Retrieve token from DB
    const [tokens] = await database.query(
      'SELECT * FROM password_reset_tokens WHERE token = ? AND expires_at > ?',
      [token, now]
    );
    const tokenRecord = tokens[0];

    if (!tokenRecord) {
      return sendJson(response, 400, { error: 'Invalid or expired token.' });
    }

    sendJson(response, 200, { success: true, message: 'Token is valid.' });
  } catch (error) {
    sendJson(response, 500, { error: error.message });
  }
}

/**
 * POST /api/auth/reset-password-with-token
 */
async function handleResetPasswordWithToken(request, response) {
  try {
    const body = await readBody(request);
    const { token, new_password } = body;

    if (!token || !new_password) {
      return sendJson(response, 400, { error: 'token and new_password are required.' });
    }

    const now = new Date();
    // Validate token record
    const [tokens] = await database.query(
      'SELECT * FROM password_reset_tokens WHERE token = ? AND expires_at > ?',
      [token, now]
    );
    const tokenRecord = tokens[0];

    if (!tokenRecord) {
      return sendJson(response, 400, { error: 'Invalid or expired token.' });
    }

    // Hash new password and update user record
    const newHash = bcrypt.hashSync(new_password, 10);
    await database.query('UPDATE users SET password = ?, updated_at = ? WHERE id = ?', [newHash, new Date(), tokenRecord.user_id]);

    // Delete used token
    await database.query('DELETE FROM password_reset_tokens WHERE id = ?', [tokenRecord.id]);

    // Delete any active sessions for security to force re-login
    await database.query('UPDATE sessions SET is_active = 0 WHERE user_id = ?', [tokenRecord.user_id]);

    sendJson(response, 200, { message: 'Password reset successfully. You can now log in.' });
  } catch (error) {
    sendJson(response, 500, { error: error.message });
  }
}

module.exports = {
  sendJson,
  handleRegister,
  handleLogin,
  handleLogout,
  handleSendOtp,
  handleVerifyOtp,
  handleResetPassword,
  handleRefreshToken,
  handleGetProfile,
  handleUpdateProfile,
  handleChangePassword,
  handleGetDashboard,
  handleGetSessions,
  handleRevokeSession,
  handleAdminListUsers,
  handleAdminDeleteUser,
  handleAdminChangeRole,
  handleSocialLogin,
  handleForgotPasswordLink,
  handleVerifyResetToken,
  handleResetPasswordWithToken
};
