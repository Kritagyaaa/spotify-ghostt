const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { createDatabase } = require('./db');
const { JWT_SECRET } = require('./authMiddleware');

const database = createDatabase();

// Helper to read JSON request body
function readBody(request) {
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
    const { name, email, phone_number, password } = body;

    if (!name || !email || !password) {
      return sendJson(response, 400, { error: 'Name, email, and password are required.' });
    }

    // Check if email already registered
    const existing = database.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return sendJson(response, 409, { error: 'Email already registered.' });
    }

    // Hash the password
    const passwordHash = bcrypt.hashSync(password, 10);

    // Save user - default is_verified to 1 for now since email verification is deferred
    const result = database.prepare(
      'INSERT INTO users (name, email, phone_number, password, is_verified) VALUES (?, ?, ?, ?, 1)'
    ).run(name, email, phone_number || null, passwordHash);

    const userId = result.lastInsertRowid;

    sendJson(response, 201, {
      message: 'User registered successfully.',
      user: { id: userId, name, email, phone_number }
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
    const user = database.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      // Record failed activity
      database.prepare(
        'INSERT INTO login_activity (user_id, ip_address, device_info, status) VALUES (NULL, ?, ?, ?)'
      ).run(ip, device, 'failed');
      return sendJson(response, 401, { error: 'Invalid email or password.' });
    }

    userIdForLog = user.id;

    // Verify password
    const match = bcrypt.compareSync(password, user.password);
    if (!match) {
      database.prepare(
        'INSERT INTO login_activity (user_id, ip_address, device_info, status) VALUES (?, ?, ?, ?)'
      ).run(userIdForLog, ip, device, 'failed');
      return sendJson(response, 401, { error: 'Invalid email or password.' });
    }

    // Success - Create JWT & Session
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // Store session in DB
    database.prepare(
      'INSERT INTO sessions (user_id, token, device_info, ip_address, expires_at) VALUES (?, ?, ?, ?, ?)'
    ).run(user.id, token, device, ip, expiresAt);

    // Record login activity
    database.prepare(
      'INSERT INTO login_activity (user_id, ip_address, device_info, status) VALUES (?, ?, ?, ?)'
    ).run(user.id, ip, device, 'success');

    // Update last login timestamp
    database.prepare('UPDATE users SET last_login = ? WHERE id = ?').run(new Date().toISOString(), user.id);

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
      database.prepare(
        'INSERT INTO login_activity (user_id, ip_address, device_info, status) VALUES (?, ?, ?, ?)'
      ).run(userIdForLog, ip, device, 'failed');
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
    database.prepare('UPDATE sessions SET is_active = 0 WHERE token = ?').run(request.sessionToken);

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
      user = database.prepare('SELECT id FROM users WHERE email = ?').get(email);
    } else {
      user = database.prepare('SELECT id FROM users WHERE phone_number = ?').get(phone_number);
    }

    if (!user) {
      return sendJson(response, 404, { error: 'User not found.' });
    }

    // Generate dummy OTP (constant or standard sequence for local validation)
    const dummyOtp = '123456';
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes expiry

    // Mark previous OTPs of this purpose for this user as used
    database.prepare('UPDATE otp_verifications SET is_used = 1 WHERE user_id = ? AND purpose = ?')
      .run(user.id, otpPurpose);

    // Save in DB
    database.prepare(
      'INSERT INTO otp_verifications (user_id, otp_code, purpose, expires_at) VALUES (?, ?, ?, ?)'
    ).run(user.id, dummyOtp, otpPurpose, expiresAt);

    // Return the dummy OTP directly in the response so the UI can display it
    sendJson(response, 200, {
      message: 'OTP generated successfully.',
      otp: dummyOtp,
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
      user = database.prepare('SELECT id FROM users WHERE email = ?').get(email);
    } else {
      user = database.prepare('SELECT id FROM users WHERE phone_number = ?').get(phone_number);
    }

    if (!user) {
      return sendJson(response, 404, { error: 'User not found.' });
    }

    const now = new Date().toISOString();
    // Retrieve latest unused, non-expired OTP for this user
    const otpRecord = database.prepare(
      'SELECT * FROM otp_verifications WHERE user_id = ? AND otp_code = ? AND purpose = ? AND is_used = 0 AND expires_at > ?'
    ).get(user.id, otp_code, otpPurpose, now);

    if (!otpRecord) {
      return sendJson(response, 400, { error: 'Invalid or expired OTP.' });
    }

    // Mark OTP as used
    database.prepare('UPDATE otp_verifications SET is_used = 1 WHERE id = ?').run(otpRecord.id);

    // If verification is for login, generate JWT and create session
    if (otpPurpose === 'login') {
      const fullUser = database.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
      const { ip, device } = getClientMeta(request);
      
      const token = jwt.sign({ id: fullUser.id, email: fullUser.email, role: fullUser.role }, JWT_SECRET, { expiresIn: '24h' });
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      database.prepare(
        'INSERT INTO sessions (user_id, token, device_info, ip_address, expires_at) VALUES (?, ?, ?, ?, ?)'
      ).run(fullUser.id, token, device, ip, expiresAt);

      database.prepare(
        'INSERT INTO login_activity (user_id, ip_address, device_info, status) VALUES (?, ?, ?, ?)'
      ).run(fullUser.id, ip, device, 'success');

      database.prepare('UPDATE users SET last_login = ? WHERE id = ?').run(new Date().toISOString(), fullUser.id);

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
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

    // Update session table with the new token and new expiry
    database.prepare(
      'UPDATE sessions SET token = ?, expires_at = ? WHERE id = ?'
    ).run(token, expiresAt, request.sessionId);

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
    const conflict = database.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email, request.user.id);
    if (conflict) {
      return sendJson(response, 409, { error: 'Email is already taken by another user.' });
    }

    database.prepare(
      'UPDATE users SET name = ?, email = ?, phone_number = ?, profile_picture = ?, updated_at = ? WHERE id = ?'
    ).run(name, email, phone_number || null, profile_picture || null, new Date().toISOString(), request.user.id);

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
    const user = database.prepare('SELECT password FROM users WHERE id = ?').get(request.user.id);

    const match = bcrypt.compareSync(current_password, user.password);
    if (!match) {
      return sendJson(response, 400, { error: 'Incorrect current password.' });
    }

    const newHash = bcrypt.hashSync(new_password, 10);
    database.prepare('UPDATE users SET password = ?, updated_at = ? WHERE id = ?')
      .run(newHash, new Date().toISOString(), request.user.id);

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
    const activity = database.prepare(
      'SELECT id, ip_address, device_info, status, created_at FROM login_activity WHERE user_id = ? ORDER BY id DESC LIMIT 10'
    ).all(request.user.id);

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

    const sessions = database.prepare(
      'SELECT id, device_info, ip_address, is_active, expires_at, created_at FROM sessions WHERE user_id = ? AND is_active = 1 ORDER BY id DESC'
    ).all(request.user.id);

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
    const result = database.prepare(
      'UPDATE sessions SET is_active = 0 WHERE id = ? AND user_id = ?'
    ).run(sId, request.user.id);

    if (result.changes === 0) {
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

    const users = database.prepare(
      'SELECT id, name, email, phone_number, role, is_verified, last_login, created_at FROM users ORDER BY id DESC'
    ).all();

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

    const result = database.prepare('DELETE FROM users WHERE id = ?').run(targetUserId);
    if (result.changes === 0) {
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

    const result = database.prepare('UPDATE users SET role = ?, updated_at = ? WHERE id = ?')
      .run(role, new Date().toISOString(), targetUserId);

    if (result.changes === 0) {
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
    const user = database.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (!user) {
      return sendJson(response, 404, { error: 'User not found.' });
    }

    const now = new Date().toISOString();
    // Retrieve latest unused, non-expired OTP for this user for purpose 'reset'
    const otpRecord = database.prepare(
      "SELECT * FROM otp_verifications WHERE user_id = ? AND otp_code = ? AND purpose = 'reset' AND is_used = 0 AND expires_at > ?"
    ).get(user.id, otp_code, now);

    if (!otpRecord) {
      return sendJson(response, 400, { error: 'Invalid or expired reset OTP.' });
    }

    // Hash and update password, then mark OTP as used
    const newHash = bcrypt.hashSync(new_password, 10);
    database.prepare('UPDATE otp_verifications SET is_used = 1 WHERE id = ?').run(otpRecord.id);
    database.prepare('UPDATE users SET password = ?, updated_at = ? WHERE id = ?')
      .run(newHash, new Date().toISOString(), user.id);

    sendJson(response, 200, { message: 'Password reset successfully. You can now log in with your new password.' });
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
  handleAdminChangeRole
};
