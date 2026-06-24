-- =========================
-- CREATORS
-- =========================

CREATE TABLE creators (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    profile_image VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- ARTISTS
-- =========================

CREATE TABLE artists (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    bio TEXT,
    cover_url VARCHAR(500),
    cover_public_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- ALBUMS
-- =========================

CREATE TABLE albums (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    artist_id INT NOT NULL,
    cover_url VARCHAR(500),
    cover_public_id VARCHAR(255),
    release_date DATE,

    FOREIGN KEY (artist_id)
        REFERENCES artists(id)
        ON DELETE CASCADE
);

-- =========================
-- GENRES
-- =========================

CREATE TABLE genres (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

-- =========================
-- SONGS
-- =========================

CREATE TABLE songs (
    id INT AUTO_INCREMENT PRIMARY KEY,

    title VARCHAR(255) NOT NULL,

    artist_id INT NOT NULL,

    album_id INT,

    genre_id INT,

    duration INT,

    b2_key VARCHAR(500) NOT NULL,

    cover_url VARCHAR(500),
    cover_public_id VARCHAR(255),

    uploaded_by INT,

    play_count INT DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (artist_id)
        REFERENCES artists(id),

    FOREIGN KEY (album_id)
        REFERENCES albums(id),

    FOREIGN KEY (genre_id)
        REFERENCES genres(id),

    FOREIGN KEY (uploaded_by)
        REFERENCES creators(id));

CREATE INDEX idx_song_title ON songs(title);

-- =========================
-- PLAYLISTS
-- =========================

CREATE TABLE playlists (
    id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL,

    name VARCHAR(255) NOT NULL,

    description TEXT,

    cover_url VARCHAR(500),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- PLAYLIST SONGS
-- =========================

CREATE TABLE playlist_songs (
    id INT AUTO_INCREMENT PRIMARY KEY,

    playlist_id INT NOT NULL,

    song_id INT NOT NULL,

    position INT DEFAULT 0,

    FOREIGN KEY (playlist_id)
        REFERENCES playlists(id)
        ON DELETE CASCADE,

    FOREIGN KEY (song_id)
        REFERENCES songs(id)
        ON DELETE CASCADE,

    UNIQUE(playlist_id, song_id)
);

-- =========================
-- LIKES
-- =========================

CREATE TABLE likes (
    id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL,

    song_id INT NOT NULL,

    liked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (song_id)
        REFERENCES songs(id)
        ON DELETE CASCADE,

    UNIQUE(user_id, song_id)
);

-- =========================
-- HISTORY
-- =========================

CREATE TABLE history (
    id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL,

    song_id INT NOT NULL,

    played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (song_id)
        REFERENCES songs(id)
        ON DELETE CASCADE
);
CREATE INDEX idx_song_artist ON songs(artist_id);

CREATE INDEX idx_song_album ON songs(album_id);

CREATE INDEX idx_song_genre ON songs(genre_id);

CREATE INDEX idx_song_playcount ON songs(play_count);