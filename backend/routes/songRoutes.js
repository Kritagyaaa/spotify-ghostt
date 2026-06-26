const express = require("express");
const router = express.Router();

const {
    getAllSongs,
    searchSongs,
    streamSong,
} = require("../controllers/songController");

/* ==========================
   GET ALL SONGS
========================== */

router.get("/", getAllSongs);

/* ==========================
   SEARCH SONGS
========================== */
/*
Example:
GET /api/songs/search?q=thriller
*/
router.get("/search", searchSongs);

/* ==========================
   STREAM SONG
========================== */

router.get("/:id/stream", streamSong);

module.exports = router;