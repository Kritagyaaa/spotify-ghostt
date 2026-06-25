const pool = require("../db");

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
    songs
});

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Internal Server Error",
    });

  }
}

module.exports = {
    getAllSongs,
};