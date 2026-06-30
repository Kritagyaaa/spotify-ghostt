const express = require('express');
const router = express.Router();
const b2Service = require('../services/b2service');

// Public file proxy: GET /files/<key...>
// Use `use` to avoid path-to-regexp parsing issues and capture all methods/paths under /files
router.use(async (req, res) => {
  try {
    // req.path inside this router is the path under /files, e.g. '/creators/1/song.mp3'
    const key = req.path.replace(/^\//, '');
    const obj = await b2Service.getObject(key);
    const stream = obj.Body;

    if (obj.ContentType) res.setHeader('Content-Type', obj.ContentType);
    if (obj.ContentLength) res.setHeader('Content-Length', obj.ContentLength);
    res.setHeader('Cache-Control', 'public, max-age=31536000');

    // Pipe the S3/B2 stream to client
    stream.pipe(res);
  } catch (err) {
    console.error('Error streaming file', err);
    if (err && err.$metadata && err.$metadata.httpStatusCode === 404) {
      return res.status(404).send('Not found');
    }
    res.status(500).send('Error fetching file');
  }
});

module.exports = router;
