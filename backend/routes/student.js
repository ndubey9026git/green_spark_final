/**
 * Route file for Student-specific API endpoints.
 * All routes require authentication and the 'student' role.
 */
const express = require("express");
const router = express.Router();
// Import the standardized auth middleware
const auth = require("../middleware/authMiddleware");
// Import the centralized role checking utility
const checkRole = require("../middleware/checkRole");
const User = require("../models/User");
const Assignment = require('../models/Assignment');
const Challenge = require('../models/Challenge');
const GameProgress = require('../models/GameProgress');

// Define the required roles for Student routes
const STUDENT_ONLY = ['student'];

/**
 * @route   GET /api/student/profile
 * @desc    Get current student's profile
 * @access  Private (Student only)
 */
router.get("/profile", auth, checkRole(STUDENT_ONLY), async (req, res) => {
  try {
    const student = await User.findById(req.user.id).select(
      "name email ecoPoints badges role createdAt"
    );
    res.json(student);
  } catch (err) {
    console.error("Error fetching student profile:", err);
    res.status(500).json({ error: 'Server error while fetching profile.' });
  }
});

/**
 * @route   GET /api/student/assignments
 * @desc    Get all assignments for the logged-in student
 * @access  Private (Student only)
 */
router.get("/assignments", auth, checkRole(STUDENT_ONLY), async (req, res) => {
  try {
    const studentId = req.user.id;
    const assignments = await Assignment.find({ student: studentId })
      .populate('assignedBy', 'name')
      .sort({ createdAt: -1 });
    res.json(assignments);
  } catch (err) {
    console.error("Error fetching assignments:", err);
    res.status(500).json({ error: 'Server error while fetching assignments.' });
  }
});

/**
 * @route   GET /api/student/challenges
 * @desc    Get available challenges for students
 * @access  Private (Student only)
 */
router.get("/challenges", auth, checkRole(STUDENT_ONLY), async (req, res) => {
  try {
    const challenges = await Challenge.find({ isActive: true })
      .select('title description points ecoPoints reward badge')
      .sort({ createdAt: -1 });
    res.json(challenges);
  } catch (err) {
    console.error("Error fetching challenges:", err);
    res.status(500).json({ error: 'Server error while fetching challenges.' });
  }
});

/**
 * @route   GET /api/student/game-progress
 * @desc    Get student's game progress
 * @access  Private (Student only)
 */
router.get("/game-progress", auth, checkRole(STUDENT_ONLY), async (req, res) => {
  try {
    const progress = await GameProgress.find({ student: req.user.id })
      .populate('game', 'name description')
      .sort({ updatedAt: -1 });
    res.json(progress);
  } catch (err) {
    console.error("Error fetching game progress:", err);
    res.status(500).json({ error: 'Server error while fetching game progress.' });
  }
});

/**
 * @route   PUT /api/student/assignments/:id/complete
 * @desc    Mark an assignment as complete
 * @access  Private (Student only)
 */
router.put("/assignments/:id/complete", auth, checkRole(STUDENT_ONLY), async (req, res) => {
  try {
    const assignment = await Assignment.findOne({
      _id: req.params.id,
      student: req.user.id
    });

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found.' });
    }

    assignment.status = 'completed';
    assignment.completedAt = new Date();
    await assignment.save();

    // Award ecoPoints for completing the assignment
    const student = await User.findById(req.user.id);
    student.ecoPoints += assignment.points || 0;
    await student.save();

    res.json({ message: 'Assignment marked as complete.', assignment });
  } catch (err) {
    console.error("Error completing assignment:", err);
    res.status(500).json({ error: 'Server error while completing assignment.' });
  }
});

/**
 * @route   GET /api/student/leaderboard
 * @desc    Get student leaderboard ranking
 * @access  Private (Student only)
 */
router.get("/leaderboard", auth, checkRole(STUDENT_ONLY), async (req, res) => {
  try {
    const students = await User.find({ role: "student" })
      .sort({ ecoPoints: -1 })
      .select("name ecoPoints badges")
      .limit(20);

    // Find current student's rank
    const allStudents = await User.find({ role: "student" })
      .sort({ ecoPoints: -1 })
      .select("name");
    
    const rank = allStudents.findIndex(s => s._id.toString() === req.user.id) + 1;

    res.json({ rank, topStudents: students });
  } catch (err) {
    console.error("Error fetching leaderboard:", err);
    res.status(500).json({ error: 'Server error while fetching leaderboard.' });
  }
});

module.exports = router;