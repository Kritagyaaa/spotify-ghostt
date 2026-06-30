const path = require("path");
require("dotenv").config({
    path: path.join(__dirname, ".env"),
});

const { authenticateRequest } = require('./authMiddleware');
const auth = require('./authController');

const express = require("express");
const cors = require("cors");

const app = express();

// Debug (Temporary - remove after testing)
console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_PORT:", process.env.DB_PORT);
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_NAME:", process.env.DB_NAME);

// Import Routes
const songRoutes = require("./routes/songRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");
const playlistRoutes = require("./routes/playlistRoutes");

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Health Check
app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "Spotify Backend Running"
    });
});

// Express middleware to authenticate requests using the existing authenticateRequest helper
const expressAuth = async (req, res, next) => {
    try {
        await authenticateRequest(req);
        next();
    } catch (error) {
        res.status(error.statusCode || 401).json({ error: error.message });
    }
};

// ==================== AUTH & USER ROUTES ====================
app.post("/api/auth/register", (req, res) => auth.handleRegister(req, res));
app.post("/api/auth/login", (req, res) => auth.handleLogin(req, res));
app.post("/api/auth/social-login", (req, res) => auth.handleSocialLogin(req, res));
app.post("/api/auth/logout", expressAuth, (req, res) => auth.handleLogout(req, res));
app.post("/api/auth/send-otp", (req, res) => auth.handleSendOtp(req, res));
app.post("/api/auth/verify-otp", (req, res) => auth.handleVerifyOtp(req, res));
app.post("/api/auth/reset-password", (req, res) => auth.handleResetPassword(req, res));
app.post("/api/auth/forgot-password", (req, res) => auth.handleForgotPasswordLink(req, res));
app.get("/api/auth/verify-reset-token", (req, res) => auth.handleVerifyResetToken(req, res));
app.post("/api/auth/reset-password-with-token", (req, res) => auth.handleResetPasswordWithToken(req, res));
app.post("/api/auth/refresh-token", expressAuth, (req, res) => auth.handleRefreshToken(req, res));

app.get("/api/user/profile", expressAuth, (req, res) => auth.handleGetProfile(req, res));
app.put("/api/user/profile", expressAuth, (req, res) => auth.handleUpdateProfile(req, res));
app.put("/api/user/change-password", expressAuth, (req, res) => auth.handleChangePassword(req, res));
app.get("/api/user/dashboard", expressAuth, (req, res) => auth.handleGetDashboard(req, res));
app.get("/api/user/sessions", expressAuth, (req, res) => auth.handleGetSessions(req, res));
app.delete("/api/user/sessions/:sessionId", expressAuth, (req, res) => auth.handleRevokeSession(req, res, req.params.sessionId));

// ==================== ADMIN ROUTES ====================
app.get("/api/admin/users", expressAuth, (req, res) => auth.handleAdminListUsers(req, res));
app.delete("/api/admin/users/:userId", expressAuth, (req, res) => auth.handleAdminDeleteUser(req, res, req.params.userId));
app.put("/api/admin/users/:userId/role", expressAuth, (req, res) => auth.handleAdminChangeRole(req, res, req.params.userId));

// Register Routes
app.use("/api/songs", songRoutes);
app.use("/api/recommend", recommendationRoutes);
app.use("/api/playlists", playlistRoutes);

// ==================== BROWSE GENRES & CREATORS ====================
app.get("/api/genres", async (req, res) => {
    try {
        const pool = require("./db");
        const [genres] = await pool.query("SELECT * FROM genres ORDER BY name ASC");
        res.json({ success: true, genres });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Failed to fetch genres" });
    }
});

app.get("/api/artists", async (req, res) => {
    try {
        const pool = require("./db");
        const [artists] = await pool.query("SELECT * FROM artists ORDER BY name ASC");
        res.json({ success: true, artists });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Failed to fetch creators" });
    }
});
// Database Viewer (HTML)
app.get("/db-viewer", async (req, res) => {
    const pool = require("./db");
    try {
        const tables = [
            'users', 'sessions', 'login_activity', 'otp_verifications',
            'artists', 'albums', 'genres', 'songs', 'playlists', 'playlist_songs',
            'likes', 'history', 'creators'
        ];
        
        let html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Database Viewer</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #121212; color: #fff; margin: 20px; }
                h1 { color: #1db954; }
                h2 { border-bottom: 1px solid #282828; padding-bottom: 10px; margin-top: 40px; color: #b3b3b3; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; background: #181818; }
                th, td { padding: 12px; text-align: left; border: 1px solid #282828; font-size: 14px; }
                th { background: #282828; color: #fff; font-weight: bold; }
                tr:nth-child(even) { background: #1a1a1a; }
                tr:hover { background: #2a2a2a; }
                pre { margin: 0; white-space: pre-wrap; font-family: monospace; }
                .badge { background: #1db954; color: #000; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold; }
            </style>
        </head>
        <body>
            <h1>Spotify Clone - Database Table Viewer</h1>
            <p>Showing current records in MySQL database: <strong>spotify_clone</strong></p>
        `;

        for (const table of tables) {
            html += `<h2>Table: ${table.toUpperCase()}</h2>`;
            const [rows] = await pool.query(`SELECT * FROM ${table}`);
            if (rows.length === 0) {
                html += `<p style="color: #888; font-style: italic;">No records found in this table.</p>`;
                continue;
            }

            const headers = Object.keys(rows[0]);
            html += `<table><thead><tr>`;
            for (const h of headers) {
                html += `<th>${h}</th>`;
            }
            html += `</tr></thead><tbody>`;

            for (const row of rows) {
                html += `<tr>`;
                for (const h of headers) {
                    let val = row[h];
                    if (val instanceof Date) {
                        val = val.toISOString();
                    } else if (typeof val === 'object' && val !== null) {
                        val = JSON.stringify(val);
                    } else if (val === null || val === undefined) {
                        val = '<span style="color: #555; font-style: italic;">NULL</span>';
                    } else if (typeof val === 'string' && val.length > 100) {
                        val = `<pre>${val.substring(0, 100)}...</pre>`;
                    } else if (h === 'is_google_user' && val === 1) {
                        val = `<span class="badge">Google User</span>`;
                    }
                    html += `<td>${val}</td>`;
                }
                html += `</tr>`;
            }
            html += `</tbody></table>`;
        }

        html += `</body></html>`;
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
    } catch (error) {
        res.status(500).send(`<h1>Database Error</h1><pre>${error.message}</pre>`);
    }
});

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