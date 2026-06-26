const express = require("express");
const router = express.Router();

const {
    getAllSongs,
    streamSong,
} = require("../controllers/songController");

router.get("/", getAllSongs);

// NEW
router.get("/:id/stream", streamSong);

module.exports = router;