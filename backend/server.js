const http = require('node:http');
const { URL } = require('node:url');
const { createDatabase } = require('./db');
const { authenticateRequest } = require('./authMiddleware');
const auth = require('./authController');

const database = createDatabase();

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  });
  response.end(JSON.stringify(payload));
}

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

function listSongs() {
  return database
    .prepare(
      `SELECT
        songs.id,
        songs.title,
        songs.artist_name,
        songs.album_name,
        songs.duration,
        songs.genre,
        songs.cover_url,
        songs.created_at,
        music_files.file_name,
        music_files.file_url,
        music_files.file_type,
        music_files.file_size,
        music_files.uploaded_by
      FROM songs
      JOIN music_files ON music_files.id = songs.music_file_id
      ORDER BY songs.id DESC`,
    )
    .all();
}

function listPlaylists() {
  return database
    .prepare(
      `SELECT
        playlists.id,
        playlists.user_id,
        playlists.name,
        playlists.description,
        playlists.cover_url,
        playlists.created_at,
        COUNT(playlist_songs.id) AS song_count
      FROM playlists
      LEFT JOIN playlist_songs ON playlist_songs.playlist_id = playlists.id
      GROUP BY playlists.id
      ORDER BY playlists.id DESC`,
    )
    .all();
}

function createSong(payload) {
  const insertMusicFile = database.prepare(
    'INSERT INTO music_files (file_name, file_url, file_type, file_size, uploaded_by) VALUES (?, ?, ?, ?, ?)',
  );
  const insertSong = database.prepare(
    'INSERT INTO songs (title, artist_name, album_name, duration, genre, cover_url, music_file_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
  );

  database.exec('BEGIN');

  try {
    const musicFileResult = insertMusicFile.run(
      payload.file_name,
      payload.file_url,
      payload.file_type,
      payload.file_size ?? null,
      payload.uploaded_by ?? null,
    );

    const songResult = insertSong.run(
      payload.title,
      payload.artist_name,
      payload.album_name ?? null,
      payload.duration ?? null,
      payload.genre ?? null,
      payload.cover_url ?? null,
      musicFileResult.lastInsertRowid,
    );

    database.exec('COMMIT');

    return { songId: songResult.lastInsertRowid, musicFileId: musicFileResult.lastInsertRowid };
  } catch (error) {
    database.exec('ROLLBACK');
    throw error;
  }
}

function createPlaylist(payload) {
  const result = database
    .prepare('INSERT INTO playlists (user_id, name, description, cover_url) VALUES (?, ?, ?, ?)')
    .run(payload.user_id ?? null, payload.name, payload.description ?? null, payload.cover_url ?? null);

  return { id: result.lastInsertRowid, user_id: payload.user_id ?? null, name: payload.name, description: payload.description ?? null, cover_url: payload.cover_url ?? null };
}

function addSongToPlaylist(playlistId, payload) {
  const result = database
    .prepare('INSERT INTO playlist_songs (playlist_id, song_id, position) VALUES (?, ?, ?)')
    .run(playlistId, payload.song_id, payload.position ?? 0);

  return { id: result.lastInsertRowid, playlist_id: playlistId, song_id: payload.song_id, position: payload.position ?? 0 };
}

// Helper for routes requiring token authentication
async function withAuth(request, response, handler, ...args) {
  try {
    await authenticateRequest(request);
    await handler(request, response, ...args);
  } catch (error) {
    sendJson(response, error.statusCode || 401, { error: error.message });
  }
}

