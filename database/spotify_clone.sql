CREATE DATABASE IF NOT EXISTS spotify_clone;

USE spotify_clone;

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
-- =====================================
-- SEED DATA
-- =====================================

-- Disable FK checks temporarily
SET FOREIGN_KEY_CHECKS = 0;

DELETE FROM history;
DELETE FROM likes;
DELETE FROM playlist_songs;
DELETE FROM playlists;
DELETE FROM songs;
DELETE FROM albums;
DELETE FROM genres;
DELETE FROM artists;
DELETE FROM creators;

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================
-- CREATOR
-- =====================================

INSERT INTO creators (
    id,
    name,
    email
)
VALUES
(
    1,
    'Admin',
    'admin@spotifyghost.com'
);

-- =====================================
-- ARTIST
-- =====================================

INSERT INTO artists (
    id,
    name,
    bio
)
VALUES
(
    1,
    'Michael Jackson',
    'King of Pop'
);

-- =====================================
-- GENRE
-- =====================================

INSERT INTO genres (
    id,
    name
)
VALUES
(
    1,
    'Pop'
);

-- =====================================
-- ALBUM
-- =====================================

INSERT INTO albums (
    id,
    title,
    artist_id
)
VALUES
(
    1,
    'Michael Jackson Collection',
    1
);

-- =====================================
-- SONGS
-- =====================================

INSERT INTO songs
(
    title,
    artist_id,
    album_id,
    genre_id,
    duration,
    b2_key,
    uploaded_by,
    play_count
)
VALUES

(
'Billie Jean',
1,
1,
1,
294,
'songs/01. [Spoticatch] Billie Jean - Michael Jackson.mp3',
1,
0
),

(
'Smooth Criminal',
1,
1,
1,
257,
'songs/02. [Spoticatch] Smooth Criminal - 2012 Remaster.mp3',
1,
0
),

(
'Don''t Stop ''Til You Get Enough',
1,
1,
1,
366,
'songs/03. [Spoticatch] Don''t Stop ''Til You Get Enough - Michael Jackson.mp3',
1,
0
),

(
'Dirty Diana',
1,
1,
1,
282,
'songs/04. [Spoticatch] Dirty Diana - 2012 Remaster - Michael Jackson.mp3',
1,
0
),

(
'Human Nature',
1,
1,
1,
245,
'songs/05. [Spoticatch] Human Nature - Michael Jackson.mp3',
1,
0
),

(
'Thriller',
1,
1,
1,
358,
'songs/06. [Spoticatch] Thriller - Michael Jackson.mp3',
1,
0
),

(
'Wanna Be Startin'' Somethin''',
1,
1,
1,
362,
'songs/07. [Spoticatch] Wanna Be Startin'' Somethin'' - Michael Jackson.mp3',
1,
0
),

(
'Liberian Girl',
1,
1,
1,
231,
'songs/08. [Spoticatch] Liberian Girl - 2012 Remastered Version.mp3',
1,
0
),

(
'Smooth Criminal (Version 2)',
1,
1,
1,
257,
'songs/09. [Spoticatch] Smooth Criminal - 2012 Remaster.mp3',
1,
0
),

(
'Bad',
1,
1,
1,
247,
'songs/10. [Spoticatch] Bad - 2012 Remaster - Michael Jackson.mp3',
1,
0
),

(
'Man in the Mirror',
1,
1,
1,
320,
'songs/11. [Spoticatch] Man in the Mirror - 2012 Remaster.mp3',
1,
0
),

(
'Who Is It',
1,
1,
1,
391,
'songs/12. [Spoticatch] Who Is It - Michael Jackson.mp3',
1,
0
);

-- =====================================
-- VERIFY
-- =====================================

SELECT COUNT(*) AS artists FROM artists;
SELECT COUNT(*) AS albums FROM albums;
SELECT COUNT(*) AS genres FROM genres;
SELECT COUNT(*) AS songs FROM songs;