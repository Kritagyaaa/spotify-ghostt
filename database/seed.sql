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

 SELECT id, title, b2_key
FROM songs;
UPDATE songs
SET b2_key = CONCAT(id, '.mp3');