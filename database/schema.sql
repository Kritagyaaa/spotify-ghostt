CREATE TABLE IF NOT EXISTS music_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  uploaded_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS songs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  artist_name TEXT NOT NULL,
  album_name TEXT,
  duration INTEGER,
  genre TEXT,
  cover_url TEXT,
  music_file_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (music_file_id) REFERENCES music_files (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS playlists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS playlist_songs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  playlist_id INTEGER NOT NULL,
  song_id INTEGER NOT NULL,
  position INTEGER DEFAULT 0,
  FOREIGN KEY (playlist_id) REFERENCES playlists (id) ON DELETE CASCADE,
  FOREIGN KEY (song_id) REFERENCES songs (id) ON DELETE CASCADE
);

-- Seed Data (using INSERT OR IGNORE to allow safe multiple executions)
INSERT OR IGNORE INTO music_files (id, file_name, file_url, file_type, file_size, uploaded_by) VALUES
(1, 'midnight_city.mp3', 'http://example.com/midnight_city.mp3', 'audio/mpeg', 9600000, 'admin'),
(2, 'kids.mp3', 'http://example.com/kids.mp3', 'audio/mpeg', 11000000, 'admin');

INSERT OR IGNORE INTO songs (id, title, artist_name, album_name, duration, genre, cover_url, music_file_id) VALUES
(1, 'Midnight City', 'M83', 'Hurry Up, We''re Dreaming', 243, 'Synth-pop', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=90', 1),
(2, 'Kids', 'MGMT', 'Oracular Spectacular', 302, 'Indie Pop', 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=90', 2);

INSERT OR IGNORE INTO playlists (id, user_id, name, description, cover_url) VALUES
(1, 'user_01', 'Today''s Top Hits', 'The biggest hits right now.', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=90'),
(2, 'user_01', 'Indie Classics', 'Essential indie and alternative tracks.', 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=90');

INSERT OR IGNORE INTO playlist_songs (id, playlist_id, song_id, position) VALUES
(1, 1, 1, 1),
(2, 1, 2, 2),
(3, 2, 2, 1);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone_number TEXT,
  password TEXT,
  profile_picture TEXT,
  role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin')),
  is_verified BOOLEAN DEFAULT 0,
  is_google_user BOOLEAN DEFAULT 0,
  google_id TEXT,
  last_login DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token TEXT NOT NULL,
  device_info TEXT,
  ip_address TEXT,
  is_active BOOLEAN DEFAULT 1,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS login_activity (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  ip_address TEXT,
  device_info TEXT,
  status TEXT CHECK(status IN ('success', 'failed')) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS otp_verifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  otp_code TEXT NOT NULL,
  purpose TEXT CHECK(purpose IN ('login', 'reset', 'verify')) NOT NULL,
  is_used BOOLEAN DEFAULT 0,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token TEXT NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

