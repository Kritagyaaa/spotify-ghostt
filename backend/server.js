const path = require("path");
const { authenticateRequest } = require('./authMiddleware');
const auth = require('./authController');

require("dotenv").config({
    path: path.join(__dirname, ".env"),
});

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

// Middleware
app.use(cors());
app.use(express.json());

// Health Check
app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "Spotify Backend Running"
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
app.post("/api/auth/logout", expressAuth, (req, res) => auth.handleLogout(req, res));
app.post("/api/auth/send-otp", (req, res) => auth.handleSendOtp(req, res));
app.post("/api/auth/verify-otp", (req, res) => auth.handleVerifyOtp(req, res));
app.post("/api/auth/reset-password", (req, res) => auth.handleResetPassword(req, res));
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