const server = http.createServer(async (request, response) => {
  const requestUrl = new URL(request.url, 'http://localhost');

  if (request.method === 'OPTIONS') {
    sendJson(response, 204, {});
    return;
  }

  // ==================== AUTH & USER ROUTES ====================

  if (request.method === 'POST' && requestUrl.pathname === '/api/auth/register') {
    await auth.handleRegister(request, response);
    return;
  }

  if (request.method === 'POST' && requestUrl.pathname === '/api/auth/login') {
    await auth.handleLogin(request, response);
    return;
  }

  if (request.method === 'POST' && requestUrl.pathname === '/api/auth/logout') {
    await withAuth(request, response, auth.handleLogout);
    return;
  }

  if (request.method === 'POST' && requestUrl.pathname === '/api/auth/send-otp') {
    await auth.handleSendOtp(request, response);
    return;
  }

  if (request.method === 'POST' && requestUrl.pathname === '/api/auth/verify-otp') {
    await auth.handleVerifyOtp(request, response);
    return;
  }

  if (request.method === 'POST' && requestUrl.pathname === '/api/auth/reset-password') {
    await auth.handleResetPassword(request, response);
    return;
  }

  if (request.method === 'POST' && requestUrl.pathname === '/api/auth/refresh-token') {
    await withAuth(request, response, auth.handleRefreshToken);
    return;
  }

  if (request.method === 'GET' && requestUrl.pathname === '/api/user/profile') {
    await withAuth(request, response, auth.handleGetProfile);
    return;
  }

  if (request.method === 'PUT' && requestUrl.pathname === '/api/user/profile') {
    await withAuth(request, response, auth.handleUpdateProfile);
    return;
  }

  if (request.method === 'PUT' && requestUrl.pathname === '/api/user/change-password') {
    await withAuth(request, response, auth.handleChangePassword);
    return;
  }

  if (request.method === 'GET' && requestUrl.pathname === '/api/user/dashboard') {
    await withAuth(request, response, auth.handleGetDashboard);
    return;
  }

  if (request.method === 'GET' && requestUrl.pathname === '/api/user/sessions') {
    await withAuth(request, response, auth.handleGetSessions);
    return;
  }

  if (request.method === 'DELETE' && requestUrl.pathname.startsWith('/api/user/sessions/')) {
    const sessionId = requestUrl.pathname.split('/').pop();
    await withAuth(request, response, auth.handleRevokeSession, sessionId);
    return;
  }

  // ==================== ADMIN ROUTES ====================

  if (request.method === 'GET' && requestUrl.pathname === '/api/admin/users') {
    await withAuth(request, response, auth.handleAdminListUsers);
    return;
  }

  if (request.method === 'DELETE' && requestUrl.pathname.startsWith('/api/admin/users/')) {
    const userId = requestUrl.pathname.split('/').pop();
    await withAuth(request, response, auth.handleAdminDeleteUser, userId);
    return;
  }

  if (request.method === 'PUT' && requestUrl.pathname.startsWith('/api/admin/users/') && requestUrl.pathname.endsWith('/role')) {
    const pathParts = requestUrl.pathname.split('/');
    const userId = pathParts[4];
    await withAuth(request, response, auth.handleAdminChangeRole, userId);
    return;
  }

  // ==================== ORIGINAL MUSIC/PLAYLIST ROUTES ====================

  if (request.method === 'GET' && requestUrl.pathname === '/api/health') {
    sendJson(response, 200, { ok: true });
    return;
  }

  if (request.method === 'GET' && requestUrl.pathname === '/api/songs') {
    sendJson(response, 200, listSongs());
    return;
  }

  if (request.method === 'GET' && requestUrl.pathname === '/api/playlists') {
    sendJson(response, 200, listPlaylists());
    return;
  }

  if (request.method === 'POST' && requestUrl.pathname === '/api/songs') {
    try {
      const body = await readBody(request);
      const { title, artist_name, file_name, file_url, file_type } = body;

      if (!title || !artist_name || !file_name || !file_url || !file_type) {
        sendJson(response, 400, { error: 'Missing required song fields.' });
        return;
      }

      const created = createSong(body);
      sendJson(response, 201, created);
    } catch (error) {
      sendJson(response, 400, { error: 'Invalid JSON body.' });
    }
    return;
  }

  if (request.method === 'POST' && requestUrl.pathname === '/api/playlists') {
    try {
      const body = await readBody(request);

      if (!body.name) {
        sendJson(response, 400, { error: 'Playlist name is required.' });
        return;
      }

      sendJson(response, 201, createPlaylist(body));
    } catch (error) {
      sendJson(response, 400, { error: 'Invalid JSON body.' });
    }
    return;
  }

  if (request.method === 'POST' && requestUrl.pathname.startsWith('/api/playlists/') && requestUrl.pathname.endsWith('/songs')) {
    try {
      const playlistId = Number(requestUrl.pathname.split('/')[3]);
      const body = await readBody(request);

      if (!playlistId || !body.song_id) {
        sendJson(response, 400, { error: 'playlistId and song_id are required.' });
        return;
      }

      sendJson(response, 201, addSongToPlaylist(playlistId, body));
    } catch (error) {
      sendJson(response, 400, { error: 'Invalid JSON body.' });
    }
    return;
  }

  sendJson(response, 404, { error: 'Not found' });
});

const port = process.env.PORT || 3001;

server.listen(port, () => {
  console.log(`API server running on http://localhost:${port}`);
});
