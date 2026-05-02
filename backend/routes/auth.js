const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
// Import the standardized middleware file
const auth = require("../middleware/authMiddleware");
// Import the centralized role checking utility
const checkRole = require("../middleware/checkRole");

const router = express.Router();

/**
 * ✅ REGISTER
 * - All new users are automatically created as "student".
 */
router.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body; // Role is no longer accepted from req.body

        if (!name || !email || !password) {
            return res.status(400).json({ message: "Missing fields" });
        }

        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(400).json({ message: "User already exists" });
        }

        const hashed = await bcrypt.hash(password, 10);
        
        // Role is hardcoded to "student" for all new sign-ups
        const u = new User({ name, email, password: hashed, role: 'student' }); 
        
        await u.save();

        res.json({ message: "User registered successfully" });
    } catch (err) {
        console.error("Registration error:", err);
        res.status(500).json({ error: 'Server error during registration.' });
    }
});

/**
 * ✅ LOGIN
 * - Checks credentials
 * - Issues JWT token with role
 */
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Missing email or password" });
        }

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "Invalid credentials" });

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return res.status(400).json({ message: "Invalid credentials" });

        // === Daily Streak Logic ===
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let streakData = { ...user.streak };
        
        if (user.streak && user.streak.lastLoginDate) {
            const lastLogin = new Date(user.streak.lastLoginDate);
            lastLogin.setHours(0, 0, 0, 0);
            
            const daysDiff = Math.floor((today - lastLogin) / (1000 * 60 * 60 * 24));
            
            if (daysDiff === 1) {
                // Consecutive day - increase streak
                streakData.currentStreak = (user.streak.currentStreak || 0) + 1;
            } else if (daysDiff > 1) {
                // Missed days - reset streak
                streakData.currentStreak = 1;
            }
            // daysDiff === 0 means same day, keep streak
        } else {
            // First login or no streak data
            streakData.currentStreak = 1;
        }
        
        streakData.lastLoginDate = new Date();
        streakData.longestStreak = Math.max(streakData.longestStreak || 0, streakData.currentStreak);
        
        // Add to login history (keep last 30 days)
        streakData.loginHistory = [...(user.streak?.loginHistory || []), new Date()].slice(-30);
        
        // Update user with streak data
        user.streak = streakData;
        await user.save();
        // === End Streak Logic ===

        const token = jwt.sign(
            { id: user._id, role: user.role, name: user.name },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({ token, role: user.role, name: user.name, streak: streakData });
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ error: 'Server error during login.' });
    }
});

/**
 * ✅ GET PROFILE (Protected)
 * - Fetch logged-in user details
 */
router.get("/profile", auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.json(user);
    } catch (err) {
        console.error("Profile fetch error:", err);
        res.status(500).json({ error: 'Server error while fetching profile.' });
    }
});

/**
 * ✅ UPDATE PROFILE (Protected)
 * - Updates name, email, avatar for the logged-in user
 */
router.put("/profile", auth, async (req, res) => {
    try {
        const { name, email, avatar } = req.body;

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Basic validation check if email is changed and already exists (excluding self)
        if (email && email !== user.email) {
            const existing = await User.findOne({ email });
            if (existing) {
                return res.status(400).json({ message: "This email is already in use." });
            }
        }

        user.name = name || user.name;
        user.email = email || user.email;
        user.avatar = avatar; // Allow setting avatar to null

        await user.save();

        res.json({ message: "Profile updated successfully" });
    } catch (err) {
        console.error("Profile update error:", err);
        res.status(500).json({ error: 'Server error while updating profile.' });
    }
});

/**
 * ✅ LOGOUT
 * - Clears the authentication cookie (Client-side token clearing is also necessary)
 */
router.post('/logout', (req, res) => {
    // Note: This only clears a potential server-side cookie. 
    // The main token stored in localStorage (used by the API client) must be cleared client-side.
    res.status(200).json({ message: 'Logout successful' });
});

/**
 * ✅ GET STREAK DATA
 * - Returns current streak information
 */
router.get("/streak", auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("streak");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json(user.streak || { currentStreak: 0, longestStreak: 0 });
    } catch (err) {
        console.error("Streak fetch error:", err);
        res.status(500).json({ error: "Server error while fetching streak" });
    }
});

/**
 * ✅ TEACHER ONLY route example
 * - Demonstrates centralized role-based access
 */
// Use checkRole(['teacher', 'admin']) for flexibility
router.get("/teacher-data", auth, checkRole(['teacher', 'admin']), async (req, res) => {
    // Local role check removed
    res.json({ message: "Welcome teacher, here is your secure data 📚 (Accessed via checkRole)" });
});

/**
 * ✅ STUDENT ONLY route example
 * - Demonstrates centralized role-based access
 */
// Use checkRole(['student'])
router.get("/student-data", auth, checkRole(['student']), async (req, res) => {
    // Local role check removed
    res.json({ message: "Welcome student, keep learning 🌱 (Accessed via checkRole)" });
});

module.exports = router;