// require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

// Import Routes
const songRoutes = require("./routes/songRoutes");

// Middleware
app.use(cors());
app.use(express.json());

// Health Check
app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "Spotify Backend Running"
    });
});

// Register Routes
app.use("/api/songs", songRoutes);

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route Not Found"
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});