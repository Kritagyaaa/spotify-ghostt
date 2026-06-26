const pool = require("../db");
const b2Service = require("../services/b2Service");

async function getAllSongs(req, res) {
    try {

        const [songs] = await pool.query(`
            SELECT
                s.id,
                s.title,
                a.name AS artist,
                al.title AS album,
                g.name AS genre,
                s.duration,
                s.b2_key,
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
            message: "Internal Server Error",
        });

    }
}

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
    streamSong,
};