const jwt = require('jsonwebtoken');
const { createDatabase } = require('./db');

const database = createDatabase();
const JWT_SECRET = process.env.JWT_SECRET || 'meowsick-secret-key-123';

/**
 * Verifies JWT token from request header and validates active session in DB.
 * Modifies the request object by attaching `user`, `sessionToken`, and `sessionId`.
 * 
 * @param {import('node:http').IncomingMessage} request 
 * @throws {Error} if unauthorized
 */
async function authenticateRequest(request) {
  const authHeader = request.headers['authorization'];
  if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
    const error = new Error('Unauthorized: Missing or invalid token format.');
    error.statusCode = 401;
    throw error;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Verify session in the database is active and has not expired
    const now = new Date().toISOString();
    const session = database
      .prepare('SELECT * FROM sessions WHERE token = ? AND is_active = 1 AND expires_at > ?')
      .get(token, now);

    if (!session) {
      const error = new Error('Unauthorized: Session has expired or is inactive.');
      error.statusCode = 401;
      throw error;
    }

    // Retrieve user profile details (excluding password)
    const user = database
      .prepare('SELECT id, name, email, phone_number, role, profile_picture FROM users WHERE id = ?')
      .get(session.user_id);

    if (!user) {
      const error = new Error('Unauthorized: User not found.');
      error.statusCode = 401;
      throw error;
    }

    // Attach verified user and session metadata to request
    request.user = user;
    request.sessionToken = token;
    request.sessionId = session.id;

    return user;
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 401;
    }
    throw error;
  }
}

module.exports = { authenticateRequest, JWT_SECRET };
