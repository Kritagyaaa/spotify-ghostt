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
-- ARTISTS
-- =====================================

INSERT INTO artists (id, name, bio, cover_url) VALUES
(1, 'Michael Jackson', 'King of Pop', 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Michael_Jackson_1983_%283x4_cropped%29_%28contrast%29.jpg/500px-Michael_Jackson_1983_%283x4_cropped%29_%28contrast%29.jpg'),
(2, 'Guns N'' Roses', 'American hard rock band from Los Angeles', 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/GNR_Belgrade_2025_05_%28cropped%29.jpg/500px-GNR_Belgrade_2025_05_%28cropped%29.jpg'),
(3, 'The Beatles', 'Legendary British rock band from Liverpool', 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/The_Beatles_1963_Dezo_Hoffman_Capitol_Records_press_photo_2.jpg/500px-The_Beatles_1963_Dezo_Hoffman_Capitol_Records_press_photo_2.jpg'),
(4, 'Yo Yo Honey Singh', 'Indian rapper, singer and music producer', 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Yo_Yo_Honey_Singh_%282014%29_04.jpg/500px-Yo_Yo_Honey_Singh_%282014%29_04.jpg'),
(5, 'Lady Gaga', 'American singer, songwriter and actress', 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Lady_Gaga_at_Joe_Biden%27s_inauguration_%28cropped_5%29.jpg/500px-Lady_Gaga_at_Joe_Biden%27s_inauguration_%28cropped_5%29.jpg'),
(6, 'Frank Sinatra', 'Iconic American singer and actor', 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Frank_Sinatra_1961.jpg/500px-Frank_Sinatra_1961.jpg'),
(7, 'Miles Davis', 'American jazz trumpeter and composer', 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Miles_Davis_1987.png/500px-Miles_Davis_1987.png');

-- =====================================
-- GENRES
-- =====================================

INSERT INTO genres (id, name) VALUES
(1, 'Pop'),
(2, 'Rock'),
(3, 'Folk'),
(4, 'Hip Hop'),
(5, 'Country'),
(6, 'Jazz');

-- =====================================
-- ALBUMS
-- =====================================

INSERT INTO albums (id, title, artist_id) VALUES
(1, 'Michael Jackson Collection', 1),
(2, 'Appetite For Destruction', 2),
(3, 'Use Your Illusion I', 2),
(4, 'Abbey Road (Remastered)', 3),
(5, 'The Beatles (Remastered)', 3),
(6, 'Rubber Soul (Remastered 2009)', 3),
(7, 'Help! (Remastered)', 3),
(8, 'Blue Eyes', 4),
(9, 'International Villager', 4),
(10, 'The Fame Monster (Deluxe Edition)', 5),
(11, 'The Fame', 5),
(12, 'Joanne (Deluxe)', 5),
(13, 'Come Dance With Me! (Remastered)', 6),
(14, 'BD Music Presents Kind of Blue', 7),
(15, 'Nothing But The Best (2008 Remastered)', 6),
(16, 'Desi Kalakaar', 4);

-- =====================================
-- SONGS (Existing: IDs 1-12, Michael Jackson)
-- =====================================

INSERT INTO songs (id, title, artist_id, album_id, genre_id, duration, b2_key, uploaded_by, play_count, like_count, cover_url) VALUES
(1, 'Billie Jean', 1, 1, 1, 294, '1.mp3', 1, 0, 0, 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Michael_Jackson_1983_%283x4_cropped%29_%28contrast%29.jpg/500px-Michael_Jackson_1983_%283x4_cropped%29_%28contrast%29.jpg'),
(2, 'Smooth Criminal', 1, 1, 1, 257, '2.mp3', 1, 0, 0, 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Michael_Jackson_1983_%283x4_cropped%29_%28contrast%29.jpg/500px-Michael_Jackson_1983_%283x4_cropped%29_%28contrast%29.jpg'),
(3, 'Don''t Stop ''Til You Get Enough', 1, 1, 1, 366, '3.mp3', 1, 0, 0, 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Michael_Jackson_1983_%283x4_cropped%29_%28contrast%29.jpg/500px-Michael_Jackson_1983_%283x4_cropped%29_%28contrast%29.jpg'),
(4, 'Dirty Diana', 1, 1, 1, 282, '4.mp3', 1, 0, 0, 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Michael_Jackson_1983_%283x4_cropped%29_%28contrast%29.jpg/500px-Michael_Jackson_1983_%283x4_cropped%29_%28contrast%29.jpg'),
(5, 'Human Nature', 1, 1, 1, 245, '5.mp3', 1, 0, 0, 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Michael_Jackson_1983_%283x4_cropped%29_%28contrast%29.jpg/500px-Michael_Jackson_1983_%283x4_cropped%29_%28contrast%29.jpg'),
(6, 'Thriller', 1, 1, 1, 358, '6.mp3', 1, 0, 0, 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Michael_Jackson_1983_%283x4_cropped%29_%28contrast%29.jpg/500px-Michael_Jackson_1983_%283x4_cropped%29_%28contrast%29.jpg'),
(7, 'Wanna Be Startin'' Somethin''', 1, 1, 1, 362, '7.mp3', 1, 0, 0, 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Michael_Jackson_1983_%283x4_cropped%29_%28contrast%29.jpg/500px-Michael_Jackson_1983_%283x4_cropped%29_%28contrast%29.jpg'),
(8, 'Liberian Girl', 1, 1, 1, 231, '8.mp3', 1, 0, 0, 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Michael_Jackson_1983_%283x4_cropped%29_%28contrast%29.jpg/500px-Michael_Jackson_1983_%283x4_cropped%29_%28contrast%29.jpg'),
(9, 'Smooth Criminal (Version 2)', 1, 1, 1, 257, '9.mp3', 1, 0, 0, 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Michael_Jackson_1983_%283x4_cropped%29_%28contrast%29.jpg/500px-Michael_Jackson_1983_%283x4_cropped%29_%28contrast%29.jpg'),
(10, 'Bad', 1, 1, 1, 247, '10.mp3', 1, 0, 0, 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Michael_Jackson_1983_%283x4_cropped%29_%28contrast%29.jpg/500px-Michael_Jackson_1983_%283x4_cropped%29_%28contrast%29.jpg'),
(11, 'Man in the Mirror', 1, 1, 1, 320, '11.mp3', 1, 0, 0, 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Michael_Jackson_1983_%283x4_cropped%29_%28contrast%29.jpg/500px-Michael_Jackson_1983_%283x4_cropped%29_%28contrast%29.jpg'),
(12, 'Who Is It', 1, 1, 1, 391, '12.mp3', 1, 0, 0, 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Michael_Jackson_1983_%283x4_cropped%29_%28contrast%29.jpg/500px-Michael_Jackson_1983_%283x4_cropped%29_%28contrast%29.jpg'),
(13, 'Sweet Child O'' Mine', 2, 2, 2, 356, '13.mp3', 1, 0, 0, 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/GNR_Belgrade_2025_05_%28cropped%29.jpg/500px-GNR_Belgrade_2025_05_%28cropped%29.jpg'),
(14, 'November Rain', 2, 3, 2, 536, '14.mp3', 1, 0, 0, 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/GNR_Belgrade_2025_05_%28cropped%29.jpg/500px-GNR_Belgrade_2025_05_%28cropped%29.jpg'),
(15, 'Come Together - Remastered 2009', 3, 4, 2, 259, '15.mp3', 1, 0, 0, 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/The_Beatles_1963_Dezo_Hoffman_Capitol_Records_press_photo_2.jpg/500px-The_Beatles_1963_Dezo_Hoffman_Capitol_Records_press_photo_2.jpg'),
(16, 'Revolution 1 - Remastered 2009', 3, 5, 2, 255, '16.mp3', 1, 0, 0, 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/The_Beatles_1963_Dezo_Hoffman_Capitol_Records_press_photo_2.jpg/500px-The_Beatles_1963_Dezo_Hoffman_Capitol_Records_press_photo_2.jpg'),
(17, 'Norwegian Wood (This Bird Has Flown)', 3, 6, 3, 124, '17.mp3', 1, 0, 0, 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/The_Beatles_1963_Dezo_Hoffman_Capitol_Records_press_photo_2.jpg/500px-The_Beatles_1963_Dezo_Hoffman_Capitol_Records_press_photo_2.jpg'),
(18, 'Blackbird - Remastered 2009', 3, 5, 3, 138, '18.mp3', 1, 0, 0, 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/The_Beatles_1963_Dezo_Hoffman_Capitol_Records_press_photo_2.jpg/500px-The_Beatles_1963_Dezo_Hoffman_Capitol_Records_press_photo_2.jpg'),
(19, 'You''ve Got To Hide Your Love Away', 3, 7, 3, 129, '19.mp3', 1, 0, 0, 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/The_Beatles_1963_Dezo_Hoffman_Capitol_Records_press_photo_2.jpg/500px-The_Beatles_1963_Dezo_Hoffman_Capitol_Records_press_photo_2.jpg'),
(20, 'Blue Eyes', 4, 8, 4, 220, '20.mp3', 1, 0, 0, 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Yo_Yo_Honey_Singh_%282014%29_04.jpg/500px-Yo_Yo_Honey_Singh_%282014%29_04.jpg'),
(21, 'Brown Rang', 4, 9, 4, 179, '21.mp3', 1, 0, 0, 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Yo_Yo_Honey_Singh_%282014%29_04.jpg/500px-Yo_Yo_Honey_Singh_%282014%29_04.jpg'),
(22, 'Angreji Beat', 4, 9, 4, 256, '22.mp3', 1, 2, 0, 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Yo_Yo_Honey_Singh_%282014%29_04.jpg/500px-Yo_Yo_Honey_Singh_%282014%29_04.jpg'),
(23, 'Bad Romance', 5, 10, 1, 294, '23.mp3', 1, 0, 0, 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Lady_Gaga_at_Joe_Biden%27s_inauguration_%28cropped_5%29.jpg/500px-Lady_Gaga_at_Joe_Biden%27s_inauguration_%28cropped_5%29.jpg'),
(24, 'Poker Face', 5, 11, 1, 237, '24.mp3', 1, 0, 0, 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Lady_Gaga_at_Joe_Biden%27s_inauguration_%28cropped_5%29.jpg/500px-Lady_Gaga_at_Joe_Biden%27s_inauguration_%28cropped_5%29.jpg'),
(25, 'Just Dance', 5, 11, 1, 241, '25.mp3', 1, 0, 0, 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Lady_Gaga_at_Joe_Biden%27s_inauguration_%28cropped_5%29.jpg/500px-Lady_Gaga_at_Joe_Biden%27s_inauguration_%28cropped_5%29.jpg'),
(26, 'Million Reasons', 5, 12, 5, 205, '26.mp3', 1, 0, 0, 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Lady_Gaga_at_Joe_Biden%27s_inauguration_%28cropped_5%29.jpg/500px-Lady_Gaga_at_Joe_Biden%27s_inauguration_%28cropped_5%29.jpg'),
(27, 'Cheek To Cheek - 1998 Remastered', 6, 13, 6, 186, '27.mp3', 1, 0, 0, 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Frank_Sinatra_1961.jpg/500px-Frank_Sinatra_1961.jpg'),
(28, 'So What', 7, 14, 6, 565, '28.mp3', 1, 0, 0, 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Miles_Davis_1987.png/500px-Miles_Davis_1987.png'),
(29, 'Fly Me To The Moon - 2008 Remastered', 6, 15, 6, 147, '29.mp3', 1, 2, 0, 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Frank_Sinatra_1961.jpg/500px-Frank_Sinatra_1961.jpg'),
(30, 'Love Dose', 4, 16, 4, 224, '30.mp3', 1, 1, 0, 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Yo_Yo_Honey_Singh_%282014%29_04.jpg/500px-Yo_Yo_Honey_Singh_%282014%29_04.jpg');

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

ALTER TABLE artists
ADD COLUMN cover_url VARCHAR(500);

ALTER TABLE songs
ADD COLUMN cover_url VARCHAR(500),
ADD COLUMN like_count INT DEFAULT 0;

