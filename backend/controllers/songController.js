const pool = require("../db");
const b2Service = require("../services/b2Service");

/* ==========================
   GET ALL SONGS
========================== */

async function getAllSongs(req, res) {
    try {

        const [songs] = await pool.query(`
            SELECT
                s.id,
                s.title,
                a.name AS artist,
                a.bio AS artist_bio,
                a.cover_url AS artist_image,
                al.title AS album,
                g.name AS genre,
                s.duration,
                s.b2_key,
                s.cover_url,
                s.play_count,
                s.created_at
            FROM songs s
            LEFT JOIN artists a
                ON s.artist_id = a.id
            LEFT JOIN albums al
                ON s.album_id = al.id
            LEFT JOIN genres g
                ON s.genre_id = g.id
            ORDER BY s.id DESC
        `);

        res.status(200).json({
            success: true,
            count: songs.length,
            songs,
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });

    }
}

/* ==========================
   SEARCH SONGS
========================== */

async function searchSongs(req, res) {

    console.log("========== SEARCH REQUEST ==========");
    console.log("Query:", req.query.q);

    try {

        const query = req.query.q;

        if (!query || query.trim() === "") {
            return res.json({
                success: true,
                songs: [],
            });
        }

        const keyword = `%${query}%`;

        console.log("Running SQL...");

        const [songs] = await pool.query(
            `
            SELECT
                s.id,
                s.title,
                a.name AS artist,
                a.bio AS artist_bio,
                a.cover_url AS artist_image,
                al.title AS album,
                g.name AS genre,
                s.duration,
                s.b2_key,
                s.cover_url,
                s.play_count,
                s.created_at
            FROM songs s

            LEFT JOIN artists a
                ON s.artist_id = a.id

            LEFT JOIN albums al
                ON s.album_id = al.id

            LEFT JOIN genres g
                ON s.genre_id = g.id

            WHERE
                s.title LIKE ?
                OR a.name LIKE ?
                OR al.title LIKE ?

            ORDER BY s.title ASC
            `,
            [
                keyword,
                keyword,
                keyword,
            ]
        );

        console.log("Search Success!");
        console.log("Songs Found:", songs.length);

        res.json({
            success: true,
            count: songs.length,
            songs,
        });

    } catch (error) {

        console.log("========== SEARCH ERROR ==========");
        console.error(error);

        res.status(500).json({
            success: false,
            message: error.message,
            errorCode: error.code,
            sqlMessage: error.sqlMessage,
        });

    }
}

/* ==========================
   STREAM SONG
========================== */

async function streamSong(req, res) {

    try {

        const { id } = req.params;

        const [songs] = await pool.query(
            `
            SELECT
                id,
                title,
                b2_key
            FROM songs
            WHERE id = ?
            `,
            [id]
        );

        if (songs.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Song not found",
            });
        }

        const streamUrl =
            await b2Service.getSignedStreamUrl(
                songs[0].b2_key
            );

        res.json({
            success: true,
            songId: songs[0].id,
            title: songs[0].title,
            streamUrl,
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Unable to stream song",
        });

    }
}

module.exports = {
    getAllSongs,
    searchSongs,
    streamSong,
};