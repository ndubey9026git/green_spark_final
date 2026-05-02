/**
 * Route file for Admin-specific API endpoints.
 * All routes require authentication and the 'admin' role.
 */
const express = require('express');
const router = express.Router();
// Use the standardized auth middleware
const auth = require('../middleware/authMiddleware'); 
// Import the centralized role checking utility
const checkRole = require('../middleware/checkRole'); 
const User = require('../models/User');
const Challenge = require('../models/Challenge');
const Game = require('../models/Game');
const bcrypt = require("bcryptjs"); 

// Define the required roles for Admin routes
const ADMIN_ONLY = ['admin'];

// We no longer need the local 'isAdmin' function thanks to checkRole(ADMIN_ONLY).

// =======================
//  USER MANAGEMENT
// =======================
/**
 * @route   GET /api/admin/users
 * @desc    Get all users (Admins only)
 * @access  Private
 */
router.get('/users', auth, checkRole(ADMIN_ONLY), async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.json(users);
    } catch (err) {
        console.error("Error fetching users (Admin):", err);
        res.status(500).json({ error: 'Server error while fetching users.' });
    }
});

/**
 * ✅ NEW: CREATE A NEW USER (Admin only)
 * @route   POST /api/admin/users
 * @desc    Admin creates a new user (student or teacher)
 * @access  Private (Admin only)
 */
router.post('/users', auth, checkRole(ADMIN_ONLY), async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({ message: 'Please provide name, email, password, and role.' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'A user with this email already exists.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            role, 
        });

        await newUser.save();
        const userResponse = newUser.toObject();
        delete userResponse.password; 

        res.status(201).json({ message: 'User created successfully.', user: userResponse });

    } catch (err) {
        console.error("Error creating user (Admin):", err);
        res.status(500).json({ error: 'Server error while creating user.' });
    }
});

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Delete a user (Admins only)
 * @access  Private
 */
router.delete('/users/:id', auth, checkRole(ADMIN_ONLY), async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error("Error deleting user (Admin):", err);
        res.status(500).json({ error: 'Server error while deleting user.' });
    }
});

// =======================
//  CHALLENGE MANAGEMENT
// =======================
/**
 * @route   POST /api/admin/challenges
 * @desc    Create a new challenge (Admins only)
 * @access  Private
 */
router.post('/challenges', auth, checkRole(ADMIN_ONLY), async (req, res) => {
    try {
        const { title, description, points, icon } = req.body;
        const newChallenge = new Challenge({ title, description, points, icon });
        await newChallenge.save();
        res.status(201).json(newChallenge);
    } catch (err) {
        console.error("Error creating challenge (Admin):", err);
        res.status(500).json({ error: 'Server error while creating challenge.' });
    }
});

/**
 * @route   PUT /api/admin/challenges/:id
 * @desc    Update a challenge (Admins only)
 * @access  Private
 */
router.put('/challenges/:id', auth, checkRole(ADMIN_ONLY), async (req, res) => {
    try {
        const { title, description, points, icon } = req.body;
        const challenge = await Challenge.findByIdAndUpdate(
            req.params.id,
            { title, description, points, icon },
            { new: true, runValidators: true }
        );
        if (!challenge) {
            return res.status(404).json({ message: 'Challenge not found' });
        }
        res.json(challenge);
    } catch (err) {
        console.error("Error updating challenge (Admin):", err);
        res.status(500).json({ error: 'Server error while updating challenge.' });
    }
});

/**
 * @route   DELETE /api/admin/challenges/:id
 * @desc    Delete a challenge (Admins only)
 * @access  Private
 */
router.delete('/challenges/:id', auth, checkRole(ADMIN_ONLY), async (req, res) => {
    try {
        const challenge = await Challenge.findByIdAndDelete(req.params.id);
        if (!challenge) {
            return res.status(404).json({ message: 'Challenge not found' });
        }
        res.json({ message: 'Challenge deleted successfully' });
    } catch (err) {
        console.error("Error deleting challenge (Admin):", err);
        res.status(500).json({ error: 'Server error while deleting challenge.' });
    }
});

module.exports = router;