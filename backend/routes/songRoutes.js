const express = require("express");
const router = express.Router();
const { authenticateRequest } = require("../authMiddleware");

const {
    getAllSongs,
    searchSongs,
    streamSong,
    toggleLikeSong,
} = require("../controllers/songController");
const expressAuth = async (req, res, next) => {
    try {
        await authenticateRequest(req);
        next();
    } catch (error) {
        res.status(error.statusCode || 401).json({ error: error.message });
    }
};
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
router.post("/:id/like", expressAuth, toggleLikeSong);

module.exports = router;