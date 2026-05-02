/**
 * Route file for Teacher-specific API endpoints.
 * All routes require authentication and teacher OR admin role.
 */
const express = require("express");
const router = express.Router();
// Assuming your token validation file is now named auth.js
const auth = require("../middleware/authMiddleware"); 
// Import the centralized role checking utility
const checkRole = require("../middleware/checkRole"); 
const User = require("../models/User");
const Assignment = require('../models/Assignment');
const Challenge = require('../models/Challenge');
const Notification = require('../models/Notification');

// Define the required roles for Teacher routes
// Admin needs access here too, so we include both.
const TEACHER_AND_ADMIN = ['teacher', 'admin'];

/**
 * @route   GET /api/teacher/students
 * @desc    Get all students
 * @access  Private (Teacher and Admin only)
 */
router.get("/students", auth, checkRole(TEACHER_AND_ADMIN), async (req, res) => {
  try {
    const students = await User.find({ role: "student" }).select(
      "name email ecoPoints badges"
    );
    res.json(students);
  } catch (err) {
    // Note: Logging the full error on the server is better than sending it directly to the client
    console.error("Error fetching students:", err);
    res.status(500).json({ error: 'Server error while fetching students.' });
  }
});

/**
 * @route   GET /api/teacher/assigned-students
 * @desc    Get a list of students the teacher has assigned tasks to
 * @access  Private (Teacher and Admin only)
 */
router.get('/assigned-students', auth, checkRole(TEACHER_AND_ADMIN), async (req, res) => {
    try {
        const teacherId = req.user.id; // Still uses req.user attached by auth middleware

        // Find all assignments created by this teacher
        const assignments = await Assignment.find({ assignedBy: teacherId }).populate('student');

        // Create a unique list of students from the assignments
        const assignedStudents = {};
        assignments.forEach(assignment => {
            if (assignment.student) { 
                assignedStudents[assignment.student._id] = assignment.student;
            }
        });
        
        const studentList = Object.values(assignedStudents);

        res.json(studentList);

    } catch (err) {
        console.error("Error fetching assigned students:", err);
        res.status(500).json({ error: 'Server error while fetching assigned students.' });
    }
});


/**
 * @route   POST /api/teacher/assignments
 * @desc    Assign a challenge to a student
 * @access  Private (Teacher and Admin only)
 */
router.post('/assignments', auth, checkRole(TEACHER_AND_ADMIN), async (req, res) => {
    try {
        const { challengeId, studentId, dueDate } = req.body;
        const teacherId = req.user.id;

        const existingAssignment = await Assignment.findOne({
            challenge: challengeId,
            student: studentId,
        });

        if (existingAssignment) {
            return res.status(400).json({ message: 'This challenge has already been assigned to this student.' });
        }

        const challenge = await Challenge.findById(challengeId).select('title');
        if (!challenge) {
            return res.status(404).json({ message: 'Challenge not found.' });
        }

        const newAssignment = new Assignment({
            challenge: challengeId,
            student: studentId,
            assignedBy: teacherId,
            dueDate: dueDate,
        });

        await newAssignment.save();

        await Notification.create({
            recipient: studentId,
            sender: teacherId,
            title: 'New challenge assigned',
            message: `A new challenge "${challenge.title}" has been assigned to you. Check your assignments to begin!`,
            type: 'assignment',
            link: '/student/assignments',
        });

        res.status(201).json({ message: 'Challenge assigned successfully.', assignment: newAssignment });

    } catch (err) {
        console.error("Error creating assignment:", err);
        res.status(500).json({ error: 'Server error while creating assignment.' });
    }
});

/**
 * @route   GET /api/teacher/students/:studentId/assignments
 * @desc    Get all assignments for a specific student
 * @access  Private (Teacher and Admin only)
 */
router.get('/students/:studentId/assignments', auth, checkRole(TEACHER_AND_ADMIN), async (req, res) => {
    try {
        const { studentId } = req.params;
        const assignments = await Assignment.find({ student: studentId })
            .populate('challenge', 'title points icon')
            .populate('assignedBy', 'name');

        res.json(assignments);
    } catch (err) {
        console.error("Error fetching assignments:", err);
        res.status(500).json({ error: 'Server error while fetching assignments.' });
    }
});

/**
 * @route   GET /api/teacher/analytics
 * @desc    Get analytics data for teacher's students
 * @access  Private (Teacher and Admin only)
 */
router.get('/analytics', auth, checkRole(TEACHER_AND_ADMIN), async (req, res) => {
    try {
        // Get all students
        const students = await User.find({ role: "student" }).select(
            "name email ecoPoints badges streak createdAt"
        );

        // Get all assignments
        const assignments = await Assignment.find()
            .populate('student', 'name')
            .populate('challenge', 'title points');

        // Calculate analytics
        const totalStudents = students.length;
        const totalAssignments = assignments.length;
        const completedAssignments = assignments.filter(a => a.status === 'completed').length;
        
        // Calculate average ecoPoints
        const avgEcoPoints = totalStudents > 0 
            ? Math.round(students.reduce((sum, s) => sum + (s.ecoPoints || 0), 0) / totalStudents)
            : 0;

        // Top performing students
        const topStudents = [...students]
            .sort((a, b) => (b.ecoPoints || 0) - (a.ecoPoints || 0))
            .slice(0, 5)
            .map(s => ({ name: s.name, ecoPoints: s.ecoPoints, streak: s.streak?.currentStreak || 0 }));

        // Assignment completion rate
        const completionRate = totalAssignments > 0 
            ? Math.round((completedAssignments / totalAssignments) * 100)
            : 0;

        // Students with active streaks
        const activeStreaks = students.filter(s => (s.streak?.currentStreak || 0) > 0).length;

        res.json({
            totalStudents,
            totalAssignments,
            completedAssignments,
            completionRate,
            avgEcoPoints,
            topStudents,
            activeStreaks,
            recentActivity: assignments.slice(-10).reverse()
        });
    } catch (err) {
        console.error("Error fetching analytics:", err);
        res.status(500).json({ error: 'Server error while fetching analytics.' });
    }
});

module.exports = router;