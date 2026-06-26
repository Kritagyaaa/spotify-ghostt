// backend/view-db.js

const pool = require('./db');

async function viewDatabase() {
  try {
    const tables = [
      'artists',
      'albums',
      'genres',
      'songs',
      'playlists',
      'playlist_songs',
      'likes',
      'history',
      'creators'
    ];

    for (const table of tables) {
      console.log(`\n========== ${table.toUpperCase()} ==========\n`);

      const [rows] = await pool.query(
        `SELECT * FROM ${table}`
      );

      console.table(rows);
    }

  } catch (error) {
    console.error(error);
  } finally {
    process.exit();
  }
}

viewDatabase();